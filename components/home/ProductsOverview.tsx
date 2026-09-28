import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import { dir3 } from "./layout";

type Category = { name: string; blurb: string; href: string };

export default async function ProductsOverview() {
  const t = await getTranslations("Home");
  const categories = t.raw("products.categories") as Category[];

  return (
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
  );
}
