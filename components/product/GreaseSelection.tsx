import { getTranslations } from "next-intl/server";
import { basicGreaseSelection, greaseChart, greaseChartColumns, type Suitability } from "@/lib/domain/greases";

const heading = "font-display font-bold text-xl md:text-2xl tracking-tight mb-2";
const th = "px-2.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-foreground/60 align-bottom";

const mark: Record<Suitability, { symbol: string; className: string }> = {
  "+": { symbol: "+", className: "bg-brand-1 text-white" },
  o: { symbol: "o", className: "bg-brand-1/15 text-brand-1" },
  "-": { symbol: "–", className: "text-foreground/30" },
};

function Mark({ value, label }: { value: Suitability; label: string }) {
  const m = mark[value];
  return (
    <span title={label} className={`inline-flex size-6 items-center justify-center rounded-full font-bold text-xs ${m.className}`}>
      <span aria-hidden>{m.symbol}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default async function GreaseSelection() {
  const t = await getTranslations("Greases");
  const fitLabel: Record<Suitability, string> = { "+": t("fit.recommended"), o: t("fit.suitable"), "-": t("fit.notSuitable") };

  return (
    <>
      <section className="mt-16">
        <h2 className={heading}>{t("basicHeading")}</h2>
        <p className="mb-5 text-sm text-foreground/60 max-w-2xl leading-relaxed">{t("basicIntro")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {basicGreaseSelection.map((row) => (
            <li key={row.code} className="flex items-start gap-4 rounded-xl border border-foreground/[0.08] bg-card p-4">
              <span className="font-display font-bold text-sm tracking-tight whitespace-nowrap text-brand-2">{row.code}</span>
              <span className="text-sm leading-snug text-foreground/75">{t(`condition.${row.condition}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-foreground/50">{t("lgmt3Note")}</p>
      </section>

      <section className="mt-16">
        <h2 className={heading}>{t("chartHeading")}</h2>
        <p className="mb-5 text-sm text-foreground/60 max-w-2xl leading-relaxed">{t("chartIntro")}</p>
        <div className="rounded-2xl border border-foreground/[0.08] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-foreground/[0.08]">
              <tr>
                <th scope="col" className={`${th} text-left sticky left-0 bg-muted`}>{t("col.grease")}</th>
                <th scope="col" className={`${th} text-right`}>{t("col.range")}</th>
                <th scope="col" className={`${th} text-right`}>{t("col.viscosity")}</th>
                <th scope="col" className={`${th} text-center`}>{t("col.temp")}</th>
                <th scope="col" className={`${th} text-center`}>{t("col.speed")}</th>
                <th scope="col" className={`${th} text-center`}>{t("col.load")}</th>
                {greaseChartColumns.map((c) => (
                  <th key={c} scope="col" className={`${th} text-center min-w-20 normal-case tracking-normal text-xs leading-tight`}>{t(`col.${c}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {greaseChart.map((g) => (
                <tr key={g.code} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02]">
                  <th scope="row" className="px-2.5 py-2 text-left font-display font-bold whitespace-nowrap sticky left-0 bg-background">{g.code}</th>
                  <td className="px-2.5 py-2 text-right tabular-nums whitespace-nowrap text-foreground/75">{g.tempC[0]} / {g.tempC[1]} °C</td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-foreground/75">{g.viscosity}</td>
                  <td className="px-2.5 py-2 text-center whitespace-nowrap text-foreground/75">{g.temp}</td>
                  <td className="px-2.5 py-2 text-center whitespace-nowrap text-foreground/75">{g.speed}</td>
                  <td className="px-2.5 py-2 text-center whitespace-nowrap text-foreground/75">{g.load}</td>
                  {g.fit.map((f, i) => (
                    <td key={greaseChartColumns[i]} className="px-2.5 py-2 text-center">
                      <Mark value={f} label={fitLabel[f]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/55">
          {(["+", "o", "-"] as const).map((f) => (
            <span key={f} className="inline-flex items-center gap-2">
              <Mark value={f} label={fitLabel[f]} />
              <span aria-hidden>{fitLabel[f]}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground/50 leading-relaxed">{t("levelsLegend")}</p>
        <p className="mt-1 text-xs text-foreground/50 leading-relaxed">{t("viscosityNote")}</p>
      </section>
    </>
  );
}
