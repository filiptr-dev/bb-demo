import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import ParallaxLayer from "@/components/motion/ParallaxLayer";
import { industries } from "@/lib/domain/taxonomy";
import { dir4 } from "./layout";

export default async function Industries() {
  const t = await getTranslations("Home");
  const ti = await getTranslations("Industries");

  return (
    <section id="industries" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--surface-solid) 0%, rgba(var(--surface-tint),0.92) 15%, rgba(var(--surface-tint),0.88) 50%, rgba(var(--surface-tint),0.92) 85%, var(--surface-solid) 100%)" }} />
      <ParallaxLayer range={90} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-1/[0.03] rounded-full blur-[200px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow={t("industries.eyebrow")} num="03" center>
          {t("industries.headingPrefix")} <span className="text-gradient-brand">{t("industries.headingHighlight")}</span>
        </SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {industries.map((i, idx) => (
            <Reveal key={i.slug} delay={idx * 0.05} {...dir4[idx % 4]}>
              <Link
                href={`/catalog?industry=${i.slug}`}
                className="group relative h-36 rounded-xl overflow-hidden border border-foreground/[0.07] hover:border-brand-1/30 flex flex-col items-center justify-center gap-2 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
              >
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${i.image})` }} />
                {/* dark scrim + literal white text: always overlaid on a real photo, so it stays theme-independent for legibility */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors" />
                <span className="relative font-numbers text-2xl text-white/75 group-hover:text-white transition-colors">0{idx + 1}</span>
                <span className="relative text-xs uppercase tracking-wide font-semibold text-white">{ti(`${i.slug}.name`)}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3} className="text-center mt-8">
          <Link href="/catalog" className="inline-block px-7 py-3 border border-foreground/25 rounded-full text-xs uppercase tracking-wide hover:bg-foreground/10 transition-colors">{t("industries.openCatalog")}</Link>
        </Reveal>
      </div>
    </section>
  );
}
