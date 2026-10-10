import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { include: { tenant: true } } },
  });

  const tenant = user?.memberships[0]?.tenant;
  if (!tenant) return NextResponse.json({ orders: [] });

  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id, status: { in: ["PENDING", "PREPARING", "READY"] } },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      total: Number(o.total),
      deliveryFee: Number(o.deliveryFee),
      items: o.items.map((it) => ({
        ...it,
        price: Number(it.price),
      })),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json({ success: true });
}

// ยืนยันการชำระเงิน / ยกเลิก item (void)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNo, action, itemId, reason, items } = await req.json();
  if (!orderNo) {
    return NextResponse.json({ error: "Missing orderNo" }, { status: 400 });
  }

  if (action === "confirm-payment") {
    await prisma.order.update({
      where: { orderNo },
      data: { status: "PREPARING" },
    });
    return NextResponse.json({ success: true, message: "ยืนยันการชำระเงิน ส่งเข้าครัวแล้ว" });
  }

  if (action === "void-item" && itemId) {
    // ยกเลิก item เดียว (ลูกค้าไม่ได้สั่ง) → ลด total + คืน stock
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }
    const order = await prisma.order.findUnique({ where: { id: item.orderId } });
    if (!order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    // คำนวณ total ใหม่
    const newTotal = Number(order.total) - Number(item.price) * item.qty;

    await prisma.$transaction(async (tx) => {
      // อัปเดต item เป็น VOID
      await tx.orderItem.update({
        where: { id: itemId },
        data: { status: "VOID", note: `${item.note || ""}\n[VOID: ${reason || "ลูกค้าไม่ได้สั่ง"}]`.trim() },
      });
      // อัปเดต total
      await tx.order.update({
        where: { id: order.id },
        data: { total: newTotal > 0 ? newTotal : 0 },
      });
      // คืน stock
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `ยกเลิก ${item.productName} ×${item.qty} แล้ว`,
      newTotal,
    });
  }

  if (action === "add-items" && Array.isArray(items) && items.length > 0) {
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }
    if (order.status === "CANCELLED" || order.status === "COMPLETED") {
      return NextResponse.json(
        { error: "ไม่สามารถเพิ่มรายการได้ — ออเดอร์ถูกยกเลิกหรือเสร็จสิ้นแล้ว" },
        { status: 400 }
      );
    }

    // Get products for this tenant
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId: order.tenantId, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build items to create and calculate added total
    const addedTotal = items.reduce((sum: number, item: { productId: string; qty: number; note?: string }) => {
      const product = productMap.get(item.productId);
      if (!product) return sum;
      return sum + product.price * item.qty;
    }, 0);

    const newItems = items
      .filter((item: { productId: string; qty: number }) => productMap.has(item.productId))
      .map((item: { productId: string; qty: number; note?: string }) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          qty: item.qty,
          price: product.price,
          note: item.note || null,
          status: "PENDING",
        };
      });

    await prisma.$transaction(async (tx) => {
      // Create new order items
      await tx.orderItem.createMany({ data: newItems });
      // Update order total
      await tx.order.update({
        where: { id: order.id },
        data: { total: { increment: addedTotal } },
      });
    });

    // Fetch updated order
    const updated = await prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      message: `เพิ่ม ${newItems.length} รายการ รวม +${addedTotal.toFixed(2)} บาท`,
      order: updated ? {
        ...updated,
        total: Number(updated.total),
        deliveryFee: Number(updated.deliveryFee),
        items: updated.items.map((it) => ({
          ...it,
          price: Number(it.price),
        })),
      } : null,
      addedTotal,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
