import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/server/db";
import { tenants } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe with build-time safety
let stripe: Stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
} else {
  console.log("Stripe webhook handler - missing STRIPE_SECRET_KEY");
  stripe = {} as Stripe;
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;
        
        if (tenantId) {
          await db
            .update(tenants)
            .set({
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              // Clear trial if subscription becomes active
              trialEndsAt: subscription.status === "active" ? null : undefined,
            })
            .where(eq(tenants.id, tenantId));
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const deletedTenantId = deletedSubscription.metadata.tenantId;
        
        if (deletedTenantId) {
          await db
            .update(tenants)
            .set({
              stripeSubscriptionId: null,
              subscriptionStatus: "canceled",
            })
            .where(eq(tenants.id, deletedTenantId));
        }
        break;

      case "invoice.payment_succeeded":
        const successfulInvoice = event.data.object as Stripe.Invoice;
        // Could store invoice records here if needed
        console.log(`Payment succeeded for invoice: ${successfulInvoice.id}`);
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        // Could handle failed payments here (e.g., send notification emails)
        console.log(`Payment failed for invoice: ${failedInvoice.id}`);
        break;

      case "customer.subscription.trial_will_end":
        const trialEndingSubscription = event.data.object as Stripe.Subscription;
        // Could send trial ending notification here
        console.log(`Trial ending soon for subscription: ${trialEndingSubscription.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}