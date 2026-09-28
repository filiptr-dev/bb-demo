"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { useDebounced } from "@/hooks/useDebounced";
import { useProductSearch } from "@/hooks/useProductSearch";
import SearchError from "@/components/shared/SearchError";
import type { Dim } from "@/lib/catalog-query";

const LIMIT = 24;
const tolerances = [0, 0.5, 1, 2];
const fields: { key: Dim; label: "bore" | "outer" | "width"; placeholder: string }[] = [
  { key: "d", label: "bore", placeholder: "25" },
  { key: "D", label: "outer", placeholder: "52" },
  { key: "B", label: "width", placeholder: "15" },
];

// "25,5" (comma decimals) and "25.5" both count; anything else is ignored.
const mm = (v: string) => {
  const n = parseFloat(v.trim().replace(",", "."));
  return isNaN(n) || n <= 0 ? null : n;
};

// Catalog range params (dmin/dmax, Dmin/Dmax, Bmin/Bmax) for the measured sizes ± tolerance; null until one size is set.
function rangeParams(vals: Record<Dim, string>, tol: number) {
  const p: Record<string, string> = {};
  for (const { key } of fields) {
    const n = mm(vals[key]);
    if (n == null) continue;
    p[`${key}min`] = String(Math.max(0, n - tol));
    p[`${key}max`] = String(n + tol);
  }
  return Object.keys(p).length ? p : null;
}

export default function SizeFinder() {
  const t = useTranslations("SizeFinder");
  const [vals, setVals] = useState<Record<Dim, string>>({ d: "", D: "", B: "" });
  const [tol, setTol] = useState(0);

  const range = rangeParams(vals, tol);
  const query = useDebounced(range ? new URLSearchParams({ ...range, sort: "d", limit: String(LIMIT) }).toString() : null, 300);
  const { data, loading, error, retry } = useProductSearch(query);
  const catalogHref = range ? `/catalog?${new URLSearchParams({ ...range, sort: "d" })}` : "/catalog";

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <Label htmlFor={`size-${f.key}`} className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t(f.label)} <span className="font-mono normal-case">({f.key})</span>
            </Label>
            <div className="relative">
              <Input
                id={`size-${f.key}`}
                inputMode="decimal"
                autoComplete="off"
                value={vals[f.key]}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="h-12 rounded-xl pl-4 pr-10 font-mono text-lg"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] uppercase tracking-wider text-muted-foreground">{t("tolerance")}</span>
        {tolerances.map((v) => (
          <Button
            key={v}
            size="xs"
            variant={tol === v ? "secondary" : "outline"}
            onClick={() => setTol(v)}
            className={tol === v ? "text-brand-2 border-brand-1/50" : ""}
          >
            {v === 0 ? t("exact") : `± ${v} mm`}
          </Button>
        ))}
      </div>

      <div className="mt-8 min-h-[8rem]">
        {!range && <p className="text-sm text-muted-foreground">{t("empty")}</p>}

        {range && error && <SearchError onRetry={retry} />}

        {range && !error && data && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {data.total === 0 ? (
              <p className="text-sm text-muted-foreground">{tol < 2 ? t("noneTryTolerance") : t("none")}</p>
            ) : (
              <>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{t("found", { count: data.total })}</p>
                  {data.total > LIMIT && (
                    <Link href={catalogHref} className="text-sm font-semibold text-brand-2 hover:underline">
                      {t("viewAll", { count: data.total })}
                    </Link>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.rows.map((p) => <ProductCard key={p.slug} p={p} />)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
