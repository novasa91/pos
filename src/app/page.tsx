import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ShoppingCart,
  Package,
  Users,
  UserCog,
  BarChart3,
  Receipt,
  Check,
  ArrowRight,
} from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "th";
  const t = getDictionary(lang);

  const session = await auth();
  if (session?.user?.id) {
    if (session.user.activeTenantId) redirect("/app");
    redirect("/select-tenant");
  }

  const price = process.env.NEXT_PUBLIC_PLAN_PRICE_THB || "499";
  const langSwitcherHref = lang === "en" ? "/?lang=th" : "/?lang=en";
  const langSwitcherLabel = lang === "en" ? "ภาษาไทย" : "English";

  const features = [
    { icon: ShoppingCart, key: "feature1" as const },
    { icon: Package, key: "feature2" as const },
    { icon: Users, key: "feature3" as const },
    { icon: UserCog, key: "feature4" as const },
    { icon: BarChart3, key: "feature5" as const },
    { icon: Receipt, key: "feature6" as const },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#7c3aed]/15 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-[#ec4899]/12 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-[#06b6d4]/10 blur-3xl animate-float" style={{ animationDelay: "-5s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e9d5ff]/40 bg-white/70 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] via-[#7c3aed] to-[#5b21b6] shadow-lg shadow-[#7c3aed]/25">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-[#5b21b6] to-[#ec4899] bg-clip-text text-transparent">{t.app.name}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href={langSwitcherHref} className="hidden text-sm text-muted-foreground hover:text-[#7c3aed] px-2 sm:inline">
              {langSwitcherLabel}
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium hover:bg-[#faf5ff]">
              {t.auth.login}
            </Link>
            <Link href="/signup" className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#ec4899] px-4 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 btn-premium">
              {t.auth.signup} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/20 bg-gradient-to-r from-[#faf5ff] to-[#fce7f3] px-4 py-1.5 text-sm text-[#7c3aed] shadow-sm animate-fade-in-down">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] pulse-dot" />
            {lang === "th" ? "🎉 ใหม่" : "🎉 New"} — {lang === "th" ? "ระบบสั่งอาหารผ่าน Tablet + ครัว KDS" : "Tablet ordering + Kitchen KDS"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl animate-fade-in-up">
            <span className="bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
              {t.landing.heroTitle}
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            {t.landing.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#ec4899] px-6 text-base font-semibold text-white shadow-xl shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50 btn-premium"
            >
              {t.landing.ctaStart} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/order/shop-ywsukm"
              target="_blank"
              className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-[#7c3aed]/30 bg-white/60 px-6 text-base font-semibold text-[#5b21b6] backdrop-blur-sm shadow-sm hover:border-[#7c3aed] hover:bg-white btn-premium"
            >
              📱 {lang === "th" ? "ดูตัวอย่างเมนู" : "See demo menu"}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {lang === "th" ? "ไม่ต้องใส่บัตรเครดิต ทดลองฟรี 7 วัน" : "No credit card. 7-day free trial."}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.featuresTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key }) => (
              <Card key={key} className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t.landing[`${key}Title` as keyof typeof t.landing] as string}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.landing[`${key}Desc` as keyof typeof t.landing] as string}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t.landing.pricingTitle}
            </h2>
            <p className="mt-4 text-muted-foreground">{t.landing.pricingSubtitle}</p>
            <Card className="mt-10 p-8">
              <div className="text-sm text-muted-foreground">{t.billing.plan}</div>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">฿{price}</span>
                <span className="text-muted-foreground">
                  {t.landing.perMonth} {t.landing.perShop}
                </span>
              </div>
              <ul className="mt-8 space-y-3 text-left">
                {features.map(({ icon: Icon, key }) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {t.landing[`${key}Title` as keyof typeof t.landing] as string}
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {lang === "th"
                      ? "ใช้ได้ไม่จำกัดจำนวนสินค้า/ลูกค้า/พนักงาน"
                      : "Unlimited products, customers, employees"}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {lang === "th"
                      ? "รองรับ PromptPay และบัตรเครดิต"
                      : "PromptPay and credit card support"}
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                {t.landing.startNow}
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} {t.app.name}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              {lang === "th" ? "ราคา" : "Pricing"}
            </Link>
            <Link href="/login" className="hover:text-foreground">
              {t.auth.login}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
