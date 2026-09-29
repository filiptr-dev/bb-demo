"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Shown when /api/products fails, so a failed request never reads as "no products found".
export default function SearchError({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  const t = useTranslations("Errors.search");
  return (
    <div role="alert" className={compact ? "px-4 py-4 text-sm" : "rounded-xl border border-dashed border-destructive/40 p-8 text-center"}>
      <p className={compact ? "text-foreground/70" : "text-lg font-semibold"}>{t("title")}</p>
      {!compact && <p className="text-foreground/50 mt-1 text-sm">{t("text")}</p>}
      <Button type="button" size="sm" variant="outline" onClick={onRetry} className={compact ? "mt-2 rounded-full" : "mt-4 rounded-full"}>
        {t("retry")}
      </Button>
    </div>
  );
}
