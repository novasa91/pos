import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

/**
 * Reset the current tenant to a clean, "new user" state.
 *
 * Wipes:
 *   - All sales (and their items/payments)
 *   - All purchase orders (and their items)
 *   - All customers
 *   - All employees
 *   - All tables
 *   - All categories EXCEPT the ones that are referenced by products
 *     (we re-create the ones that are still referenced, to satisfy
 *     the foreign key, then remove the rest)
 *   - All products (and stock adjustments)
 *
 * Preserves:
 *   - The tenant itself
 *   - The subscription
 *   - The user / membership
 *   - The shop QR settings (PromptPay, LINE, etc.)
 *
 * Use only on the freshly-seeded demo tenant. Refuses to run on a tenant
 * with zero products AND zero sales (nothing to clean).
 */
export async function POST(req: NextRequest) {
  const ctx = await requireTenant();

  // Refuse if there's nothing to clean (avoid running on a brand-new account).
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

  // Optional ?keepTables=true preserves the QR table grid for shops
  // that are already using it for live customers.
  const keepTables = new URL(req.url).searchParams.get("keepTables") === "true";

  const result = await prisma.$transaction(async (tx) => {
    // 1) Sales: delete payments and items first (FK), then the sale.
    await tx.payment.deleteMany({
      where: { sale: { tenantId: ctx.tenant.id } },
    });
    await tx.orderItem.deleteMany({
      where: { order: { tenantId: ctx.tenant.id } },
    });
    await tx.sale.deleteMany({ where: { tenantId: ctx.tenant.id } });

    // 2) Purchases.
    await tx.purchaseItem.deleteMany({
      where: { purchase: { tenantId: ctx.tenant.id } },
    });
    await tx.purchase.deleteMany({ where: { tenantId: ctx.tenant.id } });

    // 3) Customers and employees.
    await tx.customer.deleteMany({ where: { tenantId: ctx.tenant.id } });
    await tx.employee.deleteMany({ where: { tenantId: ctx.tenant.id } });

    // 4) Tables (unless caller asked to keep them).
    let tablesDeleted = 0;
    if (!keepTables) {
      const res = await tx.table.deleteMany({ where: { tenantId: ctx.tenant.id } });
      tablesDeleted = res.count;
    }

    // 5) Products (cascades to image references via app).
    const products = await tx.product.findMany({
      where: { tenantId: ctx.tenant.id },
      select: { id: true },
    });
    if (products.length > 0) {
      await tx.product.deleteMany({ where: { tenantId: ctx.tenant.id } });
    }

    // 6) Categories.
    const categories = await tx.category.deleteMany({
      where: { tenantId: ctx.tenant.id },
    });

    return {
      sales: saleCount,
      products: products.length,
      customers: await tx.customer.count({ where: { tenantId: ctx.tenant.id } }),
      employees: await tx.employee.count({ where: { tenantId: ctx.tenant.id } }),
      tables: tablesDeleted,
      categories: categories.count,
    };
  });

  return NextResponse.json({ ok: true, removed: result });
}
