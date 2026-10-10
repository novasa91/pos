import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * One-time setup endpoint: creates a test user on the deployed SQLite.
 *
 * POST /api/create-test-user
 * Body: { email?: string, password?: string }
 *
 * Idempotent: returns 200 if the user already exists with a matching password hash.
 * On Vercel serverless, the SQLite file is ephemeral across cold starts; this
 * endpoint lets the operator re-create the test user after a cold start without
 * having to re-run the full seed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email ?? "test@poscloud.test").toString().trim().toLowerCase();
  const password = (body.password ?? "test1234").toString();

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(password, 10);

  if (existing) {
    // Make sure the password matches what we are handing out.
    const matches = await bcrypt.compare(password, existing.hashedPassword ?? "");
    if (!matches) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { hashedPassword: hashed },
      });
    }
    return NextResponse.json({ ok: true, created: false, email, id: existing.id });
  }

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword: hashed,
      name: "Test Owner",
      phone: "0800000000",
    },
  });

  // Give the new user a tenant + active trial so the dashboard works.
  const slug = "test-shop";
  let tenant = await prisma.tenant.findFirst({ where: { ownerId: user.id } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug,
        name: "ร้านทดสอบ",
        address: "ที่อยู่ทดสอบ",
        phone: "0800000000",
        email,
        currency: "THB",
        timezone: "Asia/Bangkok",
        locale: "th",
        vatEnabled: true,
        vatRate: 7,
        vatInclusive: false,
        receiptHeader: "ทดสอบ",
        receiptFooter: "ทดสอบ",
        ownerId: user.id,
      },
    });
  }

  const membership = await prisma.userOnTenant.findFirst({
    where: { userId: user.id, tenantId: tenant.id },
  });
  if (!membership) {
    await prisma.userOnTenant.create({
      data: { userId: user.id, tenantId: tenant.id, role: "OWNER" },
    });
  }

  const sub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
  if (!sub) {
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: "STANDARD",
        status: "TRIALING",
        trialEndsAt: trialEnds,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnds,
      },
    });
  }

  return NextResponse.json({ ok: true, created: true, email, id: user.id });
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/create-test-user with optional { email, password }",
    defaults: { email: "test@poscloud.test", password: "test1234" },
  });
}
