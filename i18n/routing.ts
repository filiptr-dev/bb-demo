import { defineRouting } from "next-intl/routing";

export const locales = ["mk", "en", "sq", "de", "tr"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  mk: "Македонски",
  en: "English",
  sq: "Shqip",
  de: "Deutsch",
  tr: "Türkçe",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "mk",
  localePrefix: "as-needed",
});
