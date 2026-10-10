import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { category: true },
        orderBy: { name: "asc" },
      },
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}
