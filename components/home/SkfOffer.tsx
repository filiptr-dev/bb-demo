import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import { site } from "@/lib/site";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { productCategories } from "@/lib/domain/taxonomy";
import { dir4 } from "./layout";

export default async function SkfOffer() {
  const t = await getTranslations("Home");
  const tp = await getTranslations("ProductCategories");

  return (
    <section id="skf-offer" className="relative scroll-mt-16 py-16 lg:py-24 overflow-hidden">
      <ParallaxLayer range={60} className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-brand-1/[0.035] rounded-full blur-[200px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow={t("skfOffer.eyebrow")} num="03" center>
          {t("skfOffer.headingPrefix")} <span className="text-gradient-brand">{t("skfOffer.headingHighlight")}</span>
        </SectionHeading>
        <Reveal delay={0.2}>
          <p className="max-w-2xl mx-auto -mt-4 text-center text-foreground/60 leading-relaxed">{t("skfOffer.lead")}</p>
          <div className="mt-6 mb-12 flex justify-center">
            <span className="inline-flex items-center gap-3 rounded-full border border-foreground/10 bg-foreground/[0.03] pl-1.5 pr-4 py-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.skfLogo} alt="SKF" className="h-8 w-8 rounded-lg" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60 font-semibold">{t("brands.eyebrow")}</span>
            </span>
          </div>
        </Reveal>
        {/* flex-wrap + justify-center so the last, partial row sits centred instead of hugging the left edge */}
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4 lg:gap-5">
          {productCategories.map((c, idx) => (
            <Reveal
              key={c.slug}
              delay={(idx % 4) * 0.06}
              {...dir4[idx % 4]}
              className="w-[calc(50%-0.5rem)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <Link
                href={`/products/${c.slug}`}
                className="group flex flex-col h-full rounded-2xl overflow-hidden border border-foreground/[0.08] bg-card hover:border-brand-1/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-1/10 transition-all duration-300"
              >
                {/* product shots are cut out on white, so the plate stays white in every theme */}
                <div className="relative aspect-[4/3] bg-white overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={tp(`${c.slug}.name`)}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain p-3 md:p-4 transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <span className="absolute top-2.5 left-3 font-numbers text-base tracking-wide text-neutral-400">{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5 border-t border-foreground/[0.06]">
                  <span className="text-xs md:text-sm font-semibold leading-snug group-hover:text-brand-2 transition-colors">{tp(`${c.slug}.name`)}</span>
                  <span
                    aria-hidden
                    className="shrink-0 grid place-items-center w-7 h-7 rounded-full border border-foreground/15 text-xs text-foreground/50 group-hover:bg-brand-1 group-hover:border-brand-1 group-hover:text-white transition-colors"
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
