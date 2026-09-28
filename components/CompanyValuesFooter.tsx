import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import Reveal from "./Reveal";

export default async function CompanyValuesFooter() {
  const t = await getTranslations("CompanyValues");
  const tc = await getTranslations("Common");
  const values = t.raw("items") as { title: string; blurb: string }[];
  return (
    <div className="mt-14 pt-10 border-t border-foreground/[0.07]">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {values.map(({ title, blurb }, i) => (
          <Reveal key={title} delay={i * 0.06}>
            <div className="h-full p-5 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025]">
              <div className="font-numbers text-lg text-brand-1/70 mb-2">0{i + 1}</div>
              <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-foreground/55 leading-relaxed">{blurb}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/65">
        <span className="uppercase tracking-wide text-xs text-foreground/45">{t("mobileService")}</span>
        {site.phones.map((p) => (
          <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-1.5 hover:text-brand-2 transition-colors">
            <Phone className="size-3.5" /> {tc(`cities.${p.city}`)}: {p.label}
          </a>
        ))}
      </Reveal>
    </div>
  );
}
