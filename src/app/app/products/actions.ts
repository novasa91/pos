"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenant, getTenantOptional } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  trackStock: z.coerce.boolean().default(true),
});

export async function listProducts(search?: string) {
  const ctx = await getTenantOptional();
  if (!ctx) return [];
  return prisma.product.findMany({
    where: {
      tenantId: ctx.tenant.id,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { barcode: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function createProduct(formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.write");
  const data = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    cost: formData.get("cost") || 0,
    stock: formData.get("stock") || 0,
    lowStockThreshold: formData.get("lowStockThreshold") || 5,
    categoryId: formData.get("categoryId") || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    trackStock: formData.get("trackStock") === "on" || formData.get("trackStock") === "true",
  });
  await prisma.product.create({
    data: { ...data, tenantId: ctx.tenant.id },
  });
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.write");
  const data = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    cost: formData.get("cost") || 0,
    stock: formData.get("stock") || 0,
    lowStockThreshold: formData.get("lowStockThreshold") || 5,
    categoryId: formData.get("categoryId") || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    trackStock: formData.get("trackStock") === "on" || formData.get("trackStock") === "true",
  });
  await prisma.product.updateMany({
    where: { id, tenantId: ctx.tenant.id },
    data,
  });
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.delete");
  await prisma.product.updateMany({
    where: { id, tenantId: ctx.tenant.id },
    data: { isActive: false },
  });
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  return { success: true };
}

export async function listCategories() {
  const ctx = await getTenantOptional();
  if (!ctx) return [];
  return prisma.category.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(formData: FormData) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const color = String(formData.get("color") ?? "") || null;
  await prisma.category.create({
    data: { tenantId: ctx.tenant.id, name, color },
  });
  revalidatePath("/app/categories");
  revalidatePath("/app/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.delete");
  await prisma.category.deleteMany({
    where: { id, tenantId: ctx.tenant.id },
  });
  revalidatePath("/app/categories");
  revalidatePath("/app/products");
  return { success: true };
}
