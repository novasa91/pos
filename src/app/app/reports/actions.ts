"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantOptional } from "@/lib/tenant";

export type SalesSummary = {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  promptpayTotal: number;
  byDay: Array<{ date: string; total: number; orders: number }>;
  byCategory: Array<{ categoryId: string; categoryName: string; total: number; orders: number }>;
  topProducts: Array<{ productId: string; name: string; qty: number; total: number }>;
  lowStock: Array<{ id: string; name: string; stock: number; threshold: number }>;
};

export async function getSalesReport(input: {
  from: string;
  to: string;
}): Promise<SalesSummary> {
  const ctx = await getTenantOptional();
  const empty: SalesSummary = {
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    cashTotal: 0,
    cardTotal: 0,
    transferTotal: 0,
    promptpayTotal: 0,
    byDay: [],
    byCategory: [],
    topProducts: [],
    lowStock: [],
  };
  if (!ctx) return empty;

  const fromDate = new Date(input.from);
  const toDate = new Date(input.to);
  toDate.setHours(23, 59, 59, 999);

  const [sales, lowStock] = await Promise.all([
    prisma.sale.findMany({
      where: {
        tenantId: ctx.tenant.id,
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ["COMPLETED", "PARTIAL_RETURN"] },
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        payments: true,
      },
    }),
    prisma.product.findMany({
      where: {
        tenantId: ctx.tenant.id,
        isActive: true,
        trackStock: true,
        stock: { lte: prisma.product.fields.lowStockThreshold },
      },
      take: 20,
    }),
  ]);

  let totalSales = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let transferTotal = 0;
  let promptpayTotal = 0;
  const byDayMap = new Map<string, { total: number; orders: number }>();
  const byCategoryMap = new Map<string, { categoryName: string; total: number; orders: Set<string> }>();
  const productMap = new Map<string, { name: string; qty: number; total: number }>();

  for (const sale of sales) {
    totalSales += sale.total;
    const day = sale.createdAt.toISOString().slice(0, 10);
    const dayEntry = byDayMap.get(day) ?? { total: 0, orders: 0 };
    dayEntry.total += sale.total;
    dayEntry.orders += 1;
    byDayMap.set(day, dayEntry);

    for (const p of sale.payments) {
      if (p.method === "CASH") cashTotal += p.amount;
      else if (p.method === "CARD") cardTotal += p.amount;
      else if (p.method === "TRANSFER") transferTotal += p.amount;
      else if (p.method === "PROMPTPAY") promptpayTotal += p.amount;
    }

    for (const it of sale.items) {
      const catId = it.product?.categoryId ?? "uncategorized";
      const catName = it.product?.category?.name ?? "ไม่มีหมวดหมู่";
      const catEntry = byCategoryMap.get(catId) ?? {
        categoryName: catName,
        total: 0,
        orders: new Set<string>(),
      };
      catEntry.total += it.total;
      catEntry.orders.add(sale.id);
      byCategoryMap.set(catId, catEntry);

      const pid = it.productId ?? it.productName;
      const prodEntry = productMap.get(pid) ?? { name: it.productName, qty: 0, total: 0 };
      prodEntry.qty += it.quantity;
      prodEntry.total += it.total;
      productMap.set(pid, prodEntry);
    }
  }

  return {
    totalSales,
    totalOrders: sales.length,
    avgOrderValue: sales.length > 0 ? totalSales / sales.length : 0,
    cashTotal,
    cardTotal,
    transferTotal,
    promptpayTotal,
    byDay: Array.from(byDayMap.entries())
      .map(([date, v]) => ({ date, total: v.total, orders: v.orders }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byCategory: Array.from(byCategoryMap.entries())
      .map(([categoryId, v]) => ({
        categoryId,
        categoryName: v.categoryName,
        total: v.total,
        orders: v.orders.size,
      }))
      .sort((a, b) => b.total - a.total),
    topProducts: Array.from(productMap.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20),
    lowStock: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold,
    })),
  };
}

export async function toCSV(rows: Array<Record<string, unknown>>): Promise<string> {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}
