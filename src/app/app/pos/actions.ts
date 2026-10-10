"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { generateReceiptNo } from "@/lib/receipt";
import { computePrice } from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  discount: z.number().min(0).default(0),
  price: z.number().min(0),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "TRANSFER", "PROMPTPAY", "OTHER"]),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
  discount: z.number().min(0).default(0),
  payments: z.array(paymentSchema).min(1),
  notes: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export async function createSale(input: CreateSaleInput) {
  const ctx = await requireTenant();
  const parsed = createSaleSchema.parse(input);

  // Use a longer interactive-transaction timeout because the default 5s
  // is too short on Vercel (serverless cold start + SQLite write latency).
  return await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
    // 1. Validate stock
    const productIds = parsed.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, tenantId: ctx.tenant.id },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of parsed.items) {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      if (p.trackStock && p.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${p.name}`);
      }
    }

    // 2. Calculate totals
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    const itemRows: Array<{
      productId: string;
      productName: string;
      sku: string | null;
      price: number;
      quantity: number;
      discount: number;
      total: number;
    }> = [];

    for (const item of parsed.items) {
      const p = productMap.get(item.productId)!;
      const calc = computePrice(
        { unitPrice: item.price, quantity: item.quantity, discount: item.discount },
        ctx.tenant,
      );
      subtotal += calc.subtotal;
      tax += calc.tax;
      total += calc.total;
      itemRows.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        total: calc.total,
      });
    }

    // Apply overall discount
    const totalDiscount = parsed.discount;
    total = Math.max(0, total - totalDiscount);

    // 3. Validate payment total
    const paid = parsed.payments.reduce((sum, p) => sum + p.amount, 0);
    if (paid < total) throw new Error("Payment total is less than sale total");
    const change = paid - total;

    // 4. Generate receipt number
    const receiptNo = await generateReceiptNo(ctx.tenant.id);

    // 5. Find or create open shift
    const shift = await tx.shift.findFirst({
      where: { tenantId: ctx.tenant.id, userId: ctx.userId, status: "OPEN" },
    });

    // 6. Create sale
    const sale = await tx.sale.create({
      data: {
        tenantId: ctx.tenant.id,
        shiftId: shift?.id,
        userId: ctx.userId,
        customerId: parsed.customerId ?? null,
        receiptNo,
        subtotal: round2(subtotal),
        discount: round2(totalDiscount + parsed.items.reduce((s, i) => s + i.discount, 0)),
        tax: round2(tax),
        total: round2(total),
        paid: round2(paid),
        change: round2(change),
        status: "COMPLETED",
        notes: parsed.notes,
        items: { create: itemRows.map((r) => ({ ...r, total: round2(r.total) })) },
        payments: {
          create: parsed.payments.map((p) => ({
            method: p.method,
            amount: round2(p.amount),
            reference: p.reference,
          })),
        },
      },
      include: { items: true, payments: true },
    });

    // 7. Decrement stock
    for (const item of parsed.items) {
      const p = productMap.get(item.productId)!;
      if (p.trackStock) {
        await tx.product.update({
          where: { id: p.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // 8. Update customer stats
    if (parsed.customerId) {
      await tx.customer.update({
        where: { id: parsed.customerId },
        data: {
          totalSpent: { increment: total },
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });
    }

    // 9. Update shift totals
    if (shift) {
      const cashSales = parsed.payments
        .filter((p) => p.method === "CASH")
        .reduce((s, p) => s + p.amount, 0);
      await tx.shift.update({
        where: { id: shift.id },
        data: {
          totalSales: { increment: total },
          cashSales: { increment: cashSales },
        },
      });
    }

    revalidatePath("/app/pos");
    revalidatePath("/app/sales");
    revalidatePath("/app");
    revalidatePath("/app/reports");

    return sale;
    },
    { timeout: 15000, maxWait: 10000 },
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function searchProducts(query: string, limit: number = 20) {
  const ctx = await requireTenant();
  const q = query.trim();
  if (!q) {
    return prisma.product.findMany({
      where: { tenantId: ctx.tenant.id, isActive: true },
      orderBy: { name: "asc" },
      take: limit,
      include: { category: { select: { name: true } } },
    });
  }
  return prisma.product.findMany({
    where: {
      tenantId: ctx.tenant.id,
      isActive: true,
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    include: { category: { select: { name: true } } },
  });
}

export async function getProductByBarcode(barcode: string) {
  const ctx = await requireTenant();
  return prisma.product.findFirst({
    where: { tenantId: ctx.tenant.id, barcode, isActive: true },
  });
}

export async function searchCustomers(query: string) {
  const ctx = await requireTenant();
  const q = query.trim();
  if (!q) {
    return prisma.customer.findMany({
      where: { tenantId: ctx.tenant.id },
      orderBy: { name: "asc" },
      take: 20,
    });
  }
  return prisma.customer.findMany({
    where: {
      tenantId: ctx.tenant.id,
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { name: "asc" },
  });
}
