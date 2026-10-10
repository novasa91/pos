import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PromptpaySettings } from "./promptpay-settings";
import { Wallet } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default async function PromptpaySettingsPage() {
  const ctx = await requireTenant();
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenant.id },
    select: { promptpayPhone: true, promptpayName: true, name: true },
  });

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <BackButton href="/app/settings" />
        <div className="mb-2 mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span>ตั้งค่า &gt; PromptPay</span>
        </div>
      </div>
      <PromptpaySettings
        initialPhone={tenant?.promptpayPhone ?? ""}
        initialName={tenant?.promptpayName ?? ""}
        shopName={tenant?.name ?? ""}
      />
    </div>
  );
}
