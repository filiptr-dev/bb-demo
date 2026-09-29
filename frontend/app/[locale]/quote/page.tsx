import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import QuoteBasket from "@/components/quote/QuoteBasket";
import type { Locale } from "@/i18n/routing";

// The basket is per-browser, so there is nothing here for search engines.
export async function generateMetadata({ params }: PageProps<"/[locale]/quote">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Quote" });
  return { title: t("title"), robots: { index: false } };
}

export default async function QuotePage({ params }: PageProps<"/[locale]/quote">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Quote");
  return (
    <div className="pt-16">
      <section className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">{t("title")}</h1>
        <p className="max-w-2xl text-sm md:text-base text-muted-foreground mb-10">{t("subtitle")}</p>
        <QuoteBasket />
      </section>
    </div>
  );
}
