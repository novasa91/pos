"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantOptional } from "@/lib/tenant";

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function listSales(input: Partial<z.infer<typeof querySchema>>) {
  const ctx = await getTenantOptional();
  if (!ctx) return [];
  const { from, to, search, limit } = querySchema.parse(input);

  return prisma.sale.findMany({
    where: {
      tenantId: ctx.tenant.id,
      ...(from ? { createdAt: { gte: new Date(from) } } : {}),
      ...(to ? { createdAt: { lte: new Date(to) } } : {}),
      ...(search ? { receiptNo: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      customer: { select: { name: true } },
      payments: true,
      items: { select: { id: true, quantity: true } },
    },
  });
}

export async function getSale(id: string) {
  const ctx = await getTenantOptional();
  if (!ctx) return null;
  return prisma.sale.findFirst({
    where: { id, tenantId: ctx.tenant.id },
    include: {
      user: { select: { name: true, email: true } },
      customer: true,
      payments: true,
      items: true,
      shift: true,
    },
  });
}
