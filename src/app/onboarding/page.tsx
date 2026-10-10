import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.activeTenantId) redirect("/select-tenant");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.activeTenantId },
  });
  const sub = await prisma.subscription.findUnique({
    where: { tenantId: session.user.activeTenantId },
  });
  const t = getDictionary("th");

  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          {t.auth.signupSuccess}
        </div>
        <h1 className="mt-2 text-2xl font-bold">ยินดีต้อนรับสู่ {t.app.name}!</h1>
        <p className="mt-1 text-muted-foreground">
          ร้าน <strong>{tenant?.name}</strong> พร้อมใช้งานแล้ว ทดลองฟรี 7 วัน
        </p>

        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <div className="font-medium">สร้างร้านเรียบร้อย</div>
              <div className="text-sm text-muted-foreground">
                รหัสร้าน: <code className="text-xs">{tenant?.slug}</code>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <div className="font-medium">ทดลองใช้ฟรี 7 วัน</div>
              <div className="text-sm text-muted-foreground">
                {sub?.trialEndsAt
                  ? `ถึงวันที่ ${sub.trialEndsAt.toLocaleDateString("th-TH")}`
                  : "ทดลองได้ทันที"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/pos"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            เริ่มขายของ <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/app/settings"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-input bg-background px-6 text-base font-medium shadow-sm hover:bg-accent"
          >
            ตั้งค่าร้าน
          </Link>
        </div>
      </Card>
    </div>
  );
}
