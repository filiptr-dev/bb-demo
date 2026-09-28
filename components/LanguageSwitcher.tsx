"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function change(next: Locale) {
    // keep catalog filters etc. when switching language
    router.replace(`${pathname}${window.location.search}`, { locale: next });
  }

  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
        className="h-9 appearance-none rounded-full border border-border bg-transparent pl-3 pr-7 text-xs uppercase tracking-wider text-foreground/80 hover:border-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        {locales.map((l) => (
          <option key={l} value={l} className="bg-background text-foreground normal-case">
            {l.toUpperCase()} · {localeNames[l]}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[9px] text-foreground/50">▼</span>
    </label>
  );
}
