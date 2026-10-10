import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  const { items, tableNo, note } = await req.json();
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "ไม่มีรายการอาหาร" }, { status: 400 });
  }

  // Get products to validate and get prices
  const productIds = items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: tenant.id },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "สินค้าบางรายการไม่ถูกต้อง" }, { status: 400 });
  }

  const total = items.reduce((s: number, i: any) => {
    const p = products.find((pp) => pp.id === i.productId);
    return s + (p?.price || 0) * i.qty;
  }, 0);

  // Generate order number
  const orderNo = `O${Date.now().toString().slice(-6)}`;

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNo,
      tableNo: tableNo || null,
      note: note || null,
      total,
      status: "PENDING",
      items: {
        create: items.map((i: any) => {
          const p = products.find((pp) => pp.id === i.productId);
          return {
            productId: i.productId,
            productName: p!.name,
            qty: i.qty,
            price: p!.price,
          };
        }),
      },
    },
    include: { items: true },
  });

  // LINE Notify — ส่งแจ้งเตือนออเดอร์ใหม่ (ถ้าเปิดใช้งาน)
  if (tenant.lineNotifyEnabled && tenant.lineNotifyToken) {
    try {
      const { sendLineNotify, buildOrderMessage } = await import("@/lib/line-notify");
      const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
      const message = buildOrderMessage({
        orderNo: order.orderNo,
        tableNo: order.tableNo,
        total: Number(order.total),
        items: order.items.map((it) => ({
          productName: it.productName,
          qty: it.qty,
          price: Number(it.price),
        })),
        shopName: tenant.name,
        orderUrl: `${origin}/kitchen`,
      });
      // Fire-and-forget — ไม่บล็อกการตอบกลับ
      sendLineNotify(tenant.lineNotifyToken, message).catch((e) =>
        console.error("LINE Notify error:", e)
      );
    } catch (e) {
      console.error("LINE notify module error:", e);
    }
  }

  return NextResponse.json({ success: true, order });
}
