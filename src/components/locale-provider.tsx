"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Dictionary | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const dict = useMemo(() => getDictionary(locale), [locale]);
  return <LocaleContext.Provider value={dict}>{children}</LocaleContext.Provider>;
}

export function useT(): Dictionary {
  const dict = useContext(LocaleContext);
  if (!dict) {
    // Fallback if provider is missing — use default locale
    return getDictionary("th");
  }
  return dict;
}
