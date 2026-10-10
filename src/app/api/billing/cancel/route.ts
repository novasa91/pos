import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelSubscription } from "@/lib/subscription";
import { stripe, createStripePortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = session.user.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) {
    return NextResponse.json({ error: "No subscription" }, { status: 404 });
  }

  if (sub.provider === "STRIPE" && stripe && sub.providerCustomerId) {
    // For Stripe, we send the user to the Customer Portal to cancel
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await createStripePortalSession({
      customerId: sub.providerCustomerId,
      returnUrl: `${appUrl}/billing`,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ url: result.url });
  }

  // For Omise or no provider, we cancel directly
  await cancelSubscription(tenantId, false);
  return NextResponse.json({ success: true });
}
