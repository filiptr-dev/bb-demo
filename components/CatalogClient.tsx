"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { bearingTypes, getType, industries, products, Product } from "@/lib/data";
import { searchProducts } from "@/lib/search";

const PAGE = 15;
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const num = (v: string) => (v === "" || isNaN(Number(v)) ? null : Number(v));

const boreRanges = [
  { label: "Сите", min: "", max: "" },
  { label: "≤ 30", min: "0", max: "30" },
  { label: "30–50", min: "30", max: "50" },
  { label: "50–80", min: "50", max: "80" },
  { label: "80–120", min: "80", max: "120" },
  { label: "120+", min: "120", max: "9999" },
];

type SortKey = "designation" | "type" | "boreType" | "seal" | "d" | "D" | "B";
const columns: { key: SortKey; label: string; cls?: string; num?: boolean }[] = [
  { key: "designation", label: "Ознака" },
  { key: "type", label: "Класификација" },
  { key: "boreType", label: "Тип на отвор" },
  { key: "seal", label: "Заптивање" },
  { key: "d", label: "Отвор d ⌀ (mm)", num: true },
  { key: "D", label: "Надворешен D ⌀ (mm)", num: true },
  { key: "B", label: "Ширина B (mm)", num: true },
];

const chip = (on: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-xs uppercase tracking-wide transition-all ${
    on ? "bg-gradient-to-r from-flame to-amber border-transparent text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/25"
  }`;
const field = "w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-flame/50";
const label = "text-[11px] text-white/45 uppercase tracking-wider mb-1.5 block";

function sortVal(p: Product, k: SortKey): string | number {
  if (k === "type") return getType(p.type)?.name ?? "";
  return p[k];
}

export default function CatalogClient() {
  const sp = useSearchParams();
  const g = (k: string) => sp.get(k) ?? "";
  const urlSearch = g("search");
  const inds = list(sp.get("industry"));
  const type = g("type"), bore = g("bore"), seal = g("seal");
  const dmin = g("dmin"), dmax = g("dmax"), Dmin = g("Dmin"), Dmax = g("Dmax"), Bmin = g("Bmin"), Bmax = g("Bmax");
  const sort = (g("sort") || "") as SortKey | "";
  const dir = g("dir") === "desc" ? "desc" : "asc";
  const view = g("view") === "grid" ? "grid" : "table";
  const page = Math.max(1, parseInt(g("page") || "1", 10) || 1);

  const [q, setQ] = useState(urlSearch);
  const [open, setOpen] = useState(true);
  const written = useRef(urlSearch);

  useEffect(() => {
    if (urlSearch !== written.current) {
      written.current = urlSearch;
      setQ(urlSearch);
    }
  }, [urlSearch]);

  const filterCount =
    inds.length + [type, bore, seal, dmin || dmax, Dmin || Dmax, Bmin || Bmax].filter(Boolean).length;

  // patch: keys to change (empty string removes). Resets page unless page is patched.
  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(window.location.search);
    if (!("page" in patch)) params.delete("page");
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    if ("search" in patch) written.current = patch.search;
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const reset = () => {
    written.current = "";
    setQ("");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const toggleInd = (slug: string) =>
    update({ industry: (inds.includes(slug) ? inds.filter((x) => x !== slug) : [...inds, slug]).join(",") });

  const toggleSort = (k: SortKey) => {
    if (sort !== k) update({ sort: k, dir: "" });
    else if (dir === "asc") update({ sort: k, dir: "desc" });
    else update({ sort: "", dir: "" });
  };

  const sealTypes = useMemo(() => [...new Set(products.map((p) => p.seal))], []);
  const boreTypes = useMemo(() => [...new Set(products.map((p) => p.boreType))], []);

  const results = useMemo(() => {
    let r = searchProducts(products, q);
    if (inds.length) r = r.filter((p) => p.industries.some((i) => inds.includes(i)));
    if (type) r = r.filter((p) => p.type === type);
    if (bore) r = r.filter((p) => p.boreType === bore);
    if (seal) r = r.filter((p) => p.seal === seal);
    const inRange = (v: number, lo: string, hi: string) => (num(lo) === null || v >= num(lo)!) && (num(hi) === null || v <= num(hi)!);
    r = r.filter((p) => inRange(p.d, dmin, dmax) && inRange(p.D, Dmin, Dmax) && inRange(p.B, Bmin, Bmax));
    if (sort) {
      const k = sort as SortKey;
      r = [...r].sort((a, b) => {
        const x = sortVal(a, k), y = sortVal(b, k);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "mk", { numeric: true });
        return dir === "desc" ? -c : c;
      });
    }
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

  const range = (lab: string, lo: string, hi: string, kLo: string, kHi: string) => (
    <div>
      <label className={label}>{lab}</label>
      <div className="flex items-center gap-2">
        <input type="number" placeholder="Мин" value={lo} onChange={(e) => update({ [kLo]: e.target.value })} className={field} />
        <span className="text-white/30">—</span>
        <input type="number" placeholder="Макс" value={hi} onChange={(e) => update({ [kHi]: e.target.value })} className={field} />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 lg:px-10 pb-16">
      <div className="sticky top-16 z-30 -mx-6 px-6 lg:-mx-10 lg:px-10 py-3 bg-ink/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex gap-2">
          <input
            type="search"
            value={q}
            autoFocus={!!urlSearch}
            onChange={(e) => { setQ(e.target.value); update({ search: e.target.value }); }}
            placeholder="Ознака (6205, 22220), димензии (25x52x15), број (25) или збор (цемент, конусни)…"
            aria-label="Пребарај по ознака"
            className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/35 focus:outline-none focus:border-flame/50 focus:ring-1 focus:ring-flame/30 transition-all"
          />
          <button onClick={() => setOpen(!open)} aria-expanded={open} className={`flex items-center gap-2 px-4 rounded-xl border text-sm transition-all ${open ? "bg-flame/15 border-flame/40 text-flame" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}>
            Филтри
            {filterCount > 0 && <span className="w-5 h-5 rounded-full bg-flame text-white text-[10px] font-bold flex items-center justify-center">{filterCount}</span>}
          </button>
          <button onClick={() => update({ view: view === "table" ? "grid" : "" })} aria-label="Промени приказ" title={view === "table" ? "Мрежа" : "Табела"} className="px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
            {view === "table" ? "▦" : "☰"}
          </button>
          {(filterCount > 0 || q) && (
            <button onClick={reset} className="px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-all">
              Ресетирај
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => update({ industry: "" })} className={chip(inds.length === 0)}>Сите индустрии</button>
          {industries.map((i) => (
            <button key={i.slug} onClick={() => toggleInd(i.slug)} aria-pressed={inds.includes(i.slug)} className={chip(inds.includes(i.slug))}>{i.name}</button>
          ))}
        </div>

      </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 pb-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                <div>
                  <label className={label}>Класификација</label>
                  <select value={type} onChange={(e) => update({ type: e.target.value })} className={field}>
                    <option value="" className="bg-ink">Сите класификации</option>
                    {bearingTypes.map((t) => <option key={t.slug} value={t.slug} className="bg-ink">{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Тип на отвор</label>
                  <select value={bore} onChange={(e) => update({ bore: e.target.value })} className={field}>
                    <option value="" className="bg-ink">Сите типови</option>
                    {boreTypes.map((t) => <option key={t} value={t} className="bg-ink">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Тип на заптивање</label>
                  <select value={seal} onChange={(e) => update({ seal: e.target.value })} className={field}>
                    <option value="" className="bg-ink">Сите видови</option>
                    {sealTypes.map((t) => <option key={t} value={t} className="bg-ink">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Брз опсег на отвор (mm)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {boreRanges.map((r) => {
                      const on = dmin === r.min && dmax === r.max;
                      return (
                        <button key={r.label} onClick={() => update({ dmin: r.min, dmax: r.max })} className={`px-2 py-1 text-[11px] rounded-md border transition-all ${on ? "bg-flame/20 border-flame/40 text-flame" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {range("Внатрешен дијаметар d (mm)", dmin, dmax, "dmin", "dmax")}
                {range("Надворешен дијаметар D (mm)", Dmin, Dmax, "Dmin", "Dmax")}
                {range("Ширина B (mm)", Bmin, Bmax, "Bmin", "Bmax")}
              </div>
              <div className="mt-4 mb-1">
                <button onClick={reset} disabled={filterCount === 0 && !q} className="px-5 py-2.5 rounded-lg border border-flame/40 text-flame text-xs uppercase tracking-wide hover:bg-flame/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ✕ Исчисти ги сите филтри
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <div className="flex items-center justify-between py-4 text-sm">
        <p className="text-white/50" aria-live="polite">
          Прикажани <span className="text-white font-semibold">{results.length}</span> {results.length === 1 ? "производ" : "производи"}
          {filterCount > 0 && <span className="text-white/35"> (филтрирано)</span>}
        </p>
        <p className="text-white/40">Страна {cur} од {pages}</p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-10 text-center">
          <p className="text-lg font-semibold">Нема пронајдени производи</p>
          <p className="text-white/50 mt-1 text-sm">Проверете ја ознаката или ресетирајте ги филтрите. Јавете ни се – ќе го најдеме лежиштето за вас.</p>
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left text-[11px] uppercase tracking-wider text-white/45">
                {columns.map((c) => (
                  <th key={c.key} onClick={() => toggleSort(c.key)} aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"} className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap ${c.num ? "text-right" : ""}`}>
                    {c.label}
                    {sort === c.key && <span className="ml-1 text-flame">{dir === "asc" ? "▲" : "▼"}</span>}
                  </th>
                ))}
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <motion.tr key={p.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="group border-t border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/catalog/${p.slug}`} className="font-mono font-bold hover:text-amber transition-colors">{p.designation}</Link>
                    
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-flame/10 text-flame text-[11px] font-medium whitespace-nowrap">{getType(p.type)?.name}</span>
                  </td>
                  <td className="px-4 py-3 text-white/55 text-xs whitespace-nowrap">{p.boreType}</td>
                  <td className="px-4 py-3 text-white/55 text-xs whitespace-nowrap">{p.seal}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.d}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.D}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/75">{p.B}</td>
                  <td className="px-4 py-3 text-white/30 group-hover:text-amber transition-colors">→</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link href={`/catalog/${p.slug}`} className="group block rounded-xl bg-white/[0.03] border border-white/5 p-5 hover:border-flame/20 hover:bg-white/[0.05] transition-all">
                <h3 className="font-mono font-bold text-sm mb-3 group-hover:text-amber transition-colors">{p.designation}</h3>
                <span className="inline-block px-2 py-0.5 rounded-md bg-flame/10 text-flame text-[10px] font-medium mb-3">{getType(p.type)?.name}</span>
                <div className="space-y-1.5 text-xs text-white/45">
                  {([["d ⌀", p.d], ["D ⌀", p.D], ["B", p.B]] as const).map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono text-white/70">{v} mm</span></div>
                  ))}
                  <div className="flex justify-between"><span>Заптивање</span><span className="text-white/70 truncate ml-2">{p.seal}</span></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Страници" className="flex items-center justify-center gap-2 mt-6">
          <button disabled={cur === 1} onClick={() => update({ page: String(cur - 1) })} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30" aria-label="Претходна">‹</button>
          {pageNums.map((n, i) =>
            n === "…" ? (
              <span key={`d${i}`} className="px-1 text-white/30">…</span>
            ) : (
              <button key={n} onClick={() => update({ page: String(n) })} aria-current={n === cur} className={`w-10 h-10 rounded-lg text-sm font-medium ${n === cur ? "bg-gradient-to-r from-flame to-amber" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{n}</button>
            )
          )}
          <button disabled={cur === pages} onClick={() => update({ page: String(cur + 1) })} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30" aria-label="Следна">›</button>
        </nav>
      )}
    </div>
  );
}
