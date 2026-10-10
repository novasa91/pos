import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/server-i18n";
import { CancelButton } from "./cancel-button";
import { CheckoutButton } from "./checkout-button";

const STATUS_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  TRIALING: { label: "ทดลองใช้", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  ACTIVE: { label: "ใช้งานอยู่", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  PAST_DUE: { label: "ค้างชำระ", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  CANCELED: { label: "ยกเลิกแล้ว", color: "bg-gray-100 text-gray-800", icon: XCircle },
  EXPIRED: { label: "หมดอายุ", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default async function BillingPage() {
  const ctx = await requireTenant();
  const sub = await prisma.subscription.findUnique({
    where: { tenantId: ctx.tenant.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  const price = process.env.NEXT_PUBLIC_PLAN_PRICE_THB || "499";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ค่าบริการ</h1>
        <p className="text-sm text-muted-foreground">จัดการ subscription ของร้าน</p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">แพ็กเกจปัจจุบัน</div>
            <div className="mt-1 text-3xl font-bold">฿{price}<span className="text-base font-normal text-muted-foreground"> /เดือน</span></div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">ร้าน:</span>
              <span className="font-medium">{ctx.tenant.name}</span>
            </div>
          </div>
          {sub && STATUS_LABEL[sub.status] && (
            <Badge className={STATUS_LABEL[sub.status].color}>
              {(() => {
                const Icon = STATUS_LABEL[sub.status].icon;
                return <Icon className="mr-1 h-3 w-3" />;
              })()}
              {STATUS_LABEL[sub.status].label}
            </Badge>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sub?.trialEndsAt && sub.status === "TRIALING" && (
            <div className="rounded-lg border bg-blue-50 p-3 text-sm">
              <div className="text-muted-foreground">ทดลองใช้ถึง</div>
              <div className="font-semibold">{formatDate(sub.trialEndsAt)}</div>
            </div>
          )}
          {sub?.currentPeriodEnd && sub.status === "ACTIVE" && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="text-muted-foreground">บิลถัดไป</div>
              <div className="font-semibold">{formatDate(sub.currentPeriodEnd)}</div>
              {sub.cancelAtPeriodEnd && (
                <div className="mt-1 text-xs text-destructive">
                  จะยกเลิกเมื่อสิ้นสุดรอบบิล
                </div>
              )}
            </div>
          )}
          {sub?.provider && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="text-muted-foreground">ช่องทางชำระ</div>
              <div className="font-semibold">
                {sub.provider === "STRIPE" ? "Stripe" : "Omise (พร้อมเพย์)"}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(!sub || sub.status !== "ACTIVE") && (
            <>
              <CheckoutButton provider="STRIPE" />
              <CheckoutButton provider="OMISE" />
            </>
          )}
          {sub?.status === "ACTIVE" && sub.provider === "STRIPE" && (
            <Button variant="outline" onClick={async () => {
              const r = await fetch("/api/billing/cancel", { method: "POST" });
              const d = await r.json();
              if (d.url) window.location.href = d.url;
            }}>
              <CreditCard className="mr-2 h-4 w-4" /> จัดการการชำระ (Stripe Portal)
            </Button>
          )}
          {sub?.status === "ACTIVE" && !sub.cancelAtPeriodEnd && (
            <CancelButton />
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-3 font-semibold">ประวัติการชำระ</h3>
        {!sub || sub.payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีประวัติการชำระ
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2">วันที่</th>
                <th className="pb-2">ช่องทาง</th>
                <th className="pb-2 text-right">จำนวน</th>
                <th className="pb-2 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {sub.payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{formatDate(p.createdAt)}</td>
                  <td className="py-2">{p.provider === "STRIPE" ? "Stripe" : "Omise"}</td>
                  <td className="py-2 text-right font-medium">
                    ฿{p.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right">
                    {p.status === "SUCCEEDED" && (
                      <span className="text-xs text-green-600">สำเร็จ</span>
                    )}
                    {p.status === "PENDING" && (
                      <span className="text-xs text-yellow-600">รอดำเนินการ</span>
                    )}
                    {p.status === "FAILED" && (
                      <span className="text-xs text-destructive">ล้มเหลว</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
