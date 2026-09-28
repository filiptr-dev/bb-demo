"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { industries } from "@/lib/domain/taxonomy";
import { PAGE_SIZE, type SortKey } from "@/lib/catalog-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/Pagination";
import { useDebounced } from "@/hooks/useDebounced";
import { useProductSearch } from "@/hooks/useProductSearch";
import FilterPanel from "./FilterPanel";
import ResultsTable from "./ResultsTable";
import ResultsGrid from "./ResultsGrid";
import type { CatalogFilters } from "./types";

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const chip = (on: boolean) =>
  `shrink-0 rounded-full px-3.5 text-xs uppercase tracking-wide ${on ? "bg-brand-gradient text-white border-transparent hover:opacity-90" : ""}`;
const filterKeys = ["type", "bore", "seal", "dmin", "dmax", "Dmin", "Dmax", "Bmin", "Bmax"] as const;

// patch: keys to change (empty string removes). Resets page unless page is patched.
function patchUrl(patch: Record<string, string>) {
  const params = new URLSearchParams(window.location.search);
  if (!("page" in patch)) params.delete("page");
  for (const [k, v] of Object.entries(patch)) {
    if (v) params.set(k, v);
    else params.delete(k);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

export default function CatalogClient({ catalogTotal }: { catalogTotal: number }) {
  const t = useTranslations("Catalog.client");
  const ti = useTranslations("Industries");
  const locale = useLocale();
  const sp = useSearchParams();
  const g = (k: string) => sp.get(k) ?? "";
  const urlSearch = g("search");
  const inds = list(sp.get("industry"));
  const f = Object.fromEntries(filterKeys.map((k) => [k, g(k)])) as CatalogFilters;
  const sort = (g("sort") || "") as SortKey | "";
  const dir = g("dir") === "desc" ? "desc" : "asc";
  const view = g("view") === "grid" ? "grid" : "table";

  // search box: typing updates `q`; results and the URL follow once typing pauses
  const [q, setQ] = useState(urlSearch);
  const dq = useDebounced(q, 300);
  const [open, setOpen] = useState(true);
  const written = useRef(urlSearch); // the search value last written to (or read from) the URL

  const update = (patch: Record<string, string>) => {
    if ("search" in patch) written.current = patch.search;
    patchUrl(patch);
  };

  useEffect(() => {
    // URL changed from outside (back/forward, header search): adopt it
    if (urlSearch !== written.current) {
      written.current = urlSearch;
      setQ(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    if (dq !== written.current) update({ search: dq });
  }, [dq]);

  const filterCount = inds.length + [f.type, f.bore, f.seal, f.dmin || f.dmax, f.Dmin || f.Dmax, f.Bmin || f.Bmax].filter(Boolean).length;

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

  // the URL's filter keys are the API's; search comes from the debounced input, not the URL
  const apiQuery = useMemo(() => {
    const params = new URLSearchParams(sp.toString());
    params.delete("view");
    params.set("search", dq);
    params.set("locale", locale);
    params.set("limit", String(PAGE_SIZE));
    return params.toString();
  }, [sp, dq, locale]);
  const { data, loading } = useProductSearch(apiQuery); // previous results stay visible (dimmed) until the new ones arrive

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cur = data?.page ?? 1;
  const count = { b: (c: React.ReactNode) => <span className="text-foreground font-semibold">{c}</span>, n: (c: React.ReactNode) => <span className="text-foreground/70">{c}</span> };

  return (
    <div className="container mx-auto px-6 lg:px-10 pb-16">
      <div className="sticky top-16 z-30 -mx-6 px-6 lg:-mx-10 lg:px-10 py-3 bg-background/95 backdrop-blur-xl border-b border-foreground/[0.06]">
        <div className="flex gap-2">
          <Input
            type="search"
            value={q}
            autoFocus={!!urlSearch}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="flex-1 min-w-0 h-12 rounded-xl px-4 text-sm"
          />
          <Button variant={open ? "secondary" : "outline"} onClick={() => setOpen(!open)} aria-expanded={open} className="h-12 rounded-xl px-4">
            {t("filters")}
            {filterCount > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">{filterCount}</Badge>}
          </Button>
          <Button variant="outline" onClick={() => update({ view: view === "table" ? "grid" : "" })} aria-label={t("viewToggleLabel")} title={view === "table" ? t("viewGrid") : t("viewTable")} className="h-12 rounded-xl px-4">
            {view === "table" ? "▦" : "☰"}
          </Button>
          {(filterCount > 0 || q) && (
            <Button variant="outline" onClick={reset} className="h-12 rounded-xl px-4">{t("resetFilters")}</Button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" variant="outline" onClick={() => update({ industry: "" })} className={chip(inds.length === 0)}>{t("allIndustries")}</Button>
          {industries.map((i) => (
            <Button key={i.slug} size="sm" variant="outline" onClick={() => toggleInd(i.slug)} aria-pressed={inds.includes(i.slug)} className={chip(inds.includes(i.slug))}>{ti(`${i.slug}.name`)}</Button>
          ))}
        </div>
      </div>

      <FilterPanel open={open} f={f} update={update} onReset={reset} canReset={filterCount > 0 || !!q} />

      <div className="flex items-center justify-between py-4 text-sm">
        <p className={`text-foreground/50 ${data ? "" : "invisible"}`} aria-live="polite">
          {total === catalogTotal ? t.rich("resultCount", { count: total, ...count }) : t.rich("resultCountOf", { count: total, total: catalogTotal, ...count })}
          {filterCount > 0 && <span className="text-foreground/35"> {t("filteredSuffix")}</span>}
        </p>
        <p className="text-foreground/40">{t("pageLabel")} {cur} {t("of")} {pages}</p>
      </div>

      {!data ? (
        <p className="py-10 text-center text-foreground/50">{t("loading")}</p>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/15 p-10 text-center">
          <p className="text-lg font-semibold">{t("noResultsTitle")}</p>
          <p className="text-foreground/50 mt-1 text-sm">{t("noResultsHint")}</p>
        </div>
      ) : view === "table" ? (
        <ResultsTable rows={rows} sort={sort} dir={dir} onSort={toggleSort} dimmed={loading} />
      ) : (
        <ResultsGrid rows={rows} dimmed={loading} />
      )}

      <Pagination page={cur} pages={pages} onPage={(n) => update({ page: String(n) })} labels={{ nav: t("pagination"), prev: t("prev"), next: t("next") }} />
    </div>
  );
}
