import type { Metadata, Viewport } from "next";
import { Montserrat, Syne, Bebas_Neue, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";


const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#1a1a1a", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Б&Б УНИКООП – SKF лежишта и индустриски решенија", template: "%s | Б&Б УНИКООП" },
  description: site.description,
  applicationName: site.name,
  keywords: ["SKF", "лежишта", "SKF дистрибутер", "Македонија", "Прилеп", "Скопје", "индустриски лежишта", "bearings", "Б&Б Уникооп"],
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "mk_MK", siteName: site.name, title: "Б&Б УНИКООП – SKF лежишта и индустриски решенија", description: site.description },
  twitter: { card: "summary_large_image", title: "Б&Б УНИКООП – SKF лежишта", description: site.description },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Б&Б Уникооп",
  url: site.url,
  description: site.description,
  areaServed: "MK",
  contactPoint: site.phones.map((p) => ({ "@type": "ContactPoint", telephone: p.tel.replace("+389", "+389 "), contactType: "sales", areaServed: "MK", availableLanguage: ["mk", "en"] })),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mk" className={cn("dark antialiased", montserrat.variable, syne.variable, bebas.variable, geistMono.variable, "font-sans")}>
      <body className="min-h-screen flex flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
