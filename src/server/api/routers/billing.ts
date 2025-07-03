import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { 
  tenants, 
  students
} from "@/server/db/schema";

// Initialize Stripe with build-time safety
let stripe: Stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
  } else {
    console.log("Stripe not initialized - missing STRIPE_SECRET_KEY");
    // Create a mock stripe object for build time
    stripe = {} as Stripe;
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripe = {} as Stripe;
}

export const billingRouter = createTRPCRouter({
  // Get current subscription status
  getSubscriptionStatus: guardianProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (!tenant[0]) {
      throw new Error("Tenant not found");
    }

    const currentTenant = tenant[0];

    // Get active student count
    const activeStudents = await ctx.db
      .select()
      .from(students)
      .where(eq(students.tenantId, ctx.tenantId));

    const studentCount = activeStudents.length;

    // Get current subscription
    let subscription = null;
    if (currentTenant.subscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(currentTenant.subscriptionId);
      } catch (error) {
        console.error("Failed to retrieve Stripe subscription:", error);
      }
    }

    // Calculate pricing
    const basePrice = 8.00; // $8 per student per month
    let discount = 0;
    let discountPercentage = 0;

    if (studentCount >= 4) {
      discountPercentage = 20;
    } else if (studentCount >= 3) {
      discountPercentage = 15;
    } else if (studentCount >= 2) {
      discountPercentage = 10;
    }

    discount = (basePrice * studentCount * discountPercentage) / 100;
    const monthlyPrice = (basePrice * studentCount) - discount;
    const annualPrice = monthlyPrice * 12 * 0.833; // 16.7% annual discount (2 months free)

    // Determine trial status
    const now = new Date();
    const isInTrial = currentTenant.trialEndsAt ? now < currentTenant.trialEndsAt : false;
    const trialDaysRemaining = currentTenant.trialEndsAt ? 
      Math.max(0, Math.ceil((currentTenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    return {
      tenant: {
        id: currentTenant.id,
        name: currentTenant.name,
        email: currentTenant.primaryEmail,
        customerId: currentTenant.customerId,
        trialEndsAt: currentTenant.trialEndsAt,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        items: (subscription as any).items?.data || [],
      } : null,
      trial: {
        isActive: isInTrial,
        daysRemaining: trialDaysRemaining,
        endsAt: currentTenant.trialEndsAt,
      },
      students: {
        count: studentCount,
        active: activeStudents.map(s => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
        })),
      },
      pricing: {
        basePrice,
        studentCount,
        discountPercentage,
        monthlyTotal: monthlyPrice,
        annualTotal: annualPrice,
        savings: {
          multiStudent: discount,
          annual: monthlyPrice * 12 - annualPrice,
        },
      },
      features: {
        canGenerateTranscripts: !isInTrial || (subscription?.status === "active"),
        hasWatermark: isInTrial && subscription?.status !== "active",
        maxStudents: subscription?.status === "active" ? null : (isInTrial ? null : 1),
      },
    };
  }),

  // Create Stripe customer and checkout session
  createCheckoutSession: guardianProcedure
    .input(z.object({
      priceType: z.enum(["monthly", "annual"]),
      studentCount: z.number().min(1).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      if (!tenant[0]) {
        throw new Error("Tenant not found");
      }

      const currentTenant = tenant[0];

      // Create or get Stripe customer
      let customerId = currentTenant.customerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: currentTenant.primaryEmail,
          name: currentTenant.name,
          metadata: {
            tenantId: ctx.tenantId,
          },
        });
        
        customerId = customer.id;
        
        // Update tenant with customer ID
        await ctx.db
          .update(tenants)
          .set({ customerId: customerId })
          .where(eq(tenants.id, ctx.tenantId));
      }

      // Calculate pricing
      const basePrice = 8.00;
      let discountPercentage = 0;
      
      if (input.studentCount >= 4) {
        discountPercentage = 20;
      } else if (input.studentCount >= 3) {
        discountPercentage = 15;
      } else if (input.studentCount >= 2) {
        discountPercentage = 10;
      }

      const discount = (basePrice * input.studentCount * discountPercentage) / 100;
      const monthlyPrice = (basePrice * input.studentCount) - discount;
      const finalPrice = input.priceType === "annual" ? monthlyPrice * 0.833 : monthlyPrice;

      // Create price in Stripe
      const price = await stripe.prices.create({
        unit_amount: Math.round(finalPrice * 100), // Convert to cents
        currency: "usd",
        recurring: {
          interval: input.priceType === "annual" ? "year" : "month",
        },
        product_data: {
          name: `Homeschool Transcript Tracker - ${input.studentCount} Student${input.studentCount > 1 ? 's' : ''}`,
        },
        metadata: {
          tenantId: ctx.tenantId,
          studentCount: input.studentCount.toString(),
          basePrice: basePrice.toString(),
          discountPercentage: discountPercentage.toString(),
        },
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/billing`,
        metadata: {
          tenantId: ctx.tenantId,
          studentCount: input.studentCount.toString(),
        },
        subscription_data: {
          metadata: {
            tenantId: ctx.tenantId,
            studentCount: input.studentCount.toString(),
          },
        },
        allow_promotion_codes: true,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  // Handle subscription changes
  updateSubscription: guardianProcedure
    .input(z.object({
      action: z.enum(["cancel", "reactivate", "update_quantity"]),
      studentCount: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      if (!tenant[0]?.subscriptionId) {
        throw new Error("No active subscription found");
      }

      const subscriptionId = tenant[0].subscriptionId;

      switch (input.action) {
        case "cancel":
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });
          break;

        case "reactivate":
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
          });
          break;

        case "update_quantity":
          if (!input.studentCount) {
            throw new Error("Student count required for quantity update");
          }
          
          // Get current subscription
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const currentItem = subscription.items.data[0];
          
          if (!currentItem) {
            throw new Error("No subscription items found");
          }

          // Calculate new pricing
          const basePrice = 8.00;
          let discountPercentage = 0;
          
          if (input.studentCount >= 4) {
            discountPercentage = 20;
          } else if (input.studentCount >= 3) {
            discountPercentage = 15;
          } else if (input.studentCount >= 2) {
            discountPercentage = 10;
          }

          const discount = (basePrice * input.studentCount * discountPercentage) / 100;
          const monthlyPrice = (basePrice * input.studentCount) - discount;
          
          // Get current price to determine if annual
          const currentPrice = await stripe.prices.retrieve(currentItem.price.id);
          const isAnnual = currentPrice.recurring?.interval === "year";
          const finalPrice = isAnnual ? monthlyPrice * 0.833 : monthlyPrice;

          // Create new price
          const newPrice = await stripe.prices.create({
            unit_amount: Math.round(finalPrice * 100),
            currency: "usd",
            recurring: {
              interval: isAnnual ? "year" : "month",
            },
            product_data: {
              name: `Homeschool Transcript Tracker - ${input.studentCount} Student${input.studentCount > 1 ? 's' : ''}`,
            },
            metadata: {
              tenantId: ctx.tenantId,
              studentCount: input.studentCount.toString(),
              basePrice: basePrice.toString(),
              discountPercentage: discountPercentage.toString(),
            },
          });

          // Update subscription item
          await stripe.subscriptionItems.update(currentItem.id, {
            price: newPrice.id,
          });
          break;
      }

      return { success: true };
    }),

  // Get billing history
  getBillingHistory: guardianProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (!tenant[0]?.customerId) {
      return { invoices: [], paymentMethods: [] };
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: tenant[0].customerId,
      limit: 12, // Last 12 invoices
    });

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: tenant[0].customerId,
      type: "card",
    });

    return {
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountPaid: invoice.amount_paid / 100,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      })),
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
    };
  }),

  // Create customer portal session
  createPortalSession: guardianProcedure.mutation(async ({ ctx }) => {
    const tenant = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (!tenant[0]?.customerId) {
      throw new Error("No Stripe customer found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant[0].customerId,
      return_url: `${process.env.NEXTAUTH_URL}/billing`,
    });

    return {
      portalUrl: session.url,
    };
  }),

  // Webhook handler for Stripe events (for Next.js API route)
  processWebhook: guardianProcedure
    .input(z.object({
      event: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = input.event;

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          const subscription = event.data.object;
          const tenantId = subscription.metadata.tenantId;
          
          if (tenantId) {
            await ctx.db
              .update(tenants)
              .set({
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                trialEndsAt: subscription.status === "active" ? null : undefined,
              })
              .where(eq(tenants.id, tenantId));
          }
          break;

        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          const deletedTenantId = deletedSubscription.metadata.tenantId;
          
          if (deletedTenantId) {
            await ctx.db
              .update(tenants)
              .set({
                subscriptionId: null,
                subscriptionStatus: "cancelled",
              })
              .where(eq(tenants.id, deletedTenantId));
          }
          break;

        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          // Store invoice record if needed
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          // Handle failed payment
          break;
      }

      return { received: true };
    }),
});