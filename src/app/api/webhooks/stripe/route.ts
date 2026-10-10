import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { activateSubscription, markPastDue, cancelSubscription } from "@/lib/subscription";
import type Stripe from "stripe";

export async function POST(req: Request) {
  if (!isStripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        if (tenantId) {
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          await activateSubscription({
            tenantId,
            provider: "STRIPE",
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata?.tenantId;
        if (tenantId) {
          const periodStart = new Date((sub as any).current_period_start * 1000);
          const periodEnd = new Date((sub as any).current_period_end * 1000);
          await prisma.subscription.update({
            where: { tenantId },
            data: {
              status: sub.status === "active" ? "ACTIVE" : sub.status === "trialing" ? "TRIALING" : sub.status === "past_due" ? "PAST_DUE" : sub.status === "canceled" ? "CANCELED" : "ACTIVE",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata?.tenantId;
        if (tenantId) await cancelSubscription(tenantId, true);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = (inv as any).subscription;
        if (subId) {
          const sub = await prisma.subscription.findFirst({ where: { providerSubscriptionId: subId } });
          if (sub) await markPastDue(sub.tenantId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
