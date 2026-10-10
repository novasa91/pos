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
    include: { memberships: true },
  });
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) return NextResponse.json({ purchases: [] });

  const purchases = await prisma.purchase.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });

  return NextResponse.json({ purchases });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  if (!user || user.memberships.length === 0) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }
  const tenantId = user.memberships[0].tenantId;

  const { supplierId, reference, notes, items } = await req.json();
  if (!supplierId) return NextResponse.json({ error: "กรุณาเลือกซัพพลายเออร์" }, { status: 400 });
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "กรุณาเพิ่มรายการสินค้า" }, { status: 400 });
  }

  // คำนวณ total
  let total = 0;
  for (const it of items) {
    total += Number(it.quantity) * Number(it.cost);
  }

  // สร้างใบซื้อเข้า + อัปเดตสต็อก (atomic)
  const purchase = await prisma.$transaction(async (tx) => {
    // สร้าง purchase
    const p = await tx.purchase.create({
      data: {
        tenantId,
        supplierId,
        userId: user.id,
        reference: reference || null,
        notes: notes || null,
        total,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            cost: Number(it.cost),
            total: Number(it.quantity) * Number(it.cost),
          })),
        },
      },
    });

    // อัปเดตสต็อกสินค้า (เพิ่มเข้า)
    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: {
          stock: { increment: Number(it.quantity) },
          cost: Number(it.cost), // อัปเดตต้นทุนล่าสุด
        },
      });
    }

    return p;
  });

  return NextResponse.json({ success: true, id: purchase.id });
}
