import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/kitchen/products?q=search
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const tenant = await prisma.tenant.findFirst({
    where: {
      members: {
        some: { user: { email: session.user.email } },
      },
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      ...(q
        ? { name: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
    take: 30,
  });

  return NextResponse.json({ products });
}
