"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import ContactForm from "@/components/contact/ContactForm";
import { MAX_QTY, quoteBasket, useQuoteBasket } from "@/hooks/useQuoteBasket";

export default function QuoteBasket() {
  const t = useTranslations("Quote");
  const items = useQuoteBasket();
  // once sent the basket is cleared, but the form must stay up to show its thank-you
  const [sent, setSent] = useState(false);

  if (items === null) return <div className="min-h-[16rem]" />;

  if (!items.length && !sent)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">{t("empty")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link href="/catalog" className="rounded-full bg-brand-gradient px-5 py-2.5 text-xs uppercase tracking-wide text-white">{t("browseCatalog")}</Link>
          <Link href="/size-finder" className="rounded-full border px-5 py-2.5 text-xs uppercase tracking-wide hover:text-brand-2">{t("findBySize")}</Link>
        </div>
      </div>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {!sent && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">{t("itemsHeading", { count: items.length })}</h2>
            <button type="button" onClick={quoteBasket.clear} className="text-xs text-muted-foreground hover:text-destructive">{t("clear")}</button>
          </div>
          <ul className="divide-y rounded-2xl border bg-card">
            {items.map((i) => (
              <li key={i.slug} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/catalog/${i.slug}`} className="min-w-0 flex-1 truncate font-mono font-bold hover:text-brand-2">{i.designation}</Link>
                <label className="sr-only" htmlFor={`qty-${i.slug}`}>{t("quantity")}</label>
                <Input
                  id={`qty-${i.slug}`}
                  type="number"
                  min={1}
                  max={MAX_QTY}
                  value={i.qty}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => quoteBasket.setQty(i.slug, Number(e.target.value))}
                  className="h-9 w-24 text-right font-mono"
                />
                <span className="text-xs text-muted-foreground">{t("pcs")}</span>
                <button type="button" onClick={() => quoteBasket.remove(i.slug)} aria-label={t("removeAria", { designation: i.designation })} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{t("note")}</p>
        </div>
      )}
      <div className={sent ? "lg:col-span-2 mx-auto w-full max-w-xl" : ""}>
        <ContactForm items={items.map(({ designation, qty }) => ({ designation, qty }))} onSent={() => { setSent(true); quoteBasket.clear(); }} />
      </div>
    </div>
  );
}
