import { NextResponse } from "next/server";
import { verifyOmiseWebhook, getOmiseCharge } from "@/lib/omise";
import { prisma } from "@/lib/db";
import { activateSubscription, recordPayment } from "@/lib/subscription";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("x-omise-signature");
  if (!verifyOmiseWebhook(body, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventKey = payload.key ?? payload.event;
  const data = payload.data;
  if (!data?.id) return NextResponse.json({ received: true });

  try {
    if (eventKey === "charge.complete") {
      // Fetch full charge details
      const charge = await getOmiseCharge(data.id).catch(() => null);
      if (!charge || charge.status !== "successful") return NextResponse.json({ received: true });

      const tenantId = charge.metadata?.tenantId;
      if (!tenantId) return NextResponse.json({ received: true });

      const sub = await activateSubscription({
        tenantId,
        provider: "OMISE",
        providerSubscriptionId: charge.id,
        periodDays: 30,
      });

      await recordPayment({
        subscriptionId: sub.id,
        provider: "OMISE",
        providerPaymentId: charge.id,
        amount: charge.amount / 100,
        status: "SUCCEEDED",
      });
    } else if (eventKey === "charge.failed") {
      const charge = data;
      const sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: charge.id },
      });
      if (sub) {
        await recordPayment({
          subscriptionId: sub.id,
          provider: "OMISE",
          providerPaymentId: charge.id,
          amount: charge.amount ? charge.amount / 100 : 0,
          status: "FAILED",
        });
      }
    }
  } catch (err) {
    console.error("Omise webhook error:", err);
  }

  return NextResponse.json({ received: true });
}
