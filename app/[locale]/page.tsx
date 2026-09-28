import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import CountUp from "@/components/CountUp";
import SkfLogo from "@/components/SkfLogo";
import { site } from "@/lib/site";
import ParallaxLayer from "@/components/ParallaxLayer";
import { industries, productCategories } from "@/lib/data";

const bg = "linear-gradient(180deg, var(--surface-a) 0%, var(--surface-b) 15%, var(--surface-c) 50%, var(--surface-b) 85%, var(--surface-a) 100%)";

// Vary each grid item's entrance direction by column so cards don't all slide in from the same spot.
const dir3 = [
  { x: -45, y: 15, rotate: -2 },
  { x: 0, y: 45, rotate: 0 },
  { x: 45, y: 15, rotate: 2 },
];
const dir4 = [
  { x: -35, y: 22 },
  { x: -12, y: 34 },
  { x: 12, y: 34 },
  { x: 35, y: 22 },
];

type Stat = { value: number; suffix: string; label: string };
type Item = { title: string; blurb: string };
type Category = { name: string; blurb: string; href: string };

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Home");
  const ti = await getTranslations("Industries");
  const tp = await getTranslations("ProductCategories");
  const stats = t.raw("about.stats") as Stat[];
  const categories = t.raw("products.categories") as Category[];
  const why = t.raw("why.items") as Item[];
  const badges = t.raw("about.badges") as string[];

  return (
    <>
      <Hero />

      <section id="about" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden" style={{ background: bg }}>
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

      <section id="products" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden">
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow={t("products.eyebrow")} num="02" center>
            {t("products.headingPrefix")} <span className="text-gradient-brand">{t("products.headingHighlight")}</span>
          </SectionHeading>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(({ name, blurb, href }, i) => (
              <Reveal key={name} delay={i * 0.08} {...dir3[i % 3]}>
                <Link href={href} className="group block h-full p-6 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025] hover:bg-foreground/[0.05] hover:border-brand-1/25 transition-all duration-500">
                  <span className="font-numbers text-3xl text-brand-1/60 group-hover:text-brand-2 transition-colors">0{i + 1}</span>
                  <h3 className="font-display font-bold text-lg mt-2 mb-1.5 group-hover:text-brand-2 transition-colors">{name}</h3>
                  <p className="text-sm text-foreground/55 leading-relaxed">{blurb}</p>
                  <span className="inline-block mt-3 text-xs text-brand-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">{t("products.more")}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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

      <section id="industries" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--surface-solid) 0%, rgba(var(--surface-tint),0.92) 15%, rgba(var(--surface-tint),0.88) 50%, rgba(var(--surface-tint),0.92) 85%, var(--surface-solid) 100%)" }} />
        <ParallaxLayer range={90} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-1/[0.03] rounded-full blur-[200px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow={t("industries.eyebrow")} num="04" center>
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

      <section id="brands" className="relative py-16 lg:py-20 overflow-hidden" style={{ background: bg }}>
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow={t("brands.eyebrow")} num="05">
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
      </section>

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
    </>
  );
}
