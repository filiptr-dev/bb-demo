"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { bearingTypes, getType, industries, products } from "@/lib/data";
import { searchProducts } from "@/lib/search";

const PAGE = 15;
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

const chip = (on: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-xs uppercase tracking-wide transition-all ${
    on ? "bg-gradient-to-r from-flame to-amber border-transparent text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/25"
  }`;

export default function CatalogClient() {
  const sp = useSearchParams();
  const urlSearch = sp.get("search") ?? "";
  const inds = list(sp.get("industry"));
  const type = sp.get("type") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const [q, setQ] = useState(urlSearch);
  const written = useRef(urlSearch);

  useEffect(() => {
    if (urlSearch !== written.current) {
      written.current = urlSearch;
      setQ(urlSearch);
    }
  }, [urlSearch]);

  function update(next: { search?: string; industry?: string[]; type?: string; page?: number }) {
    const s = next.search ?? q;
    const i = next.industry ?? inds;
    const t = next.type ?? type;
    const pg = next.page ?? 1;
    const params = new URLSearchParams();
    if (s.trim()) params.set("search", s);
    if (i.length) params.set("industry", i.join(","));
    if (t) params.set("type", t);
    if (pg > 1) params.set("page", String(pg));
    written.current = s;
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const toggle = (slug: string) => update({ industry: inds.includes(slug) ? inds.filter((x) => x !== slug) : [...inds, slug] });

  const results = useMemo(() => {
    let r = searchProducts(products, q);
    if (inds.length) r = r.filter((p) => p.industries.some((i) => inds.includes(i)));
    if (type) r = r.filter((p) => p.type === type);
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sp]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = results.slice((cur - 1) * PAGE, cur * PAGE);
  const pageNums: (number | "…")[] = [];
  if (pages <= 7) for (let i = 1; i <= pages; i++) pageNums.push(i);
  else {
    pageNums.push(1);
    if (cur > 3) pageNums.push("…");
    for (let i = Math.max(2, cur - 1); i <= Math.min(pages - 1, cur + 1); i++) pageNums.push(i);
    if (cur < pages - 2) pageNums.push("…");
    pageNums.push(pages);
  }

  return (
    <div className="container mx-auto px-6 lg:px-10 pb-16">
      <div className="sticky top-16 z-30 -mx-6 px-6 lg:-mx-10 lg:px-10 py-3 bg-ink/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="search"
            value={q}
            autoFocus={!!urlSearch}
            onChange={(e) => { setQ(e.target.value); update({ search: e.target.value }); }}
            placeholder="Пребарај по ознака (6205, 7311 BECBM, 22220) или димензии (25x52x15)…"
            aria-label="Пребарај по ознака"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/35 focus:outline-none focus:border-flame/50 focus:ring-1 focus:ring-flame/30 transition-all"
          />
          <select
            value={type}
            onChange={(e) => update({ type: e.target.value })}
            aria-label="Тип на лежиште"
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-flame/50 md:w-72"
          >
            <option value="" className="bg-ink">Сите типови</option>
            {bearingTypes.map((t) => <option key={t.slug} value={t.slug} className="bg-ink">{t.name}</option>)}
          </select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => update({ industry: [] })} className={chip(inds.length === 0)}>Сите индустрии</button>
          {industries.map((i) => (
            <button key={i.slug} onClick={() => toggle(i.slug)} aria-pressed={inds.includes(i.slug)} className={chip(inds.includes(i.slug))}>{i.name}</button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-white/50" aria-live="polite">
        <span className="text-white font-semibold">{results.length}</span> {results.length === 1 ? "производ" : "производи"}
        {(inds.length > 0 || type) && (
          <button onClick={() => update({ industry: [], type: "" })} className="ml-3 text-amber hover:underline">Исчисти филтри</button>
        )}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 p-10 text-center">
          <p className="text-lg font-semibold">Нема пронајдени производи</p>
          <p className="text-white/50 mt-1 text-sm">Проверете ја ознаката или исчистете ги филтрите. Јавете ни се – ќе го најдеме лежиштето за вас.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-4 py-3 font-medium">Ознака</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Тип</th>
                <th className="px-4 py-3 font-medium text-right">d (mm)</th>
                <th className="px-4 py-3 font-medium text-right">D (mm)</th>
                <th className="px-4 py-3 font-medium text-right">B (mm)</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Заптивање</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <motion.tr
                  key={p.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group border-t border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/catalog/${p.slug}`} className="font-mono font-bold hover:text-amber transition-colors after:absolute after:inset-0 md:after:hidden">
                      {p.designation}
                    </Link>
                    <div className="text-[11px] text-white/40 md:hidden">{getType(p.type)?.name}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-flame/10 text-flame text-[11px] font-medium">{getType(p.type)?.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.d}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.D}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.B}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-white/55 text-xs">{p.seal}</td>
                  <td className="px-4 py-3 text-white/30 group-hover:text-amber transition-colors">→</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Страници" className="flex items-center justify-center gap-2 mt-6">
          <button disabled={cur === 1} onClick={() => update({ page: cur - 1 })} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30" aria-label="Претходна">‹</button>
          {pageNums.map((n, i) =>
            n === "…" ? (
              <span key={`d${i}`} className="px-1 text-white/30">…</span>
            ) : (
              <button key={n} onClick={() => update({ page: n })} aria-current={n === cur} className={`w-10 h-10 rounded-lg text-sm font-medium ${n === cur ? "bg-gradient-to-r from-flame to-amber" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{n}</button>
            )
          )}
          <button disabled={cur === pages} onClick={() => update({ page: cur + 1 })} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30" aria-label="Следна">›</button>
        </nav>
      )}
    </div>
  );
}
