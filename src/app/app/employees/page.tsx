import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { EmployeesView } from "./employees-view";
import { BackButton } from "@/components/back-button";

export default async function EmployeesPage() {
  const ctx = await requireTenant();
  const employees = await prisma.employee.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <BackButton href="/app" />
      </div>
      <EmployeesView
        initialEmployees={employees.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        }))}
      />
    </>
  );
}
