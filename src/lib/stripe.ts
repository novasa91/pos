// Stripe client and helpers
// All methods are no-ops if STRIPE_SECRET_KEY is missing (demo mode)
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key
  ? new Stripe(key, { apiVersion: "2024-09-30.acacia" as Stripe.LatestApiVersion })
  : null;

export function isStripeEnabled(): boolean {
  return !!stripe && !!process.env.STRIPE_PRICE_ID;
}

export async function createStripeCheckoutSession(params: {
  tenantId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: "Stripe is not configured" };

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return { error: "STRIPE_PRICE_ID is not set" };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: params.email,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: params.trialDays
      ? { trial_period_days: params.trialDays }
      : undefined,
    metadata: { tenantId: params.tenantId },
    allow_promotion_codes: true,
  });

  if (!session.url) return { error: "No checkout URL returned" };
  return { url: session.url };
}

export async function createStripePortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: "Stripe is not configured" };
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  return { url: session.url };
}

export async function getStripeSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}
