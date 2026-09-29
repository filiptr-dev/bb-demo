import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import SkfLogo from "@/components/brand/SkfLogo";
import Marquee from "@/components/shared/Marquee";
import { Link } from "@/i18n/navigation";
import { skfLines } from "@/lib/domain/taxonomy";
import { sectionBg } from "./layout";

export default async function SkfBrand() {
  const t = await getTranslations("Home");

  return (
    <section id="brands" className="relative py-16 lg:py-20 overflow-hidden" style={{ background: sectionBg }}>
      <div className="relative container mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow={t("brands.eyebrow")} num="04">
          {t("brands.headingPrefix")} <span className="text-gradient-brand">{t("brands.headingHighlight")}</span>
        </SectionHeading>
        <Reveal>
          <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025] p-8 lg:p-10 grid md:grid-cols-[auto_1fr] gap-8 items-center">
            {/* SKF's own blue, not a theme token: the badge must match the brand in every theme */}
            <div className="w-56 lg:w-64 rounded-xl bg-[#0068b0] px-7 py-6 shadow-lg shadow-[#0068b0]/20">
              <SkfLogo className="w-full text-white" />
              <div className="mt-4 pt-3 border-t border-white/25 text-[11px] uppercase tracking-[0.25em] text-white/90 font-semibold">{t("brands.eyebrow")}</div>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2">{t("brands.title")}</h3>
              <p className="text-foreground/60 leading-relaxed">{t("brands.blurb")}</p>
            </div>
          </div>
        </Reveal>
      </div>
      <Reveal y={20} className="mt-12 lg:mt-14">
        <p className="container mx-auto px-6 lg:px-10 mb-5 text-xs uppercase tracking-[0.25em] text-foreground/45 font-semibold">{t("brands.linesLabel")}</p>
        <Marquee
          label={t("brands.linesLabel")}
          className="border-y border-foreground/[0.07] py-6"
          items={skfLines.map((line) => (
            <Link
              key={line.name}
              href={`/products/${line.category}`}
              className="flex items-center gap-10 pr-10 font-display font-bold text-xl lg:text-2xl whitespace-nowrap text-foreground/35 transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              {line.name}
              <span aria-hidden className="size-1.5 rounded-full bg-foreground/20" />
            </Link>
          ))}
        />
      </Reveal>
    </section>
  );
}
