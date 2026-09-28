import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import { dir3 } from "./layout";

type Item = { title: string; blurb: string };

export default async function WhyUs() {
  const t = await getTranslations("Home");
  const why = t.raw("why.items") as Item[];

  return (
    <section id="why" className="relative py-16 lg:py-20 overflow-hidden">
      <div className="relative container mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow={t("why.eyebrow")} num="06" center>
          {t("why.headingPrefix")} <span className="text-gradient-brand">{t("why.headingHighlight1")}</span>{t("why.headingMiddle")} <span className="text-gradient-brand">{t("why.headingHighlight2")}</span>
        </SectionHeading>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {why.map(({ title, blurb }, i) => (
            <Reveal key={title} delay={i * 0.08} {...dir3[i % 3]}>
              <div className="group h-full p-6 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025] hover:bg-foreground/[0.05] hover:border-brand-1/25 transition-all duration-500">
                <div className="w-11 h-11 rounded-xl bg-brand-1/10 group-hover:bg-brand-1/20 flex items-center justify-center font-numbers text-xl text-brand-1 group-hover:text-brand-2 mb-4 transition-colors">{i + 1}</div>
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-brand-2 transition-colors">{title}</h3>
                <p className="text-sm text-foreground/55 leading-relaxed">{blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
