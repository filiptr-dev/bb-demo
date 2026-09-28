import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SizeFinder from "@/components/tools/SizeFinder";
import ToolTabs from "@/components/tools/ToolTabs";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/size-finder">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.sizeFinder" });
  return { title: t("title"), description: t("description"), alternates: alternatesFor("/size-finder", locale) };
}

export default async function SizeFinderPage({ params }: PageProps<"/[locale]/size-finder">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("SizeFinder");
  return (
    <div className="pt-16">
      <section className="container mx-auto px-6 lg:px-10 py-12 lg:py-16 max-w-4xl">
        <ToolTabs current="sizeFinder" />
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">{t("title")}</h1>
        <p className="max-w-2xl text-sm md:text-base text-muted-foreground mb-10">{t("subtitle")}</p>
        <SizeFinder />
      </section>
    </div>
  );
}
