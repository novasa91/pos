import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST — รับออเดอร์จาก Lineman (หรือ platform delivery อื่นๆ)
// ทาง Lineman จะส่ง webhook มาที่นี่ เมื่อมีออเดอร์ใหม่
export async function POST(req: NextRequest) {
  const body = await req.json();

  // ตรวจสอบ API key
  const apiKey = req.headers.get("x-api-key");
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: body.tenantId },
        { slug: body.tenantSlug },
      ],
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  // Verify API key
  if (tenant.lineNotifyToken && apiKey !== tenant.lineNotifyToken) {
    return NextResponse.json({ error: "API key ไม่ถูกต้อง" }, { status: 401 });
  }

  // body shape จาก Lineman (ตัวอย่าง)
  // {
  //   "orderId": "LM123456",
  //   "restaurantId": "shop-ywsukm",
  //   "customer": { "name": "...", "phone": "...", "address": "..." },
  //   "items": [{ "productId": "...", "name": "...", "qty": 2, "price": 50 }],
  //   "subtotal": 100, "deliveryFee": 30, "total": 130,
  //   "note": "...",
  //   "source": "LINEMAN"
  // }

  const { orderId, customer, items, subtotal, deliveryFee, total, note, source } = body;

  if (!orderId || !items || items.length === 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  // สร้าง order ในระบบ
  const newOrder = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNo: `LM-${orderId}`,
      externalId: orderId,
      source: source || "LINEMAN",
      customerName: customer?.name,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      deliveryFee: Number(deliveryFee) || 0,
      note: note || null,
      total: Number(total) || 0,
      status: "PENDING",
      items: {
        create: items.map((it: any) => ({
          productId: it.productId || null,
          productName: it.name,
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
        })),
      },
    },
    include: { items: true },
  });

  // ส่ง LINE แจ้งเตือน
  if (tenant.lineNotifyEnabled && tenant.lineNotifyToken) {
    try {
      const { sendLineNotify, buildOrderMessage } = await import("@/lib/line-notify");
      const message = buildOrderMessage({
        orderNo: newOrder.orderNo,
        tableNo: null,
        total: Number(newOrder.total),
        items: newOrder.items.map((it) => ({
          productName: it.productName,
          qty: it.qty,
          price: Number(it.price),
        })),
        shopName: tenant.name,
        orderUrl: `${req.nextUrl.origin}/kitchen`,
      });
      const fullMessage = `🛵 [LINEMAN] ${message}`;
      sendLineNotify(tenant.lineNotifyToken, fullMessage).catch((e) =>
        console.error("LINE notify error:", e)
      );
    } catch {}
  }

  return NextResponse.json({ success: true, orderId: newOrder.orderNo });
}

// GET — list delivery orders (ให้ dashboard เรียกดู)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      source: { in: ["LINEMAN", "GRAB", "SHOPEE", "TAKEAWAY"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  return NextResponse.json({ orders });
}
