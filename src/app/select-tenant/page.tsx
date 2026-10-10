import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function SelectTenantPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.userOnTenant.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/signup");
  }
  if (memberships.length === 1) {
    // Auto-select the only tenant
    const tenantId = memberships[0].tenantId;
    // We need to update the JWT — done via API
    redirect(`/select-tenant/confirm?tenantId=${tenantId}`);
  }

  const t = getDictionary("th");

  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold">เลือกร้านค้า</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          คุณมีหลายร้าน เลือกร้านที่ต้องการเข้าใช้งาน
        </p>
        <div className="space-y-3">
          {memberships.map((m) => (
            <Card key={m.id} className="p-4">
              <a
                href={`/select-tenant/confirm?tenantId=${m.tenantId}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{m.tenant.name}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center text-sm">
          <form action="/api/auth/signout" method="post">
            <Button variant="ghost" type="submit" formAction="/api/auth/signout">
              {t.nav.logout}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
