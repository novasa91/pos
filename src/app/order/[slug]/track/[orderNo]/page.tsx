import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderTracking } from "./order-tracking";

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ slug: string; orderNo: string }>;
}) {
  const { slug, orderNo } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, phone: true },
  });
  if (!tenant) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true, table: { select: { number: true, name: true } } },
  });
  if (!order || order.tenantId !== tenant.id) notFound();

  return (
    <OrderTracking
      shopName={tenant.name}
      shopPhone={tenant.phone}
      orderNo={order.orderNo}
      tableNo={order.table?.number || order.tableNo}
      tableName={order.table?.name || null}
      status={order.status}
      total={Number(order.total)}
      createdAt={order.createdAt.toISOString()}
      items={order.items.map((i) => ({
        productName: i.productName,
        qty: i.qty,
        price: Number(i.price),
        note: i.note,
      }))}
    />
  );
}
