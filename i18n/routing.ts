import { defineRouting } from "next-intl/routing";

export const locales = ["mk", "en", "sq"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  mk: "Македонски",
  en: "English",
  sq: "Shqip",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "mk",
  localePrefix: "as-needed",
});
