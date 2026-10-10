import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PurchasesView } from "./purchases-view";
import { BackButton } from "@/components/back-button";

export default async function PurchasesPage() {
  const ctx = await requireTenant();
  const [purchases, suppliers, products] = await Promise.all([
    prisma.purchase.findMany({
      where: { tenantId: ctx.tenant.id },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    }),
    prisma.supplier.findMany({
      where: { tenantId: ctx.tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { tenantId: ctx.tenant.id, isActive: true },
      select: { id: true, name: true, sku: true, stock: true, cost: true, price: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <BackButton href="/app" />
      </div>
      <PurchasesView
        initialPurchases={purchases as any}
        suppliers={suppliers as any}
        products={products as any}
      />
    </>
  );
}
