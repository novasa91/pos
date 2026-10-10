import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lineNotifyToken, lineNotifyEnabled } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });

  if (!user || user.memberships.length === 0) {
    return NextResponse.json({ error: "No tenant" }, { status: 404 });
  }

  // Update all tenants the user owns
  await prisma.tenant.updateMany({
    where: { ownerId: user.id },
    data: {
      lineNotifyToken: lineNotifyToken || null,
      lineNotifyEnabled: !!lineNotifyEnabled,
    },
  });

  return NextResponse.json({ success: true });
}
