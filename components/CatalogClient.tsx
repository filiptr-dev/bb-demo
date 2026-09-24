"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { bearingTypes, getType, industries, products, Product } from "@/lib/data";
import { searchProducts } from "@/lib/search";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  { key: "d", label: "Отвор d (mm)", num: true },
  { key: "D", label: "Надв. D (mm)", num: true },
  { key: "B", label: "Ширина B (mm)", num: true },
];

const chip = (on: boolean) =>
  `shrink-0 rounded-full px-3.5 text-xs uppercase tracking-wide ${on ? "bg-brand-gradient text-white border-transparent hover:opacity-90" : ""}`;
const label = "text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block";
const ALL = "__all";

function Pick({ value, onChange, allLabel, options }: { value: string; onChange: (v: string) => void; allLabel: string; options: { value: string; label: string }[] }) {
  const items = [{ value: ALL, label: allLabel }, ...options];
  return (
    <Select items={items} value={value || ALL} onValueChange={(v) => onChange(!v || v === ALL ? "" : String(v))}>
      <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
      <SelectContent>
        {items.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

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
      <Label className={label}>{lab}</Label>
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="Мин" value={lo} onChange={(e) => update({ [kLo]: e.target.value })} className="h-10" />
        <span className="text-muted-foreground">-</span>
        <Input type="number" placeholder="Макс" value={hi} onChange={(e) => update({ [kHi]: e.target.value })} className="h-10" />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 lg:px-10 pb-16">
      <div className="sticky top-16 z-30 -mx-6 px-6 lg:-mx-10 lg:px-10 py-3 bg-background/95 backdrop-blur-xl border-b border-foreground/[0.06]">
        <div className="flex gap-2">
          <Input
            type="search"
            value={q}
            autoFocus={!!urlSearch}
            onChange={(e) => { setQ(e.target.value); update({ search: e.target.value }); }}
            placeholder="Ознака (6205, 22220), димензии (25x52x15), број (25) или збор (цемент, конусни)…"
            aria-label="Пребарај по ознака"
            className="flex-1 min-w-0 h-12 rounded-xl px-4 text-sm"
          />
          <Button variant={open ? "secondary" : "outline"} onClick={() => setOpen(!open)} aria-expanded={open} className="h-12 rounded-xl px-4">
            Филтри
            {filterCount > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">{filterCount}</Badge>}
          </Button>
          <Button variant="outline" onClick={() => update({ view: view === "table" ? "grid" : "" })} aria-label="Промени приказ" title={view === "table" ? "Мрежа" : "Табела"} className="h-12 rounded-xl px-4">
            {view === "table" ? "▦" : "☰"}
          </Button>
          {(filterCount > 0 || q) && (
            <Button variant="outline" onClick={reset} className="h-12 rounded-xl px-4">Ресетирај</Button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" variant="outline" onClick={() => update({ industry: "" })} className={chip(inds.length === 0)}>Сите индустрии</Button>
          {industries.map((i) => (
            <Button key={i.slug} size="sm" variant="outline" onClick={() => toggleInd(i.slug)} aria-pressed={inds.includes(i.slug)} className={chip(inds.includes(i.slug))}>{i.name}</Button>
          ))}
        </div>

      </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] px-5 pb-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                <div>
                  <Label className={label}>Класификација</Label>
                  <Pick value={type} onChange={(v) => update({ type: v })} allLabel="Сите класификации" options={bearingTypes.map((t) => ({ value: t.slug, label: t.name }))} />
                </div>
                <div>
                  <Label className={label}>Тип на отвор</Label>
                  <Pick value={bore} onChange={(v) => update({ bore: v })} allLabel="Сите типови" options={boreTypes.map((t) => ({ value: t, label: t }))} />
                </div>
                <div>
                  <Label className={label}>Тип на заптивање</Label>
                  <Pick value={seal} onChange={(v) => update({ seal: v })} allLabel="Сите видови" options={sealTypes.map((t) => ({ value: t, label: t }))} />
                </div>
                <div>
                  <Label className={label}>Брз опсег на отвор (mm)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {boreRanges.map((r) => {
                      const on = dmin === r.min && dmax === r.max;
                      return (
                        <Button key={r.label} size="xs" variant={on ? "secondary" : "outline"} onClick={() => update({ dmin: r.min, dmax: r.max })} className={on ? "text-brand-2 border-brand-1/50" : ""}>{r.label}</Button>
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
                <Button variant="outline" onClick={reset} disabled={filterCount === 0 && !q}>✕ Исчисти ги сите филтри</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <div className="flex items-center justify-between py-4 text-sm">
        <p className="text-foreground/50" aria-live="polite">
          Прикажани <span className="text-foreground font-semibold">{results.length}</span> {results.length === 1 ? "производ" : "производи"}
          {filterCount > 0 && <span className="text-foreground/35"> (филтрирано)</span>}
        </p>
        <p className="text-foreground/40">Страна {cur} од {pages}</p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/15 p-10 text-center">
          <p className="text-lg font-semibold">Нема пронајдени производи</p>
          <p className="text-foreground/50 mt-1 text-sm">Проверете ја ознаката или ресетирајте ги филтрите. Јавете ни се – ќе го најдеме лежиштето за вас.</p>
        </div>
      ) : view === "table" ? (
        <div className="rounded-xl border bg-card/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 text-[11px] uppercase tracking-wider">
                {columns.map((c) => (
                  <TableHead key={c.key} onClick={() => toggleSort(c.key)} aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"} className={`px-2.5 py-3 cursor-pointer select-none hover:text-foreground whitespace-nowrap ${c.num ? "text-right" : ""}`}>
                    {c.label}
                    {sort === c.key && <span className="ml-1 text-brand-1">{dir === "asc" ? "▲" : "▼"}</span>}
                  </TableHead>
                ))}
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <motion.tr key={p.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="group border-b transition-colors hover:bg-accent/40">
                  <TableCell className="px-2.5 py-3">
                    <Link href={`/catalog/${p.slug}`} className="font-mono font-bold hover:text-brand-2 transition-colors">{p.designation}</Link>
                  </TableCell>
                  <TableCell className="px-2.5 py-3">
                    <Badge variant="secondary" className="text-brand-2 whitespace-nowrap">{getType(p.type)?.name}</Badge>
                  </TableCell>
                  <TableCell className="px-2.5 py-3 text-muted-foreground text-xs whitespace-nowrap">{p.boreType}</TableCell>
                  <TableCell className="px-2.5 py-3 text-muted-foreground text-xs whitespace-nowrap">{p.seal}</TableCell>
                  <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{p.d}</TableCell>
                  <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{p.D}</TableCell>
                  <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{p.B}</TableCell>
                  <TableCell className="px-2.5 py-3">
                    <Link href={`/catalog/${p.slug}`} aria-label={`Погледни: ${p.designation}`} className="text-muted-foreground group-hover:text-brand-2 transition-colors"><ShoppingCart className="size-[18px]" /></Link>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link href={`/catalog/${p.slug}`} className="group block rounded-xl bg-foreground/[0.03] border border-foreground/5 p-5 hover:border-brand-1/20 hover:bg-foreground/[0.05] transition-all">
                <h3 className="font-mono font-bold text-sm mb-3 group-hover:text-brand-2 transition-colors">{p.designation}</h3>
                <Badge variant="secondary" className="text-brand-2 mb-3">{getType(p.type)?.name}</Badge>
                <div className="space-y-1.5 text-xs text-foreground/45">
                  {([["d ⌀", p.d], ["D ⌀", p.D], ["B", p.B]] as const).map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono text-foreground/70">{v} mm</span></div>
                  ))}
                  <div className="flex justify-between"><span>Заптивање</span><span className="text-foreground/70 truncate ml-2">{p.seal}</span></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Страници" className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="icon" disabled={cur === 1} onClick={() => update({ page: String(cur - 1) })} aria-label="Претходна">‹</Button>
          {pageNums.map((n, i) =>
            n === "…" ? (
              <span key={`d${i}`} className="px-1 text-foreground/30">…</span>
            ) : (
              <Button key={n} size="icon" variant="outline" onClick={() => update({ page: String(n) })} aria-current={n === cur} className={n === cur ? "bg-brand-gradient text-white border-transparent hover:opacity-90" : ""}>{n}</Button>
            )
          )}
          <Button variant="outline" size="icon" disabled={cur === pages} onClick={() => update({ page: String(cur + 1) })} aria-label="Следна">›</Button>
        </nav>
      )}
    </div>
  );
}
