import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function PricingPage() {
  const t = getDictionary("th");
  const price = process.env.NEXT_PUBLIC_PLAN_PRICE_THB || "499";

  const features = [
    t.landing.feature1Title,
    t.landing.feature2Title,
    t.landing.feature3Title,
    t.landing.feature4Title,
    t.landing.feature5Title,
    t.landing.feature6Title,
  ];

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t.landing.pricingTitle}
        </h1>
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
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            {t.landing.startNow}
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            ทดลองฟรี 7 วัน ไม่ต้องใส่บัตรเครดิต
          </p>
        </Card>
      </div>
    </div>
  );
}
