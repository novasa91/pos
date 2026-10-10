import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Tenant, Subscription } from "@prisma/client";

export type TenantContext = {
  userId: string;
  email: string;
  name: string | null;
  tenant: Tenant;
  role: "OWNER" | "MANAGER" | "CASHIER";
  subscription: Subscription | null;
  isSubscriptionActive: boolean;
};

export async function getSession() {
  return await auth();
}

/**
 * Server-side: get current tenant context (user + active tenant + role + subscription).
 * Redirects to /login if not signed in, /select-tenant if no active tenant,
 * /billing/expired if subscription is not active.
 */
export async function requireTenant(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenantId = session.user.activeTenantId;
  if (!tenantId) redirect("/select-tenant");

  const membership = await prisma.userOnTenant.findFirst({
    where: { userId: session.user.id, tenantId, isActive: true },
    include: { tenant: true },
  });
  if (!membership) redirect("/select-tenant");

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  const isActive = checkSubscriptionActive(subscription);
  if (!isActive) redirect("/billing/expired");

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    tenant: membership.tenant,
    role: membership.role as "OWNER" | "MANAGER" | "CASHIER",
    subscription,
    isSubscriptionActive: isActive,
  };
}

/**
 * Same as requireTenant but doesn't redirect — returns null if no tenant.
 * Useful for pages that should work without a tenant (e.g. settings).
 */
export async function getTenantOptional(): Promise<TenantContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tenantId = session.user.activeTenantId;
  if (!tenantId) return null;

  const membership = await prisma.userOnTenant.findFirst({
    where: { userId: session.user.id, tenantId, isActive: true },
    include: { tenant: true },
  });
  if (!membership) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    tenant: membership.tenant,
    role: membership.role as "OWNER" | "MANAGER" | "CASHIER",
    subscription,
    isSubscriptionActive: checkSubscriptionActive(subscription),
  };
}

export function checkSubscriptionActive(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === "ACTIVE") return true;
  if (sub.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt > new Date()) {
    return true;
  }
  return false;
}
