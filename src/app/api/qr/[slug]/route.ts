import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Returns a QR code image (SVG) for the shop's order URL
// Using Google Charts API as a free QR code generator
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  }

  const origin = req.nextUrl.origin;
  const orderUrl = `${origin}/order/${tenant.slug}`;

  return NextResponse.json({
    shopName: tenant.name,
    orderUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=2&data=${encodeURIComponent(orderUrl)}`,
  });
}
