import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alternatesFor, notFoundMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { industries, getIndustry } from "@/lib/domain/taxonomy";
import { productsByIndustry } from "@/server/products";
import ProductCard from "@/components/product/ProductCard";

export const revalidate = 3600;

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/industries/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const i = getIndustry(slug);
  if (!i) return notFoundMetadata(locale);
  const t = await getTranslations({ locale, namespace: "IndustryDetail" });
  const ti = await getTranslations({ locale, namespace: "Industries" });
  return {
    title: `${t("titlePrefix")} ${ti(`${i.slug}.name`).toLowerCase()}`,
    description: ti(`${i.slug}.blurb`),
    alternates: alternatesFor(`/industries/${i.slug}`, locale),
  };
}

export default async function IndustryPage({ params }: PageProps<"/[locale]/industries/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const i = getIndustry(slug);
  if (!i) notFound();
  const t = await getTranslations("IndustryDetail");
  const ti = await getTranslations("Industries");
  const list = await productsByIndustry(i.slug, 24);
  return (
    <div className="container mx-auto px-6 lg:px-10 pt-24 pb-14">
      <h1 className="font-display text-3xl md:text-4xl font-bold">{t("titlePrefix")} {ti(`${i.slug}.name`).toLowerCase()}</h1>
      <p className="mt-2 text-foreground/60 max-w-2xl">{ti(`${i.slug}.blurb`)}</p>
      <Link href={`/catalog?industry=${i.slug}`} className="mt-4 inline-block text-brand-2 font-semibold hover:underline">
        {t("catalogLink")}
      </Link>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </div>
  );
}
