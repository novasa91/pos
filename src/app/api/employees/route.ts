import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

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
  if (!tenantId) return NextResponse.json({ employees: [] });

  const employees = await prisma.employee.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ employees });
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
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const { name, nickname, role, pin, phone, email } = await req.json();
  if (!name) return NextResponse.json({ error: "กรุณาใส่ชื่อ" }, { status: 400 });
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN ต้องเป็นตัวเลข 4-6 หลัก" }, { status: 400 });
  }

  const hashedPin = await bcrypt.hash(pin, 10);
  const employee = await prisma.employee.create({
    data: { tenantId, name, nickname, role, pin: hashedPin, phone, email },
  });
  return NextResponse.json({ success: true, id: employee.id });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, name, nickname, role, pin, phone, email, active } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const data: any = { name, nickname, role, phone, email, active };
  if (pin && /^\d{4,6}$/.test(pin)) {
    data.pin = await bcrypt.hash(pin, 10);
  }

  await prisma.employee.updateMany({ where: { id, tenantId }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  await prisma.employee.deleteMany({ where: { id, tenantId } });
  return NextResponse.json({ success: true });
}
