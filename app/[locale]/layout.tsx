import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat, Syne, Bebas_Neue, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemeVariantToggle from "@/components/ThemeVariantToggle";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { routing, type Locale } from "@/i18n/routing";
import { alternatesFor } from "@/i18n/metadata";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#1a1a1a", colorScheme: "dark" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.site" });
  const title = t("title");
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: t("titleTemplate") },
    description: t("description"),
    applicationName: site.name,
    keywords: ["SKF", "лежишта", "SKF дистрибутер", "Македонија", "Прилеп", "Скопје", "индустриски лежишта", "bearings", "Б&Б Уникооп"],
    authors: [{ name: site.name }],
    alternates: alternatesFor("/", locale),
    robots: { index: true, follow: true },
    openGraph: { type: "website", locale, siteName: site.name, title, description: t("description") },
    twitter: { card: "summary_large_image", title, description: t("description") },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Б&Б Уникооп",
  url: site.url,
  description: site.description,
  areaServed: "MK",
  contactPoint: site.phones.map((p) => ({ "@type": "ContactPoint", telephone: p.tel.replace("+389", "+389 "), contactType: "sales", areaServed: "MK", availableLanguage: ["mk", "en", "sq"] })),
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale} suppressHydrationWarning className={cn("dark antialiased", montserrat.variable, syne.variable, bebas.variable, geistMono.variable, "font-sans")}>
      <body className="min-h-screen flex flex-col font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme-variant')==='client'){document.documentElement.dataset.theme='client'}}catch(e){}`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ThemeVariantToggle />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
