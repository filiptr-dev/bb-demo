import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CatalogClient from "@/components/catalog/CatalogClient";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { productCount } from "@/server/products";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.catalog" });
  return { title: t("title"), description: t("description"), alternates: alternatesFor("/catalog", locale) };
}

export default async function CatalogPage({ params }: PageProps<"/[locale]/catalog">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Catalog.page");
  const count = await productCount();
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden py-10 lg:py-12">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-brand-1/[0.05] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10">
          <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">
            {t("titlePrefix")} <span className="text-gradient-brand">{t("titleHighlight")}</span>
          </h1>
          <p className="text-foreground/55 max-w-2xl text-sm md:text-base">{t("subtitle", { count: count.toLocaleString(locale) })}</p>
        </div>
      </section>
      <Suspense fallback={<p className="container mx-auto px-6 text-foreground/50">{t("loading")}</p>}>
        <CatalogClient catalogTotal={count} />
      </Suspense>
    </div>
  );
}
