import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/server/db";
import { tenants } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe with build-time safety
let stripe: Stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
} else {
  // Stripe webhook handler - missing STRIPE_SECRET_KEY
  stripe = {} as Stripe;
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed:`, message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Map Stripe subscription statuses to our app's enum values
    const mapStripeStatus = (status: string): "trial" | "active" | "past_due" | "cancelled" | "suspended" => {
      const statusMap: Record<string, "trial" | "active" | "past_due" | "cancelled" | "suspended"> = {
        trialing: "trial",
        active: "active",
        past_due: "past_due",
        canceled: "cancelled",
        unpaid: "suspended",
        incomplete: "suspended",
        incomplete_expired: "cancelled",
        paused: "suspended",
      };
      return statusMap[status] ?? "suspended";
    };

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await db
            .update(tenants)
            .set({
              subscriptionId: subscription.id,
              subscriptionStatus: mapStripeStatus(subscription.status),
              // Clear trial if subscription becomes active
              trialEndsAt: subscription.status === "active" ? null : undefined,
            })
            .where(eq(tenants.id, tenantId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSubscription = event.data.object;
        const deletedTenantId = deletedSubscription.metadata.tenantId;

        if (deletedTenantId) {
          await db
            .update(tenants)
            .set({
              subscriptionId: null,
              subscriptionStatus: "cancelled",
            })
            .where(eq(tenants.id, deletedTenantId));
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "customer.subscription.trial_will_end":
        // These events are acknowledged but not yet handled
        break;

      default:
        // Unhandled event type - no action needed
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