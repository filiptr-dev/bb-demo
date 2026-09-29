"use client";

import { useTranslations } from "next-intl";
import { Check, ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { quoteBasket, useQuoteBasket } from "@/hooks/useQuoteBasket";

type P = { slug: string; designation: string };

// "icon" toggles the item in and out of the basket (catalog table rows); "full" adds it, then links to the basket.
export default function AddToQuoteButton({ p, variant = "full" }: { p: P; variant?: "full" | "icon" }) {
  const t = useTranslations("Quote");
  const items = useQuoteBasket();
  const inBasket = !!items?.some((i) => i.slug === p.slug);

  if (variant === "icon")
    return (
      <button
        type="button"
        onClick={() => (inBasket ? quoteBasket.remove(p.slug) : quoteBasket.add(p))}
        aria-pressed={inBasket}
        aria-label={t(inBasket ? "removeAria" : "addAria", { designation: p.designation })}
        title={t(inBasket ? "removeAria" : "addAria", { designation: p.designation })}
        className={`relative block transition-colors ${inBasket ? "text-brand-2" : "text-muted-foreground hover:text-brand-2"}`}
      >
        <ShoppingCart className="size-[18px]" />
        {inBasket && <Check className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-brand-1 p-px text-white" strokeWidth={4} />}
      </button>
    );

  if (inBasket)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-2"><Check className="size-4" /> {t("added")}</span>
        <Link href="/quote" className="text-sm underline underline-offset-4 hover:text-brand-2">{t("view")}</Link>
      </div>
    );

  return (
    <Button onClick={() => quoteBasket.add(p)} disabled={items === null} className="h-11 rounded-full bg-brand-gradient px-6 text-xs font-semibold uppercase tracking-wide text-white">
      <ShoppingCart className="size-4" /> {t("add")}
    </Button>
  );
}
