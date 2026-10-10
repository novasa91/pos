import { headers } from "next/headers";
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

  // Read the request origin from headers so the same URL renders on
  // server and client (avoids hydration mismatch).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "";

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <BackButton href="/app/settings" />
      </div>
      <QrCodeView
        shopName={tenant.name}
        slug={tenant.slug}
        origin={origin}
      />
    </>
  );
}
