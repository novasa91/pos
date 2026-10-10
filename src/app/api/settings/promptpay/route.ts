import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { promptpayPhone, promptpayName } = await req.json();

  // Validate phone (10 digits) or tax ID (13 digits)
  const clean = (promptpayPhone ?? "").replace(/[^0-9]/g, "");
  if (promptpayPhone && clean.length !== 10 && clean.length !== 13) {
    return NextResponse.json(
      { error: "เบอร์โทรต้อง 10 หลัก หรือเลขผู้เสียภาษี 13 หลัก" },
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

  await prisma.tenant.updateMany({
    where: { ownerId: user.id },
    data: {
      promptpayPhone: promptpayPhone || null,
      promptpayName: promptpayName || null,
    },
  });

  return NextResponse.json({ success: true });
}
