"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";

const settingsSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  currency: z.string().default("THB"),
  timezone: z.string().default("Asia/Bangkok"),
  locale: z.enum(["th", "en"]).default("th"),
  vatEnabled: z.coerce.boolean().default(false),
  vatRate: z.coerce.number().min(0).max(100).default(7),
  vatInclusive: z.coerce.boolean().default(false),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
});

export async function updateSettings(formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "settings.write");
  const data = settingsSchema.parse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    taxId: formData.get("taxId") || undefined,
    currency: formData.get("currency") || "THB",
    timezone: formData.get("timezone") || "Asia/Bangkok",
    locale: formData.get("locale") || "th",
    vatEnabled: formData.get("vatEnabled") === "on" || formData.get("vatEnabled") === "true",
    vatRate: formData.get("vatRate") || 7,
    vatInclusive: formData.get("vatInclusive") === "on" || formData.get("vatInclusive") === "true",
    receiptHeader: formData.get("receiptHeader") || undefined,
    receiptFooter: formData.get("receiptFooter") || undefined,
  });
  await prisma.tenant.update({
    where: { id: ctx.tenant.id },
    data,
  });
  revalidatePath("/app/settings");
  revalidatePath("/app");
  return { success: true };
}
