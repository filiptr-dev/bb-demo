import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import ParallaxLayer from "@/components/motion/ParallaxLayer";

export default async function Cta() {
  const t = await getTranslations("Home");

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--brand-glow-1-rgb),0.12) 0%, var(--surface-a) 30%, var(--surface-b) 50%, var(--surface-a) 70%, rgba(var(--brand-glow-2-rgb),0.06) 100%)" }} />
      <ParallaxLayer range={60} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-1/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10 text-center">
        <Reveal>
          <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight mb-4">
            {t("cta.heading1")}<br /><span className="text-gradient-brand glow-text">{t("cta.headingHighlight")}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-foreground/60 max-w-xl mx-auto mb-8">{t("cta.blurb")}</p>
        </Reveal>
        <Reveal delay={0.3} className="flex flex-wrap justify-center gap-3">
          <a href="#contact" className="px-7 py-3.5 bg-brand-gradient font-semibold rounded-full hover:shadow-[0_0_45px_rgba(var(--brand-glow-1-rgb),0.5)] transition-shadow text-xs tracking-wide uppercase">{t("cta.contact")}</a>
          <Link href="/catalog" className="px-7 py-3.5 border border-foreground/25 rounded-full hover:bg-foreground/10 transition-colors text-xs tracking-wide uppercase">{t("cta.catalog")}</Link>
        </Reveal>
      </div>
    </section>
  );
}
