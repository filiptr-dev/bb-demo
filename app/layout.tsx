import type { Metadata } from "next";
import { Montserrat, Syne, Bebas_Neue, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bbunikoop.com.mk"),
  title: { default: "Б&Б УНИКООП – SKF лежишта и индустриски решенија", template: "%s | Б&Б УНИКООП" },
  description: "Официјален SKF дистрибутер во Македонија. Каталог на лежишта со пребарување по ознака и филтер по индустрија.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mk" className={`${montserrat.variable} ${syne.variable} ${bebas.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
