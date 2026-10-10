import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST — บันทึกการชำระเงิน (CASH/CARD/TRANSFER/PROMPTPAY)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { saleId, method, amount } = await req.json();
  if (!saleId) {
    return NextResponse.json({ error: "Missing saleId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  if (!user || user.memberships.length === 0) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, tenantId: user.memberships[0].tenantId },
  });
  if (!sale) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  // ตรวจสอบว่าจ่ายครบแล้วหรือยัง
  const existingPayments = await prisma.salePayment.findMany({
    where: { saleId },
  });
  const paidAmount = existingPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Number(sale.total) - paidAmount;
  const payAmount = amount ? Number(amount) : remaining;

  if (remaining <= 0) {
    return NextResponse.json({ message: "ชำระครบแล้ว", alreadyPaid: true });
  }

  // บันทึก payment
  await prisma.salePayment.create({
    data: {
      saleId,
      method: method || "CASH",
      amount: payAmount,
    },
  });

  // ถ้าจ่ายครบ อัปเดตสถานะเป็น COMPLETED
  if (paidAmount + payAmount >= Number(sale.total)) {
    await prisma.sale.update({
      where: { id: saleId },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({
    success: true,
    message: "ชำระเงินสำเร็จ",
    amount: payAmount,
    remaining: Math.max(0, remaining - payAmount),
    method: method || "CASH",
  });
}
