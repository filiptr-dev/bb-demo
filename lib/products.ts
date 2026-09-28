import { cache } from "react";
import type { Fragment } from "postgres";
import { sql } from "./db";
import { bearingTypes, boreCodes, industries, sealCodes, type Product } from "./data";
import { normalize, parseDims } from "./search";
import type { Locale } from "@/i18n/routing";
import mk from "@/messages/mk.json";
import en from "@/messages/en.json";
import sq from "@/messages/sq.json";

const messages = { mk, en, sq } as const;

const columns = sql`slug, designation, brand, type, classification, d, outer_d as "D", width as "B", seal, bore_type as "boreType", industries`;
const natural = sql`designation collate natural_sort`;
const and = (conds: Fragment[]) => conds.reduce((a, c) => sql`${a} and ${c}`, sql`true`);

// Which type/seal/bore/industry codes a free word points at, in this locale's wording (slugs keep English working everywhere).
function wordMatches(locale: Locale, word: string) {
  const m = messages[locale] ?? messages.en;
  const has = (...s: string[]) => s.some((x) => x.toLowerCase().includes(word));
  return {
    types: bearingTypes.map((t) => t.slug).filter((s) => {
      const bt = (m.BearingTypes as Record<string, { name: string; short: string }>)[s];
      return has(s, bt?.name ?? "", bt?.short ?? "");
    }),
    seals: sealCodes.filter((c) => has(c, (m.ProductAttrs.seal as Record<string, string>)[c] ?? "")),
    bores: boreCodes.filter((c) => has(c, m.ProductAttrs.boreType[c])),
    industries: industries.map((i) => i.slug).filter((s) => has(s, (m.Industries as Record<string, { name: string }>)[s]?.name ?? "")),
  };
}

// Mirrors the old in-memory ranking (lib/search.ts score): exact designation > prefix > contains > dimension > word match.
function scoreFor(q: string, locale: Locale): { score: Fragment; match: Fragment } {
  const dimsQ = parseDims(q);
  if (dimsQ) {
    const [d, D, B] = dimsQ;
    const m = and([sql`d = ${d}`, sql`outer_d = ${D}`, ...(B != null ? [sql`width = ${B}`] : [])]);
    return { score: sql`50`, match: m };
  }
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { score: sql`1`, match: sql`true` };

  const nq = normalize(q);
  const parts: Fragment[] = [];
  if (nq) {
    parts.push(sql`case when search_key = ${nq} then 100
      when search_key like ${nq + "%"} then 80 - least(length(search_key) - ${nq.length}, 20)
      when search_key like ${"%" + nq + "%"} then 60 else 0 end`);
    if (/^\d+(?:[.,]\d+)?$/.test(q.trim())) {
      const n = parseFloat(q.replace(",", "."));
      parts.push(sql`case when d = ${n} then 40 when outer_d = ${n} or width = ${n} then 30 else 0 end`);
    }
  }
  const wordConds = words.map((w) => {
    const m = wordMatches(locale, w);
    return sql`(brand ilike ${w} or classification ilike ${"%" + w + "%"} or type = any(${m.types})
      or seal = any(${m.seals}) or bore_type = any(${m.bores}) or industries && ${m.industries}::text[])`;
  });
  parts.push(sql`case when ${and(wordConds)} then 10 else 0 end`);
  const score = parts.reduce((a, p) => sql`greatest(${a}, ${p})`);
  return { score, match: sql`true` };
}

export type ProductQuery = {
  q?: string;
  locale: Locale;
  type?: string;
  bore?: string;
  seal?: string;
  industries?: string[];
  ranges?: Partial<Record<"d" | "D" | "B", [number | null, number | null]>>;
  sort?: "designation" | "type" | "boreType" | "seal" | "d" | "D" | "B";
  dir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

const sortCols = { designation: natural, type: sql`type`, boreType: sql`bore_type`, seal: sql`seal`, d: sql`d`, D: sql`outer_d`, B: sql`width` };
const rangeCols = { d: sql`d`, D: sql`outer_d`, B: sql`width` };

export async function searchProducts(o: ProductQuery): Promise<{ rows: Product[]; total: number; page: number }> {
  const { score, match } = scoreFor(o.q?.trim() ?? "", o.locale);
  const where: Fragment[] = [match];
  if (o.type) where.push(sql`type = ${o.type}`);
  if (o.bore) where.push(sql`bore_type = ${o.bore}`);
  if (o.seal) where.push(sql`seal = ${o.seal}`);
  if (o.industries?.length) where.push(sql`industries && ${o.industries}::text[]`);
  for (const [k, [lo, hi] = [null, null]] of Object.entries(o.ranges ?? {}) as [keyof typeof rangeCols, [number | null, number | null]][]) {
    if (lo != null) where.push(sql`${rangeCols[k]} >= ${lo}`);
    if (hi != null) where.push(sql`${rangeCols[k]} <= ${hi}`);
  }
  const dir = o.dir === "desc" ? sql`desc` : sql`asc`;
  const order = o.sort ? sql`${sortCols[o.sort]} ${dir} nulls last, ${natural}` : sql`score desc, ${natural}`;
  const limit = Math.min(o.limit ?? 15, 100);
  const offset = (Math.max(1, o.page ?? 1) - 1) * limit;

  const rows = await sql<(Product & { total: number })[]>`
    select ${columns}, count(*) over ()::int as total
    from (select *, ${score} as score from products where ${and(where)}) r
    where score > 0 order by ${order} limit ${limit} offset ${offset}`;
  if (!rows.length && offset > 0) {
    // page is past the end (filters narrowed the results): serve the last page instead
    const { total } = await searchProducts({ ...o, page: 1, limit: 1 });
    return total ? searchProducts({ ...o, page: Math.ceil(total / limit) }) : { rows: [], total: 0, page: 1 };
  }
  return { rows, total: rows[0]?.total ?? 0, page: offset / limit + 1 };
}

export const getProduct = cache(async (slug: string) => {
  const [p] = await sql<Product[]>`select ${columns} from products where slug = ${slug}`;
  return p;
});

// same type, closest bore first
export const relatedProducts = (p: Product, limit = 4) => sql<Product[]>`
  select ${columns} from products where type = ${p.type} and slug <> ${p.slug}
  order by abs(coalesce(d, 0) - ${p.d ?? 0}), ${natural} limit ${limit}`;

// our curated picks first
export const productsByIndustry = (slug: string, limit: number) => sql<Product[]>`
  select ${columns} from products where ${slug} = any(industries)
  order by source = 'bearingworld', ${natural} limit ${limit}`;

export const productCount = cache(async () => (await sql<{ n: number }[]>`select count(*)::int as n from products`)[0].n);

// One sitemap chunk: slugs in catalog order with their last import time.
export const productSitemapRows = (offset: number, limit: number) =>
  sql<{ slug: string; updated_at: Date }[]>`select slug, updated_at from products order by ${natural} offset ${offset} limit ${limit}`;
export const productsUpdatedAt = cache(async () => (await sql<{ t: Date | null }[]>`select max(updated_at) as t from products`)[0].t);
