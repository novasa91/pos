import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { LinemanSettings } from "./lineman-settings";
import { Bike } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default async function LinemanSettingsPage() {
  const ctx = await requireTenant();
  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <BackButton href="/app/settings" />
        <div className="mb-2 mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Bike className="h-4 w-4" />
          <span>ตั้งค่า &gt; Online Delivery</span>
        </div>
      </div>
      <LinemanSettings
        slug={ctx.tenant.slug}
        shopName={ctx.tenant.name}
      />
    </div>
  );
}
