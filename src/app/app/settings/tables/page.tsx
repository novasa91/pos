import { headers } from "next/headers";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { TablesView } from "./tables-view";
import { BackButton } from "@/components/back-button";

export default async function TablesPage() {
  const ctx = await requireTenant();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "";

  const tables = await prisma.table.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
        select: { id: true, orderNo: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <BackButton href="/app/settings" />
      </div>
      <TablesView
        slug={ctx.tenant.slug}
        shopName={ctx.tenant.name}
        origin={origin}
        initialTables={tables.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          orders: t.orders.map((o) => ({
            ...o,
            total: Number(o.total),
            createdAt: o.createdAt.toISOString(),
          })),
        }))}
      />
    </>
  );
}
