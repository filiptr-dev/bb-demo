"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, getPathname, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { dims } from "@/lib/domain/product";
import ProductTypeImage from "@/components/product/ProductTypeImage";
import { useProductLabels } from "@/components/product/useProductLabels";
import { useDebounced } from "@/hooks/useDebounced";
import { useProductSearch } from "@/hooks/useProductSearch";
import SearchError from "@/components/shared/SearchError";

const MAX = 6;

export default function HeaderSearch({ placeholder, className = "", inputClassName = "", onNavigate }: {
  placeholder: string;
  className?: string;
  inputClassName?: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const { typeName } = useProductLabels();
  const locale = useLocale();
  const router = useRouter();
  const catalogAction = getPathname({ href: "/catalog", locale });
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);

  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 150);
  const [open, setOpen] = useState(false);
  // highlighted row, remembered per query so a new result list starts unselected
  const [sel, setSel] = useState({ q: "", i: -1 });
  const active = sel.q === dq ? sel.i : -1;
  const setActive = (next: number | ((i: number) => number)) =>
    setSel({ q: dq, i: typeof next === "function" ? next(active) : next });

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const { data, error, retry } = useProductSearch(dq ? new URLSearchParams({ search: dq, locale, limit: String(MAX) }).toString() : null);
  // keep showing the previous results until the new ones arrive
  const results = dq && !error ? data?.rows ?? [] : [];
  const total = dq && !error ? data?.total ?? 0 : 0;
  const show = open && dq.length > 0 && (data !== null || error);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? results.length - 1 : a - 1)); }
    else if (e.key === "Enter" && show && active >= 0) { e.preventDefault(); go(`/catalog/${results[active].slug}`); }
  };

  return (
    <form ref={rootRef} action={catalogAction} className={`relative ${className}`} role="search" onSubmit={() => { setOpen(false); onNavigate?.(); }}>
      <label htmlFor={`${listId}-input`} className="sr-only">{t("searchLabel")}</label>
      <Input
        id={`${listId}-input`}
        name="search"
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={inputClassName}
      />

      {show && (
        <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {error ? (
            <SearchError onRetry={retry} compact />
          ) : results.length ? (
            <ul id={listId} role="listbox" className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {results.map((p, i) => (
                  <li key={p.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={`/catalog/${p.slug}`}
                      onClick={() => { setOpen(false); setQ(""); onNavigate?.(); }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${i === active ? "bg-foreground/[0.06]" : ""}`}
                    >
                      <ProductTypeImage type={p.type} className="w-16 h-14 shrink-0 rounded-lg" />
                      <span className="min-w-0">
                        <span className="block font-mono font-bold text-sm truncate">{p.designation}</span>
                        <span className="block text-xs text-foreground/55 truncate">{typeName(p)}</span>
                        <span className="block text-[11px] font-mono text-foreground/45">{dims(p)} mm</span>
                      </span>
                    </Link>
                  </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm text-foreground/60">{t("searchNoResults")}</p>
          )}
          {total > 0 && (
            <button
              type="button"
              onClick={() => go(`/catalog?search=${encodeURIComponent(dq)}`)}
              className="w-full border-t border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-2 hover:bg-foreground/[0.04] transition-colors"
            >
              {t("searchViewAll", { count: total.toLocaleString(locale) })} →
            </button>
          )}
        </div>
      )}
    </form>
  );
}
