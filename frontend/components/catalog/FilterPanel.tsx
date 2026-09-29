"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { boreCodes, sealCodes } from "@/lib/domain/product";
import { bearingTypes } from "@/lib/domain/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductLabels } from "@/components/product/useProductLabels";
import type { CatalogFilters, UpdateParams } from "./types";

const boreRanges = [
  { label: "", min: "", max: "" }, // "all" - label comes from translations
  { label: "≤ 30", min: "0", max: "30" },
  { label: "30–50", min: "30", max: "50" },
  { label: "50–80", min: "50", max: "80" },
  { label: "80–120", min: "80", max: "120" },
  { label: "120+", min: "120", max: "9999" },
];

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

function Range({ title, lo, hi, kLo, kHi, update }: { title: string; lo: string; hi: string; kLo: string; kHi: string; update: UpdateParams }) {
  const t = useTranslations("Catalog.client");
  return (
    <div>
      <Label className={label}>{title}</Label>
      <div className="flex items-center gap-2">
        <Input type="number" placeholder={t("min")} value={lo} onChange={(e) => update({ [kLo]: e.target.value })} className="h-10" />
        <span className="text-muted-foreground">-</span>
        <Input type="number" placeholder={t("max")} value={hi} onChange={(e) => update({ [kHi]: e.target.value })} className="h-10" />
      </div>
    </div>
  );
}

export default function FilterPanel({ open, f, update, onReset, canReset }: {
  open: boolean;
  f: CatalogFilters;
  update: UpdateParams;
  onReset: () => void;
  canReset: boolean;
}) {
  const t = useTranslations("Catalog.client");
  const { typeName, sealName, boreName } = useProductLabels();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] px-5 pb-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            <div>
              <Label className={label}>{t("classification")}</Label>
              <Pick value={f.type} onChange={(v) => update({ type: v })} allLabel={t("allClassifications")} options={bearingTypes.map((b) => ({ value: b.slug, label: typeName({ type: b.slug }) }))} />
            </div>
            <div>
              <Label className={label}>{t("boreTypeLabel")}</Label>
              <Pick value={f.bore} onChange={(v) => update({ bore: v })} allLabel={t("allBoreTypes")} options={boreCodes.map((b) => ({ value: b, label: boreName(b) }))} />
            </div>
            <div>
              <Label className={label}>{t("sealLabel")}</Label>
              <Pick value={f.seal} onChange={(v) => update({ seal: v })} allLabel={t("allSeals")} options={sealCodes.map((c) => ({ value: c, label: sealName(c) }))} />
            </div>
            <div>
              <Label className={label}>{t("quickBoreRange")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {boreRanges.map((r) => {
                  const on = f.dmin === r.min && f.dmax === r.max;
                  return (
                    <Button key={r.label || "all"} size="xs" variant={on ? "secondary" : "outline"} onClick={() => update({ dmin: r.min, dmax: r.max })} className={on ? "text-brand-2 border-brand-1/50" : ""}>{r.label || t("boreRangeAll")}</Button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Range title={t("dInner")} lo={f.dmin} hi={f.dmax} kLo="dmin" kHi="dmax" update={update} />
            <Range title={t("dOuter")} lo={f.Dmin} hi={f.Dmax} kLo="Dmin" kHi="Dmax" update={update} />
            <Range title={t("width")} lo={f.Bmin} hi={f.Bmax} kLo="Bmin" kHi="Bmax" update={update} />
          </div>
          <div className="mt-4 mb-1">
            <Button variant="outline" onClick={onReset} disabled={!canReset}>{t("clearAllFilters")}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
