import { getPathname } from "./navigation";
import { locales, type Locale } from "./routing";

// canonical + hreflang alternates for a locale-agnostic path like "/catalog"
export function alternatesFor(path: string, locale: string) {
  return {
    canonical: getPathname({ href: path, locale: locale as Locale }),
    languages: Object.fromEntries(locales.map((l) => [l, getPathname({ href: path, locale: l })])),
  };
}
