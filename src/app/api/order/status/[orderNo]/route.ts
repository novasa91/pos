import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { status: true, total: true, tableNo: true },
  });
  if (!order) {
    return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
  }
  return NextResponse.json({
    status: order.status,
    total: Number(order.total),
    tableNo: order.tableNo,
  });
}
