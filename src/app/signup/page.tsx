import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { getDictionary } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
  shopName: z.string().min(1, "Shop name is required").max(80),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) ||
    "shop-" + Math.random().toString(36).slice(2, 8)
  );
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const t = getDictionary("th");

  async function signup(formData: FormData) {
    "use server";
    const parsed = schema.safeParse({
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      shopName: String(formData.get("shopName") ?? "").trim(),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      redirect(`/signup?error=${encodeURIComponent(first.message)}`);
    }
    const { email, password, confirmPassword, shopName } = parsed.data;
    if (password !== confirmPassword) {
      redirect(`/signup?error=${encodeURIComponent("passwordMismatch")}`);
    }

    try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      redirect(`/signup?error=${encodeURIComponent("Email already registered")}`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const trialDays = parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || "7", 10);

    const baseSlug = slugify(shopName);
    let slug = baseSlug;
    let n = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name: shopName + " Owner",
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: shopName,
          ownerId: user.id,
          currency: "THB",
          locale: "th",
          timezone: "Asia/Bangkok",
        },
      });

      await tx.userOnTenant.create({
        data: { userId: user.id, tenantId: tenant.id, role: "OWNER" },
      });

      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: "STANDARD",
          status: "TRIALING",
          trialEndsAt: trialEndDate,
        },
      });

      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          provider: "FREE",
          amount: 0,
          currency: "THB",
          status: "SUCCEEDED",
        },
      });
    });

    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
      redirect: false,
    }).catch((err: unknown) => {
      console.error("signIn error:", err);
      return null;
    });

    if (result?.error) {
      redirect("/login?error=invalid");
    }

    redirect("/onboarding");
    } catch (err: unknown) {
      // Don't catch Next.js redirect errors — let them propagate
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      console.error("Signup action error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      redirect(`/signup?error=${encodeURIComponent(msg)}`);
    }
  }

  const errorMsg =
    params.error === "passwordMismatch"
      ? t.auth.passwordMismatch
      : params.error
        ? params.error
        : null;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#7c3aed]/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#5b21b6]/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-[#7c3aed]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-[#7c3aed]/5" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-[#7c3aed]/15 shadow-xl shadow-[#5b21b6]/5 animate-scale-in overflow-hidden">
        {/* Card top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#5b21b6]" />

        <div className="p-8">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] shadow-lg shadow-[#7c3aed]/25 animate-float">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight animate-fade-in-up" style={{animationDelay:"50ms"}}>{t.auth.signup}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground animate-fade-in-up" style={{animationDelay:"100ms"}}>
              {t.auth.startFreeTrial}
            </p>
          </div>

          {errorMsg && (
            <Alert variant="destructive" className="mb-5 animate-fade-in-down">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form action={signup} className="space-y-4">
            <div className="animate-fade-in-up" style={{animationDelay:"150ms"}}>
              <Label htmlFor="shopName" className="text-sm font-medium">{t.auth.shopName}</Label>
              <Input id="shopName" name="shopName" required maxLength={80} autoFocus
                className="mt-1.5 h-10 rounded-xl border-[#e9d5ff] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all" />
            </div>
            <div className="animate-fade-in-up" style={{animationDelay:"200ms"}}>
              <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email"
                className="mt-1.5 h-10 rounded-xl border-[#e9d5ff] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all" />
            </div>
            <div className="animate-fade-in-up" style={{animationDelay:"250ms"}}>
              <Label htmlFor="password" className="text-sm font-medium">{t.auth.password}</Label>
              <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password"
                className="mt-1.5 h-10 rounded-xl border-[#e9d5ff] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all" />
            </div>
            <div className="animate-fade-in-up" style={{animationDelay:"300ms"}}>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t.auth.confirmPassword}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} autoComplete="new-password"
                className="mt-1.5 h-10 rounded-xl border-[#e9d5ff] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all" />
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2 pt-1 animate-fade-in-up" style={{animationDelay:"350ms"}}>
              {["ฟรี 7 วัน", "ไม่ต้องใช้บัตรเครดิต", "ยกเลิกได้ทุกเมื่อ"].map((badge, i) => (
                <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-[#7c3aed]/20 bg-[#faf5ff] px-2.5 py-0.5 text-[10px] font-medium text-[#5b21b6]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {badge}
                </span>
              ))}
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] font-semibold text-white shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/35 hover:brightness-105 transition-all duration-200 btn-premium animate-fade-in-up"
              style={{animationDelay:"400ms"}}>
              {t.auth.startFreeTrial}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground animate-fade-in-up" style={{animationDelay:"450ms"}}>
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-[#5b21b6] hover:text-[#7c3aed] hover:underline transition-colors">
              {t.auth.loginNow}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
