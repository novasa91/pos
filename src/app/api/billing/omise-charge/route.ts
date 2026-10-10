import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOmisePromptPayCharge, isOmiseEnabled } from "@/lib/omise";
import { activateSubscription, recordPayment } from "@/lib/subscription";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  if (!isOmiseEnabled()) {
    return NextResponse.json(
      { error: "Omise is not configured", demo: true },
      { status: 400 },
    );
  }

  const amount = parseInt(process.env.NEXT_PUBLIC_PLAN_PRICE_THB || "499", 10) * 100;

  try {
    const charge = await createOmisePromptPayCharge({
      amount,
      email: session.user.email,
      description: `POS Cloud — Monthly subscription (${tenantId})`,
      metadata: { tenantId },
    });

    // Record pending payment
    const sub = await prisma.subscription.findUnique({ where: { tenantId } });
    if (sub) {
      await recordPayment({
        subscriptionId: sub.id,
        provider: "OMISE",
        providerPaymentId: charge.id,
        amount: amount / 100,
        status: "PENDING",
      });
    }

    return NextResponse.json({
      chargeId: charge.id,
      authorizeUri: charge.authorizeUri,
      amount: amount / 100,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create charge" },
      { status: 500 },
    );
  }
}
