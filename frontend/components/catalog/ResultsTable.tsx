"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { dim, type Product } from "@/lib/domain/product";
import type { SortKey } from "@/lib/catalog-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductLabels } from "@/components/product/useProductLabels";

const columns: { key: SortKey; label: string; num?: boolean }[] = [
  { key: "designation", label: "designation" },
  { key: "type", label: "classification" },
  { key: "boreType", label: "boreType" },
  { key: "seal", label: "seal" },
  { key: "d", label: "dInner", num: true },
  { key: "D", label: "dOuter", num: true },
  { key: "B", label: "width", num: true },
];

export default function ResultsTable({ rows, sort, dir, onSort, dimmed }: {
  rows: Product[];
  sort: SortKey | "";
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  dimmed: boolean;
}) {
  const t = useTranslations("Catalog.client");
  const { typeName, sealName, boreName } = useProductLabels();

  return (
    <div className={`rounded-xl border bg-card/50 overflow-hidden transition-opacity ${dimmed ? "opacity-60" : ""}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60 text-[11px] uppercase tracking-wider">
            {columns.map((c) => (
              <TableHead key={c.key} onClick={() => onSort(c.key)} aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"} className={`px-2.5 py-3 cursor-pointer select-none hover:text-foreground whitespace-nowrap ${c.num ? "text-right" : ""}`}>
                {t(`columns.${c.label}`)}
                {sort === c.key && <span className="ml-1 text-brand-1">{dir === "asc" ? "▲" : "▼"}</span>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => (
            <motion.tr key={p.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="group border-b transition-colors hover:bg-accent/40">
              <TableCell className="px-2.5 py-3">
                <Link href={`/catalog/${p.slug}`} className="font-mono font-bold hover:text-brand-2 transition-colors">{p.designation}</Link>
              </TableCell>
              <TableCell className="px-2.5 py-3">
                <Badge variant="secondary" className="text-brand-2 whitespace-nowrap">{typeName(p)}</Badge>
              </TableCell>
              <TableCell className="px-2.5 py-3 text-muted-foreground text-xs whitespace-nowrap">{boreName(p.boreType)}</TableCell>
              <TableCell className="px-2.5 py-3 text-muted-foreground text-xs whitespace-nowrap">{sealName(p.seal)}</TableCell>
              <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{dim(p.d)}</TableCell>
              <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{dim(p.D)}</TableCell>
              <TableCell className="px-2.5 py-3 text-right font-mono text-foreground/80">{dim(p.B)}</TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
