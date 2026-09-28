import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { alternatesFor, notFoundMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { productCategories, getProductCategory } from "@/lib/domain/taxonomy";
import { categoryContent } from "@/lib/domain/category-content";
import CategoryCard from "@/components/product/CategoryCard";
import CategoryContent from "@/components/product/CategoryContent";
import GreaseSelection from "@/components/product/GreaseSelection";
import CompanyValuesFooter from "@/components/layout/CompanyValuesFooter";

export function generateStaticParams() {
  return productCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getProductCategory(slug);
  if (!c) return notFoundMetadata(locale);
  const tp = await getTranslations({ locale, namespace: "ProductCategories" });
  return {
    title: tp(`${c.slug}.name`),
    description: tp(`${c.slug}.blurb`),
    alternates: alternatesFor(`/products/${c.slug}`, locale),
    openGraph: { images: [c.image] },
  };
}

// The next few categories in homepage order, wrapping around, so every page links onward.
function neighbours(slug: string, count = 4) {
  const i = productCategories.findIndex((c) => c.slug === slug);
  return Array.from({ length: count }, (_, k) => productCategories[(i + k + 1) % productCategories.length]);
}

export default async function ProductCategoryPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const c = getProductCategory(slug);
  if (!c) notFound();
  const t = await getTranslations("ProductCategoryDetail");
  const tp = await getTranslations("ProductCategories");
  const tf = await getTranslations("CategoryFacts");
  const name = tp(`${c.slug}.name`);
  const catalogHref = c.catalog === undefined ? null : c.catalog ? `/catalog?type=${c.catalog}` : "/catalog";

  return (
    <div className="container mx-auto max-w-6xl px-6 lg:px-10 pt-24 pb-14">
      <Link href="/#skf-offer" className="text-xs uppercase tracking-wide text-foreground/50 hover:text-brand-2 transition-colors">
        {t("back")}
      </Link>

      <header className="mt-6 grid gap-8 md:grid-cols-[1fr_minmax(0,400px)] md:items-center">
        <div>
          <p className="text-brand-2 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t("eyebrow")}</p>
          <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter">{name}</h1>
          <p className="mt-3 text-foreground/70 max-w-xl leading-relaxed">{tp(`${c.slug}.blurb`)}</p>
          <p className="mt-3 text-sm text-foreground/55 max-w-xl leading-relaxed">{t("contactIntro")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/contact" />} className="rounded-full bg-brand-gradient text-white">{t("quoteCta")}</Button>
            {catalogHref && (
              <Button nativeButton={false} render={<Link href={catalogHref} />} variant="outline" className="rounded-full">{t("catalogCta")}</Button>
            )}
          </div>
        </div>
        {/* product shots are cut out on white, so the plate stays white in every theme */}
        <div className="order-first md:order-none aspect-[4/3] rounded-2xl border border-foreground/[0.08] bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image} alt={name} className="size-full object-contain p-6" />
        </div>
      </header>

      {tf.has(c.slug) && (
        <section className="mt-16">
          <h2 className="font-display font-bold text-xl md:text-2xl tracking-tight mb-5">{t("factsHeading")}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {(tf.raw(c.slug) as string[]).map((fact) => (
              <li key={fact} className="flex gap-3 rounded-xl border border-foreground/[0.07] bg-foreground/[0.025] p-4 text-sm leading-relaxed text-foreground/75">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-1" />
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.slug === "greases" && <GreaseSelection />}

      {categoryContent[c.slug] && <CategoryContent content={categoryContent[c.slug]} />}

      <section className="mt-16">
        <h2 className="font-display font-bold text-xl md:text-2xl tracking-tight mb-5">{t("moreHeading")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {neighbours(c.slug).map((n) => (
            <CategoryCard key={n.slug} category={n} name={tp(`${n.slug}.name`)} />
          ))}
        </div>
      </section>

      <CompanyValuesFooter />
    </div>
  );
}
