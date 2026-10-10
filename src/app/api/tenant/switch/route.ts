import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ activeTenantId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { activeTenantId } = parsed.data;

  const membership = await prisma.userOnTenant.findFirst({
    where: { userId: session.user.id, tenantId: activeTenantId, isActive: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update JWT via Auth.js update() — but we can't call that from API route.
  // Instead, we update the session by setting a cookie. Easier: client triggers session.update.
  return NextResponse.json({
    success: true,
    activeTenantId: membership.tenantId,
    role: membership.role,
  });
}
