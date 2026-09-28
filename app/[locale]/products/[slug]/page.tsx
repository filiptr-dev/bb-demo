import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { productCategories, getProductCategory } from "@/lib/domain/taxonomy";
import CompanyValuesFooter from "@/components/layout/CompanyValuesFooter";

export function generateStaticParams() {
  return productCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getProductCategory(slug);
  if (!c) return {};
  const tp = await getTranslations({ locale, namespace: "ProductCategories" });
  return {
    title: tp(`${c.slug}.name`),
    description: tp(`${c.slug}.blurb`),
    alternates: alternatesFor(`/products/${c.slug}`, locale),
  };
}

export default async function ProductCategoryPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const c = getProductCategory(slug);
  if (!c) notFound();
  const t = await getTranslations("ProductCategoryDetail");
  const tp = await getTranslations("ProductCategories");

  return (
    <div className="container mx-auto px-6 lg:px-10 pt-24 pb-14">
      <Link href="/#skf-offer" className="text-xs uppercase tracking-wide text-foreground/50 hover:text-brand-2 transition-colors">
        {t("back")}
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold">{tp(`${c.slug}.name`)}</h1>
      <p className="mt-2 text-foreground/60 max-w-2xl leading-relaxed">{tp(`${c.slug}.blurb`)}</p>
      <div className="mt-8 p-6 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025] max-w-2xl">
        <p className="text-sm text-foreground/60 leading-relaxed">{t("contactIntro")}</p>
        <Link href="/contact" className="mt-4 inline-block text-brand-2 text-sm font-semibold uppercase tracking-wide hover:underline">
          {t("contactCta")}
        </Link>
      </div>
      <CompanyValuesFooter />
    </div>
  );
}
