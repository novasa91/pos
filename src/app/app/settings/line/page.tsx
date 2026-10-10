import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { LineSettings } from "../line-settings";
import { Bell } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default async function LineSettingsPage() {
  const ctx = await requireTenant();
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenant.id },
    select: { lineNotifyToken: true, lineNotifyEnabled: true },
  });

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <BackButton href="/app/settings" />
        <div className="mb-2 mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>ตั้งค่า &gt; การแจ้งเตือน</span>
        </div>
      </div>
      <LineSettings
        initialToken={tenant?.lineNotifyToken ?? null}
        initialEnabled={tenant?.lineNotifyEnabled ?? false}
      />
    </div>
  );
}
