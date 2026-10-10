import { requireTenant } from "@/lib/tenant";
import { searchProducts } from "./actions";
import { PosTerminal } from "./pos-terminal";

export default async function PosPage() {
  const ctx = await requireTenant();
  const initialProducts = await searchProducts("", 50);

  return (
    <PosTerminal
      tenant={{
        id: ctx.tenant.id,
        name: ctx.tenant.name,
        currency: ctx.tenant.currency,
        vatEnabled: ctx.tenant.vatEnabled,
        vatRate: ctx.tenant.vatRate,
        vatInclusive: ctx.tenant.vatInclusive,
      }}
      initialProducts={initialProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
        stock: p.stock,
        trackStock: p.trackStock,
        categoryName: p.category?.name ?? null,
        imageUrl: p.imageUrl,
      }))}
    />
  );
}
