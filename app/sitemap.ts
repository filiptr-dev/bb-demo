import type { MetadataRoute } from "next";
import { industries, products, productCategories } from "@/lib/data";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

const paths = [
  "/",
  "/catalog",
  "/contact",
  "/privacy",
  "/terms",
  ...industries.map((i) => `/industries/${i.slug}`),
  ...productCategories.map((c) => `/products/${c.slug}`),
  ...products.map((p) => `/catalog/${p.slug}`),
];

// one entry per path (default locale), with hreflang alternates for every locale
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (href: string, locale: (typeof routing.locales)[number]) => site.url + getPathname({ href, locale });
  return paths.map((href) => ({
    url: url(href, routing.defaultLocale),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(href, l)])) },
  }));
}
