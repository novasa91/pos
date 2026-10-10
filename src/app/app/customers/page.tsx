import { listCustomers } from "./actions";
import { CustomersClient } from "./customers-client";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/rbac";

export default async function CustomersPage() {
  const ctx = await requireTenant();
  const customers = await listCustomers();

  return (
    <CustomersClient
      initialCustomers={customers}
      canEdit={can(ctx.role, "customers.write")}
      canDelete={can(ctx.role, "customers.delete")}
    />
  );
}
