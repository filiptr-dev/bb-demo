"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useQuoteBasket } from "@/hooks/useQuoteBasket";

// Header shortcut to the quote basket; hidden while the basket is empty.
export default function QuoteHeaderLink({ onClick }: { onClick?: () => void }) {
  const t = useTranslations("Quote");
  const count = useQuoteBasket()?.length ?? 0;
  if (!count) return null;
  return (
    <Link href="/quote" onClick={onClick} aria-label={t("basketAria", { count })} className="relative shrink-0 p-2 text-foreground/80 hover:text-brand-2 transition-colors">
      <ShoppingCart className="size-5" />
      <span className="absolute right-0 top-0 min-w-4 rounded-full bg-brand-1 px-1 text-center text-[10px] font-bold leading-4 text-white">{count}</span>
    </Link>
  );
}
