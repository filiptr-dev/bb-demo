import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import ProductsOverview from "@/components/home/ProductsOverview";
import SkfOffer from "@/components/home/SkfOffer";
import Industries from "@/components/home/Industries";
import SkfBrand from "@/components/home/SkfBrand";
import WhyUs from "@/components/home/WhyUs";
import Cta from "@/components/home/Cta";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <Hero />
      <About />
      <ProductsOverview />
      <SkfOffer />
      <Industries />
      <SkfBrand />
      <WhyUs />
      <Cta />
    </>
  );
}
