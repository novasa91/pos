import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list all tables for the tenant with status
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
  if (!tenant) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }

  const tables = await prisma.table.findMany({
    where: { tenantId: tenant.id },
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
        select: { id: true, orderNo: true, total: true, status: true, createdAt: true, tableId: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ tables, slug: tenant.slug });
}

// POST — bulk create tables (เพิ่มหลายโต๊ะพร้อมกัน)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { count, prefix } = body as { count: number; prefix?: string };

  if (!count || count < 1 || count > 200) {
    return NextResponse.json(
      { error: "จำนวนโต๊ะต้องอยู่ระหว่าง 1-200" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  if (!user || user.memberships.length === 0) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }
  const tenantId = user.memberships[0].tenantId;

  // หาเลขโต๊ะที่มีอยู่แล้ว เพื่อไม่ให้ซ้ำ
  const existing = await prisma.table.findMany({
    where: { tenantId },
    select: { number: true },
  });
  const existingNumbers = new Set(existing.map((t) => t.number));

  const toCreate: { tenantId: string; number: string; name: string | null }[] = [];
  const p = prefix || "";
  let n = existing.length + 1;
  while (toCreate.length < count) {
    const num = `${p}${n}`;
    if (!existingNumbers.has(num)) {
      toCreate.push({ tenantId, number: num, name: null });
      existingNumbers.add(num);
    }
    n++;
    if (n > 9999) break;
  }

  await prisma.table.createMany({ data: toCreate });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { tableCount: { increment: toCreate.length } },
  });

  return NextResponse.json({ created: toCreate.length, tables: toCreate });
}

// PATCH — update table (rename, change status, etc.)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, number, name, capacity, status, active } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }

  const table = await prisma.table.findFirst({
    where: { id, tenantId },
  });
  if (!table) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.table.update({
    where: { id },
    data: { number, name, capacity, status, active },
  });

  return NextResponse.json({ success: true });
}

// DELETE — remove table
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
  const tenantId = user?.memberships[0]?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }

  await prisma.table.deleteMany({ where: { id, tenantId } });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { tableCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
