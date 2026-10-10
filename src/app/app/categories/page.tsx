import { listCategories } from "../products/actions";
import { CategoriesClient } from "./categories-client";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/rbac";

export default async function CategoriesPage() {
  const ctx = await requireTenant();
  const categories = await listCategories();

  return (
    <CategoriesClient
      initialCategories={categories}
      canEdit={can(ctx.role, "products.write")}
    />
  );
}
