import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import KitchenDisplay from "./kitchen-display";

export default async function KitchenPage() {
  const session = await auth();
  if (!session?.user?.email) return <div>กรุณาเข้าสู่ระบบ</div>;

  const tenant = await prisma.tenant.findFirst({
    where: { members: { some: { user: { email: session.user.email } } } },
  });
  if (!tenant) return <div>ไม่พบร้าน</div>;

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["PENDING", "PREPARING", "READY"] },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <KitchenDisplay
      orders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        total: Number(o.total),
        items: o.items.map((it) => ({
          ...it,
          price: Number(it.price),
        })),
      }))}
    />
  );
}
