import { bearingTypes, industries, productCategories } from "@/lib/domain/taxonomy";
import { productCount } from "@/server/products";
import { localeNames, locales } from "@/i18n/routing";
import { localeUrl } from "@/server/sitemap";
import { site } from "@/lib/site";
import en from "@/messages/en.json";

// llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI assistants and crawlers, in English.
export const revalidate = 86400;

const link = (href: string) => localeUrl(href, "en");
const item = (name: string, href: string, note?: string) => `- [${name}](${link(href)})${note ? `: ${note}` : ""}`;

export async function GET() {
  const count = (await productCount()).toLocaleString("en");
  const cats = en.ProductCategories as Record<string, { name: string; blurb: string }>;
  const inds = en.Industries as Record<string, { name: string; blurb: string }>;
  const types = en.BearingTypes as Record<string, { name: string; blurb: string }>;

  const body = `# ${en.Common.brandName}

> ${en.Common.brandName} is the official SKF distributor for North Macedonia, with offices in Prilep and Skopje and 35 years of experience. It supplies industry with SKF bearings, housings, seals, power transmission (belts, chains, pulleys), lubricants and lubrication systems, and maintenance and condition-monitoring tools. The website has a searchable catalog of ${count} SKF products with dimensions.

- Languages: ${locales.map((l) => `${localeNames[l]} (${l === "mk" ? `${site.url}/` : `${site.url}/${l}/`})`).join(", ")}. Macedonian is the default and has no URL prefix.
- Phone support 24/7: ${site.phones.map((p) => `${en.Common.cities[p.city]} ${p.label}`).join(", ")}. Office hours: ${en.Common.hours}.
- Prices and stock are not published; customers request a quote through the contact page or by phone.

## Catalog

- [Bearing catalog](${link("/catalog")}): search by designation (e.g. 6205) or by dimensions, filter by type, bore, seal and industry.
- Search URL: ${link("/catalog")}?search=<designation or d x D x B>, for example ${link("/catalog")}?search=6205 or ${link("/catalog")}?search=25x52x15
- Product page URL: ${link("/catalog")}/<designation-slug>, for example ${link("/catalog/6205")}. Each page lists the bore diameter d, outside diameter D and width B in mm, the bearing type, seal and bore type, and has Product JSON-LD.
- Type filter: ${link("/catalog")}?type=<type-slug>
- Dimension ranges (mm): ${link("/catalog")}?dmin=&dmax=&Dmin=&Dmax=&Bmin=&Bmax=
- [Designation decoder](${link("/decoder")}): ${en.Metadata.decoder.description}
- [Bearing size finder](${link("/size-finder")}): ${en.Metadata.sizeFinder.description}

### Bearing types

${bearingTypes.map((t) => `- ${types[t.slug]?.name ?? t.slug} (type=${t.slug})${types[t.slug]?.blurb ? `: ${types[t.slug].blurb}` : ""}`).join("\n")}

## Original SKF offer

${productCategories.map((c) => item(cats[c.slug].name, `/products/${c.slug}`, cats[c.slug].blurb)).join("\n")}

## Industries

${industries.map((i) => item(inds[i.slug].name, `/industries/${i.slug}`, inds[i.slug].blurb)).join("\n")}

## Company

- [Home](${link("/")})
- [Contact](${link("/contact")}): ${en.Metadata.contact.description}

## Optional

- [Sitemap](${site.url}/sitemap.xml)
- [Privacy policy](${link("/privacy")})
- [Terms of use](${link("/terms")})
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
