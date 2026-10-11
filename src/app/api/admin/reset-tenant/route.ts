import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

/**
 * Reset the current tenant to a clean, "new user" state.
 *
 * Wipes: orders, sales, purchases, customers, employees, tables, products,
 * categories. Preserves tenant / user / subscription / shop settings.
 *
 * Run sequentially (not in a single $transaction) to avoid Vercel's
 * 10s function limit on slow SQLite writes, and so that a single
 * statement failure surfaces immediately.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireTenant();

  const [productCount, saleCount] = await Promise.all([
    prisma.product.count({ where: { tenantId: ctx.tenant.id } }),
    prisma.sale.count({ where: { tenantId: ctx.tenant.id } }),
  ]);
  if (productCount === 0 && saleCount === 0) {
    return NextResponse.json(
      { ok: false, error: "Nothing to clean (already empty)." },
      { status: 400 },
    );
  }

  const keepTables = new URL(req.url).searchParams.get("keepTables") === "true";
  const counts: Record<string, number> = {};

  try {
    // 1) Customer (online) orders: items first, then orders.
    counts.orderItems = (
      await prisma.orderItem.deleteMany({
        where: { order: { tenantId: ctx.tenant.id } },
      })
    ).count;
    counts.orders = (
      await prisma.order.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    // 2) Sales: payments + items first, then sales.
    counts.salePayments = (
      await prisma.salePayment.deleteMany({
        where: { sale: { tenantId: ctx.tenant.id } },
      })
    ).count;
    counts.saleItems = (
      await prisma.saleItem.deleteMany({
        where: { sale: { tenantId: ctx.tenant.id } },
      })
    ).count;
    counts.sales = (
      await prisma.sale.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    // 3) Purchases.
    counts.purchaseItems = (
      await prisma.purchaseItem.deleteMany({
        where: { purchase: { tenantId: ctx.tenant.id } },
      })
    ).count;
    counts.purchases = (
      await prisma.purchase.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    // 4) Customers, employees.
    counts.customers = (
      await prisma.customer.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;
    counts.employees = (
      await prisma.employee.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    // 5) Tables (unless caller asked to keep them).
    if (!keepTables) {
      counts.tables = (
        await prisma.table.deleteMany({ where: { tenantId: ctx.tenant.id } })
      ).count;
    } else {
      counts.tables = 0;
    }

    // 6) Products.
    counts.products = (
      await prisma.product.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    // 7) Categories.
    counts.categories = (
      await prisma.category.deleteMany({ where: { tenantId: ctx.tenant.id } })
    ).count;

    return NextResponse.json({ ok: true, removed: counts });
  } catch (err) {
    console.error("[reset-tenant] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        partialRemoved: counts,
      },
      { status: 500 },
    );
  }
}
