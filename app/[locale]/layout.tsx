import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat, Noto_Sans, Syne, Bebas_Neue, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThemeVariantToggle from "@/components/layout/ThemeVariantToggle";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { locales, routing, type Locale } from "@/i18n/routing";
import { alternatesFor } from "@/i18n/metadata";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "latin-ext", "cyrillic"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin", "latin-ext", "greek"] });
// Montserrat has no Greek glyphs; the browser only downloads this when Greek text is on the page.
const notoSans = Noto_Sans({ variable: "--font-noto", subsets: ["greek"], preload: false });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin", "latin-ext"], weight: "400" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

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
  contactPoint: site.phones.map((p) => ({ "@type": "ContactPoint", telephone: p.tel.replace("+389", "+389 "), contactType: "sales", areaServed: "MK", availableLanguage: [...locales] })),
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale as Locale);

  return (
    // data-theme="client" is the default (the client's own SKF-blue palette); ThemeVariantToggle's effect
    // removes it if the visitor has explicitly opted into the "demo" AI-design colors (localStorage). This is a
    // JSX prop (not an inline <script>) so it survives the full <html>/<body> remount a locale switch triggers
    // — the [locale] layout owns html/body and Next tears that subtree down when its own dynamic segment
    // changes, and React doesn't re-execute dangerouslySetInnerHTML <script> tags on such a client remount,
    // which is why the old script-based theme restore used to silently lose the choice on language switch.
    <html lang={locale} data-theme="client" suppressHydrationWarning className={cn("dark antialiased", montserrat.variable, notoSans.variable, syne.variable, bebas.variable, geistMono.variable, "font-sans")}>
      <body className="min-h-screen flex flex-col font-sans">
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
