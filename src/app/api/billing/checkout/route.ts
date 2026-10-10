import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createStripeCheckoutSession, isStripeEnabled } from "@/lib/stripe";

const bodySchema = z.object({
  provider: z.enum(["STRIPE", "OMISE"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { provider } = parsed.data;
  const tenantId = session.user.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  // Verify user is owner/manager of the tenant
  const membership = await prisma.userOnTenant.findFirst({
    where: { userId: session.user.id, tenantId, isActive: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trialDays = parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || "7", 10);

  if (provider === "STRIPE") {
    if (!isStripeEnabled()) {
      return NextResponse.json(
        {
          error: "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to your .env",
          demo: true,
        },
        { status: 400 },
      );
    }
    const result = await createStripeCheckoutSession({
      tenantId,
      email: session.user.email,
      successUrl: `${appUrl}/billing/success?provider=stripe`,
      cancelUrl: `${appUrl}/billing?canceled=1`,
      trialDays,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ url: result.url });
  }

  if (provider === "OMISE") {
    if (!process.env.OMISE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "Omise is not configured. Add OMISE_SECRET_KEY to your .env",
          demo: true,
        },
        { status: 400 },
      );
    }
    // For Omise, we generate a PromptPay charge for the current period
    const amount = parseInt(process.env.NEXT_PUBLIC_PLAN_PRICE_THB || "499", 10) * 100; // satang
    return NextResponse.json({
      provider: "OMISE",
      amount,
      currency: "THB",
      nextEndpoint: "/api/billing/omise-charge",
      tenantId,
    });
  }

  return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
}
