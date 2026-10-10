import { listProducts, listCategories } from "./actions";
import { ProductsClient } from "./products-client";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/rbac";

export default async function ProductsPage() {
  const ctx = await requireTenant();
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);

  return (
    <ProductsClient
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        isActive: p.isActive,
        trackStock: p.trackStock,
      }))}
      categories={categories}
      canEdit={can(ctx.role, "products.write")}
    />
  );
}
