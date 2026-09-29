// Writes the words product search understands in each language (bearing types, seals, bore types, industries) to
// backend/app/modules/products/search_vocabulary.json. The API matches free-text search words against it, so a
// search for "конусни" or "Rillenkugellager" finds the right type. Re-run after changing those names in messages/:
//
//   npm run search-vocabulary
//
// CI (frontend.yml) re-runs it and fails if the committed file is out of date.
import { readFileSync, writeFileSync } from "node:fs";
import { boreCodes, sealCodes } from "../lib/domain/product.ts";
import { bearingTypes, industries } from "../lib/domain/taxonomy.ts";
import { locales, routing } from "../i18n/routing.ts";

type Named = Record<string, { name: string; short?: string }>;

// Each code maps to the lower-cased strings a search word may be part of: its slug plus its names.
const terms = (code: string, ...names: (string | undefined)[]) => [code, ...names.filter((n): n is string => !!n)].map((s) => s.toLowerCase());

const vocabulary = Object.fromEntries(
  locales.map((locale) => {
    const m = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
    const types = m.BearingTypes as Named;
    const inds = m.Industries as Named;
    return [locale, {
      types: Object.fromEntries(bearingTypes.map(({ slug }) => [slug, terms(slug, types[slug]?.name, types[slug]?.short)])),
      seals: Object.fromEntries(sealCodes.map((c) => [c, terms(c, m.ProductAttrs.seal[c])])),
      bores: Object.fromEntries(boreCodes.map((c) => [c, terms(c, m.ProductAttrs.boreType[c])])),
      industries: Object.fromEntries(industries.map(({ slug }) => [slug, terms(slug, inds[slug]?.name)])),
    }];
  }),
);

const out = new URL("../../backend/app/modules/products/search_vocabulary.json", import.meta.url);
writeFileSync(out, JSON.stringify({ defaultLocale: routing.defaultLocale, locales: vocabulary }, null, 2) + "\n");
console.log(`wrote ${out.pathname} (${locales.length} locales)`);
