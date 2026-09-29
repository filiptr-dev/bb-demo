"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { dim, type Product } from "@/lib/domain/product";
import { Badge } from "@/components/ui/badge";
import { useProductLabels } from "@/components/product/useProductLabels";

export default function ResultsGrid({ rows, dimmed }: { rows: Product[]; dimmed: boolean }) {
  const t = useTranslations("Catalog.client");
  const { typeName, sealName } = useProductLabels();

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${dimmed ? "opacity-60" : ""}`}>
      {rows.map((p, i) => (
        <motion.div key={p.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
          <Link href={`/catalog/${p.slug}`} className="group block rounded-xl bg-foreground/[0.03] border border-foreground/5 p-5 hover:border-brand-1/20 hover:bg-foreground/[0.05] transition-all">
            <h3 className="font-mono font-bold text-sm mb-3 group-hover:text-brand-2 transition-colors">{p.designation}</h3>
            <Badge variant="secondary" className="text-brand-2 mb-3">{typeName(p)}</Badge>
            <div className="space-y-1.5 text-xs text-foreground/45">
              {([["d ⌀", p.d], ["D ⌀", p.D], ["B", p.B]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono text-foreground/70">{dim(v)} mm</span></div>
              ))}
              <div className="flex justify-between"><span>{t("columns.seal")}</span><span className="text-foreground/70 truncate ml-2">{sealName(p.seal)}</span></div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
