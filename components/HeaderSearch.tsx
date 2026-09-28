"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, getPathname, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { dims, getType, type Product } from "@/lib/data";

const MAX = 6;

export default function HeaderSearch({ placeholder, className = "", inputClassName = "", onNavigate }: {
  placeholder: string;
  className?: string;
  inputClassName?: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const tt = useTranslations("BearingTypes");
  const locale = useLocale();
  const router = useRouter();
  const catalogAction = getPathname({ href: "/catalog", locale });
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);

  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const id = setTimeout(() => { setDq(q.trim()); setActive(-1); }, 150);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const [found, setFound] = useState<{ q: string; rows: Product[]; total: number }>({ q: "", rows: [], total: 0 });
  useEffect(() => {
    if (!dq) return;
    const ctl = new AbortController();
    fetch(`/api/products?${new URLSearchParams({ search: dq, locale, limit: String(MAX) })}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setFound({ q: dq, rows: d.rows, total: d.total }))
      .catch((e) => { if (e?.name !== "AbortError") setFound({ q: dq, rows: [], total: 0 }); });
    return () => ctl.abort();
  }, [dq, locale]);
  // keep showing the previous results until the new ones arrive
  const results = dq ? found.rows : [];
  const total = dq ? found.total : 0;
  const show = open && dq.length > 0 && found.q !== "";

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
          {results.length ? (
            <ul id={listId} role="listbox" className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {results.map((p, i) => {
                const bt = getType(p.type);
                return (
                  <li key={p.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={`/catalog/${p.slug}`}
                      onClick={() => { setOpen(false); setQ(""); onNavigate?.(); }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${i === active ? "bg-foreground/[0.06]" : ""}`}
                    >
                      {/* legacy type banners: product photo on the left ~55%, logo panel on the right — show only the product */}
                      <span className="relative w-16 h-14 shrink-0 rounded-lg bg-white overflow-hidden">
                        {bt?.image && (bt.banner
                          ? <img src={bt.image} alt="" className="absolute left-0 top-1/2 -translate-y-1/2 w-[185%] max-w-none" />
                          : <img src={bt.image} alt="" className="absolute inset-0 size-full object-cover" />)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono font-bold text-sm truncate">{p.designation}</span>
                        <span className="block text-xs text-foreground/55 truncate">{tt(`${p.type}.name`)}</span>
                        <span className="block text-[11px] font-mono text-foreground/45">{dims(p)} mm</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
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
