import { requireTenant } from "@/lib/tenant";
import { getDictionary } from "@/lib/i18n";
import { LocaleProvider } from "@/components/locale-provider";
import { DashboardShell } from "@/components/dashboard-shell";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // requireTenant redirects if no session/tenant/subscription
  const ctx = await requireTenant();
  const session = await auth();
  const t = getDictionary(ctx.tenant.locale === "en" ? "en" : "th");
  const tenants =
    session?.user?.tenants?.map((t) => ({ id: t.id, name: t.name })) ?? [];

  return (
    <LocaleProvider locale={ctx.tenant.locale === "en" ? "en" : "th"}>
      <DashboardShell
        shopName={ctx.tenant.name}
        userName={ctx.name}
        userEmail={ctx.email}
        tenants={tenants}
        activeTenantId={ctx.tenant.id}
      >
        {children}
      </DashboardShell>
    </LocaleProvider>
  );
}
