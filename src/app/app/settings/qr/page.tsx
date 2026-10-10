import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { QrCodeView } from "./qr-view";
import { BackButton } from "@/components/back-button";

export default async function QrCodePage() {
  const ctx = await requireTenant();
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenant.id },
    select: { name: true, slug: true },
  });

  if (!tenant) return null;

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <BackButton href="/app/settings" />
      </div>
      <QrCodeView shopName={tenant.name} slug={tenant.slug} />
    </>
  );
}
