import { getTranslations } from "next-intl/server";
import { none, type Cell, type Comparison } from "@/lib/domain/comparisons";

const th = "px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-foreground/60 align-bottom";

export default async function ComparisonTable({ table }: { table: Comparison }) {
  const t = await getTranslations("Comparisons");
  const ts = await getTranslations("Specs");
  const cell = (c: Cell) => (typeof c === "string" ? c : ts(`values.${c.t}`));
  const note = `${table.id}.note`;

  return (
    <section className="mt-16">
      <h2 className="font-display font-bold text-xl md:text-2xl tracking-tight mb-2">{t(`${table.id}.title`)}</h2>
      {t.has(note) && <p className="mb-5 text-sm text-foreground/60 max-w-2xl leading-relaxed">{t(note)}</p>}
      <div className="rounded-2xl border border-foreground/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-foreground/[0.08]">
            <tr>
              <th scope="col" className={`${th} text-left sticky left-0 bg-muted`}><span className="sr-only">{ts("labels.parameter")}</span></th>
              {table.columns.map((c, i) => (
                <th key={i} scope="col" className={`${th} text-left normal-case tracking-normal text-xs font-display font-bold text-foreground whitespace-nowrap`}>{cell(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.label} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02]">
                <th scope="row" className="px-3 py-2 text-left font-medium text-foreground/70 sticky left-0 bg-background min-w-36">{ts(`labels.${r.label}`)}</th>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-3 py-2 text-foreground/80 tabular-nums min-w-28">{cell(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.rows.some((r) => r.cells.includes(none)) && <p className="mt-3 text-xs text-foreground/50">{t("notSpecified")}</p>}
    </section>
  );
}
