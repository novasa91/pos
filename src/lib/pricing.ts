// Helpers for tax-inclusive vs tax-exclusive pricing
import type { Tenant } from "@prisma/client";

export type PriceInput = {
  unitPrice: number; // Base price set by user
  quantity: number;
  discount?: number; // Discount amount (not percent) for the line
};

/**
 * Given a base price and tenant tax config, return the breakdown.
 * - If vatInclusive = true: unitPrice already includes tax. Subtotal = qty*unitPrice. Tax is extracted.
 * - If vatInclusive = false: unitPrice is pre-tax. Subtotal = qty*unitPrice. Tax is added.
 */
export function computePrice(input: PriceInput, tenant: Tenant) {
  const { unitPrice, quantity, discount = 0 } = input;
  const rate = tenant.vatEnabled ? tenant.vatRate / 100 : 0;

  let subtotal: number;
  let tax: number;
  let total: number;

  if (tenant.vatEnabled && tenant.vatInclusive) {
    // unitPrice is tax-inclusive
    const lineBase = unitPrice * quantity - discount;
    tax = round2((lineBase * rate) / (1 + rate));
    subtotal = round2(lineBase - tax);
    total = round2(lineBase);
  } else if (tenant.vatEnabled) {
    // unitPrice is tax-exclusive
    subtotal = round2(unitPrice * quantity - discount);
    tax = round2(subtotal * rate);
    total = round2(subtotal + tax);
  } else {
    // No VAT
    subtotal = round2(unitPrice * quantity - discount);
    tax = 0;
    total = subtotal;
  }

  return { subtotal, tax, total };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
