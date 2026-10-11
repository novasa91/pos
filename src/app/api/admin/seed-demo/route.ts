import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

/**
 * One-time seed for the demo tenant: re-creates the standard product
 * catalogue, categories, and 3 customers. Idempotent: skips any item
 * that already exists.
 *
 * Used after /api/admin/reset-tenant to bring the shop back to a
 * "first-time user" appearance.
 */
export async function POST() {
  const ctx = await requireTenant();

  const CATEGORIES = [
    { name: "เครื่องดื่ม", color: "#3b82f6", sortOrder: 1 },
    { name: "ขนมขบเคี้ยว", color: "#f59e0b", sortOrder: 2 },
    { name: "อาหารสด", color: "#10b981", sortOrder: 3 },
    { name: "ของใช้", color: "#8b5cf6", sortOrder: 4 },
  ];

  const PRODUCTS = [
    { name: "กาแฟร้อน", sku: "DRK-001", price: 45, cost: 15, stock: 100, cat: "เครื่องดื่ม" },
    { name: "กาแฟเย็น", sku: "DRK-002", price: 55, cost: 18, stock: 100, cat: "เครื่องดื่ม" },
    { name: "ชาเขียว", sku: "DRK-003", price: 50, cost: 15, stock: 80, cat: "เครื่องดื่ม" },
    { name: "น้ำเปล่า", sku: "DRK-004", price: 15, cost: 5, stock: 200, cat: "เครื่องดื่ม" },
    { name: "ขนมปังกรอบ", sku: "SNK-001", price: 25, cost: 8, stock: 150, cat: "ขนมขบเคี้ยว" },
    { name: "มันฝรั่งทอด", sku: "SNK-002", price: 30, cost: 10, stock: 100, cat: "ขนมขบเคี้ยว" },
    { name: "แซนวิชแฮม", sku: "FDM-001", price: 65, cost: 25, stock: 30, cat: "อาหารสด" },
    { name: "สลัดผัก", sku: "FDM-002", price: 89, cost: 30, stock: 25, cat: "อาหารสด" },
    { name: "กระดาษทิชชู่", sku: "HHL-001", price: 59, cost: 25, stock: 50, cat: "ของใช้" },
    { name: "สบู่เหลว", sku: "HHL-002", price: 89, cost: 35, stock: 40, cat: "ของใช้" },
  ];

  const CUSTOMERS = [
    { name: "สมชาย ใจดี", phone: "0811111111", email: "somchai@example.com", points: 50 },
    { name: "สมหญิง รักไทย", phone: "0822222222", email: "somying@example.com", points: 120 },
    { name: "John Smith", phone: "0833333333", email: "john@example.com", points: 30 },
  ];

  // 1) Categories: upsert by (tenantId, name).
  const catRecords: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: ctx.tenant.id, name: c.name } },
      update: { color: c.color, sortOrder: c.sortOrder },
      create: { tenantId: ctx.tenant.id, name: c.name, color: c.color, sortOrder: c.sortOrder },
    });
    catRecords[c.name] = cat.id;
  }

  // 2) Products: skip if SKU exists.
  const existingSkus = new Set(
    (await prisma.product.findMany({
      where: { tenantId: ctx.tenant.id },
      select: { sku: true },
    }))
      .map((p) => p.sku)
      .filter((s): s is string => Boolean(s)),
  );
  const productsToCreate = PRODUCTS.filter(
    (p) => !existingSkus.has(p.sku),
  );
  if (productsToCreate.length > 0) {
    await prisma.product.createMany({
      data: productsToCreate.map((p) => ({
        tenantId: ctx.tenant.id,
        name: p.name,
        sku: p.sku,
        barcode: `88${p.sku.replace("-", "")}`,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        lowStockThreshold: 10,
        categoryId: catRecords[p.cat] ?? null,
        isActive: true,
        trackStock: true,
      })),
    });
  }

  // 3) Customers: skip if phone exists.
  const existingPhones = new Set(
    (await prisma.customer.findMany({
      where: { tenantId: ctx.tenant.id },
      select: { phone: true },
    })).map((c) => c.phone),
  );
  const customersToCreate = CUSTOMERS.filter(
    (c) => !existingPhones.has(c.phone),
  );
  if (customersToCreate.length > 0) {
    await prisma.customer.createMany({
      data: customersToCreate.map((c) => ({
        tenantId: ctx.tenant.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        points: c.points,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    added: {
      categories: 0,
      products: productsToCreate.length,
      customers: customersToCreate.length,
    },
  });
}
