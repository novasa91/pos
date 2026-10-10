// Subscription helpers — create, activate, cancel, expire
import { prisma } from "@/lib/db";

export async function createTrialSubscription(tenantId: string, trialDays: number = 7) {
  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + trialDays);

  return prisma.subscription.create({
    data: {
      tenantId,
      plan: "STANDARD",
      status: "TRIALING",
      trialEndsAt: trialEnds,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnds,
    },
  });
}

export async function activateSubscription(params: {
  tenantId: string;
  provider: "STRIPE" | "OMISE";
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  periodDays?: number;
}) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + (params.periodDays ?? 30));

  return prisma.subscription.upsert({
    where: { tenantId: params.tenantId },
    create: {
      tenantId: params.tenantId,
      plan: "STANDARD",
      status: "ACTIVE",
      provider: params.provider,
      providerSubscriptionId: params.providerSubscriptionId,
      providerCustomerId: params.providerCustomerId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      status: "ACTIVE",
      provider: params.provider,
      providerSubscriptionId: params.providerSubscriptionId,
      providerCustomerId: params.providerCustomerId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      canceledAt: null,
      cancelAtPeriodEnd: false,
    },
  });
}

export async function recordPayment(params: {
  subscriptionId: string;
  provider: "STRIPE" | "OMISE";
  providerPaymentId?: string;
  amount: number;
  currency?: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
}) {
  return prisma.subscriptionPayment.create({
    data: {
      subscriptionId: params.subscriptionId,
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
      amount: params.amount,
      currency: params.currency ?? "THB",
      status: params.status,
    },
  });
}

export async function cancelSubscription(tenantId: string, immediate: boolean = false) {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return null;

  if (immediate) {
    return prisma.subscription.update({
      where: { tenantId },
      data: { status: "CANCELED", canceledAt: new Date(), cancelAtPeriodEnd: false },
    });
  }
  return prisma.subscription.update({
    where: { tenantId },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });
}

export async function markExpired(tenantId: string) {
  return prisma.subscription.update({
    where: { tenantId },
    data: { status: "EXPIRED" },
  });
}

export async function markPastDue(tenantId: string) {
  return prisma.subscription.update({
    where: { tenantId },
    data: { status: "PAST_DUE" },
  });
}
