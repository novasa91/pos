"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenant, getTenantOptional } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  points: z.coerce.number().int().min(0).default(0),
});

export async function listCustomers(search?: string) {
  const ctx = await getTenantOptional();
  if (!ctx) return [];
  return prisma.customer.findMany({
    where: {
      tenantId: ctx.tenant.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function createCustomer(formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "customers.write");
  const data = customerSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    points: formData.get("points") || 0,
  });
  await prisma.customer.create({
    data: { ...data, tenantId: ctx.tenant.id },
  });
  revalidatePath("/app/customers");
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "customers.write");
  const data = customerSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    points: formData.get("points") || 0,
  });
  await prisma.customer.updateMany({
    where: { id, tenantId: ctx.tenant.id },
    data,
  });
  revalidatePath("/app/customers");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "customers.delete");
  await prisma.customer.deleteMany({
    where: { id, tenantId: ctx.tenant.id },
  });
  revalidatePath("/app/customers");
  return { success: true };
}
