"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenant, getTenantOptional } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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
    imageUrl: formData.get("imageUrl") || null,
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
    imageUrl: formData.get("imageUrl") || null,
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

/**
 * Bulk import products from a CSV string.
 *
 * Expected columns (header row required, case-insensitive, order flexible):
 *   name, sku, barcode, price, cost, stock, category, imageUrl, description
 *
 * - Rows whose SKU matches an existing product are SKIPPED, unless
 *   `updateExisting` is true (then they are overwritten).
 * - `category` is matched by name (case-insensitive). New categories are
 *   auto-created.
 * - `imageUrl` accepts http(s) URLs or data: URLs.
 * - Returns counts so the UI can show "added X, skipped Y".
 */
export async function importProductsCsv(
  csv: string,
  options: { updateExisting?: boolean } = {},
) {
  const ctx = await requireTenant();
  assertCan(ctx.role, "products.write");

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { added: 0, updated: 0, skipped: 0, errors: ["ไม่พบแถวข้อมูล"] };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (row: string[], name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? (row[i] ?? "").trim() : "";
  };

  const existing = await prisma.product.findMany({
    where: { tenantId: ctx.tenant.id },
    select: { id: true, sku: true },
  });
  const skuToId = new Map<string, string>();
  for (const e of existing) {
    if (e.sku) skuToId.set(e.sku.toLowerCase(), e.id);
  }

  const existingCategories = await prisma.category.findMany({
    where: { tenantId: ctx.tenant.id },
    select: { id: true, name: true },
  });
  const catNameToId = new Map(
    existingCategories.map((c) => [c.name.toLowerCase(), c.id]),
  );

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => !c.trim())) continue;

    const name = col(row, "name");
    if (!name) {
      errors.push(`แถว ${i + 1}: ไม่มีชื่อสินค้า`);
      skipped++;
      continue;
    }

    const sku = col(row, "sku") || null;
    const barcode = col(row, "barcode") || null;
    const price = Number(col(row, "price") || 0);
    const cost = Number(col(row, "cost") || 0);
    const stock = Math.max(0, Math.floor(Number(col(row, "stock") || 0)));
    const imageUrl = col(row, "imageurl") || col(row, "image") || null;
    const description = col(row, "description") || null;
    const categoryName = col(row, "category") || col(row, "หมวดหมู่");

    if (!Number.isFinite(price) || price < 0) {
      errors.push(`แถว ${i + 1}: ราคาไม่ถูกต้อง`);
      skipped++;
      continue;
    }

    let categoryId: string | null = null;
    if (categoryName) {
      const key = categoryName.toLowerCase();
      categoryId = catNameToId.get(key) ?? null;
      if (!categoryId) {
        const created = await prisma.category.create({
          data: { tenantId: ctx.tenant.id, name: categoryName },
        });
        categoryId = created.id;
        catNameToId.set(key, created.id);
      }
    }

    if (sku) {
      const existingId = skuToId.get(sku.toLowerCase());
      if (existingId) {
        if (options.updateExisting) {
          await prisma.product.update({
            where: { id: existingId },
            data: {
              name,
              barcode,
              description,
              price,
              cost,
              stock,
              imageUrl: imageUrl || null,
              categoryId,
            },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
    }

    await prisma.product.create({
      data: {
        tenantId: ctx.tenant.id,
        name,
        sku,
        barcode,
        description,
        price,
        cost,
        stock,
        imageUrl: imageUrl || null,
        categoryId,
        isActive: true,
        trackStock: true,
      },
    });
    added++;
    if (sku) skuToId.set(sku.toLowerCase(), "__new__");
  }

  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  return { added, updated, skipped, errors };
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
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
