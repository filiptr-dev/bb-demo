import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import CountUp from "@/components/motion/CountUp";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { sectionBg, dir4 } from "./layout";

type Stat = { value: number; suffix: string; label: string };

export default async function About() {
  const t = await getTranslations("Home");
  const stats = t.raw("about.stats") as Stat[];
  const badges = t.raw("about.badges") as string[];

  return (
    <section id="about" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden" style={{ background: sectionBg }}>
      <ParallaxLayer range={70} className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-brand-1/[0.03] rounded-full blur-[180px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow={t("about.eyebrow")} num="01">
          {t("about.headingPrefix")} <span className="text-gradient-brand">{t("about.headingHighlight")}</span>
        </SectionHeading>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <Reveal x={-50} y={0} duration={1} className="relative">
            <div className="relative overflow-hidden rounded-2xl h-[320px] lg:h-[380px] bg-gradient-to-br from-[var(--about-img-a)] to-[var(--about-img-b)] border border-foreground/[0.06]">
              <img src="/images/about/team.png" alt={t("about.imageAlt")} className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom" />
            </div>
            <div className="absolute -bottom-5 -right-3 md:-right-5 bg-brand-gradient rounded-2xl p-5 shadow-2xl shadow-brand-1/20">
              <div className="font-numbers text-4xl">{t("about.years")}</div>
              <div className="text-white/90 text-xs max-w-[5.5rem] leading-snug">{t("about.yearsLabel")}</div>
            </div>
          </Reveal>
          <Reveal x={50} y={0} duration={1} delay={0.2}>
            <p className="text-foreground/65 leading-relaxed mb-4">
              {t("about.p1")}
            </p>
            <p className="text-foreground/65 leading-relaxed mb-6">
              {t("about.p2")}
            </p>
            <ul className="flex flex-wrap gap-2 mb-6">
              {badges.map((b) => (
                <li key={b} className="px-3 py-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] text-xs text-foreground/70">{b}</li>
              ))}
            </ul>
            <Link href="/catalog" className="text-brand-2 text-sm font-semibold uppercase tracking-wide hover:underline">{t("about.ctaCatalog")}</Link>
          </Reveal>
        </div>

        <dl className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-foreground/[0.07] pt-10">
          {stats.map(({ value, suffix, label }, i) => (
            <Reveal key={label} delay={i * 0.1} className="text-center" {...dir4[i % 4]}>
              <dt className="font-numbers text-5xl lg:text-6xl tracking-wider"><CountUp to={value} suffix={suffix} /></dt>
              <dd className="text-foreground/55 text-xs mt-1.5 tracking-wide uppercase">{label}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
