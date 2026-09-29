import "server-only";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { productCount } from "@/lib/api/products";
import { site } from "@/lib/site";

// Products per sitemap file. Each URL carries hreflang links for every locale, so 5,000 keeps a file around 2 MB.
export const productChunk = 5000;

// Used when the product count can't be read (e.g. a build without database access): enough ids for 50,000
// products. Chunks past the real data render as empty (valid) sitemaps until the next revalidation.
const fallbackChunks = 10;

// id "0" holds the static pages, "1".."n" the product chunks
export async function sitemapIds() {
  let chunks = fallbackChunks;
  try {
    chunks = Math.ceil((await productCount()) / productChunk);
  } catch (e) {
    console.warn(`sitemap: product count unavailable, assuming ${fallbackChunks} chunks`, e instanceof Error ? e.message : e);
  }
  return Array.from({ length: chunks + 1 }, (_, i) => ({ id: String(i) }));
}

export const sitemapUrl = (id: string) => `${site.url}/sitemaps/sitemap/${id}.xml`;

export const localeUrl = (href: string, locale: Locale) => site.url + getPathname({ href, locale });

// one entry per path (default locale), with hreflang alternates for every locale
export const withAlternates = (href: string) => ({
  url: localeUrl(href, routing.defaultLocale),
  alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, localeUrl(href, l)])) },
});
