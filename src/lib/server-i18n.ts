import { getDictionary, type Dictionary } from "@/lib/i18n";
import { auth } from "@/lib/auth";

/**
 * Get the locale of the current user (from their tenant's locale setting)
 * Falls back to the user's personal locale preference, then "th".
 */
export async function getUserLocale(): Promise<"th" | "en"> {
  const session = await auth();
  if (!session?.user?.id) return "th";

  // Use the user's personal locale preference stored in the User table
  // For now, default to "th" for Thai users
  return "th";
}

/**
 * Server component helper: get dictionary for the current user's locale.
 */
export async function getServerDictionary(): Promise<Dictionary> {
  const locale = await getUserLocale();
  return getDictionary(locale);
}

/**
 * Format currency based on locale
 */
export function formatCurrency(amount: number, currency: string = "THB", locale: string = "th"): string {
  const symbols: Record<string, string> = {
    THB: "฿",
    USD: "$",
    EUR: "€",
    JPY: "¥",
  };
  const symbol = symbols[currency] ?? currency;
  const formatted = amount.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Format date based on locale
 */
export function formatDate(date: Date | string, locale: string = "th"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string, locale: string = "th"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
