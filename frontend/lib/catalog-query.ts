import { locales, routing, type Locale } from "@/i18n/routing";

// The /catalog URL keys: search, type, bore, seal, industry=a,b, dmin/dmax, Dmin/Dmax, Bmin/Bmax, sort, dir, page
// (+ locale, limit for searches). lib/api/search.ts turns a parsed query into the API's GET /api/v1/products query.

export const sortKeys = ["designation", "type", "boreType", "seal", "d", "D", "B"] as const;
export type SortKey = (typeof sortKeys)[number];
export type Dim = "d" | "D" | "B";

export const PAGE_SIZE = 15;
export const MAX_LIMIT = 100;

export type ProductQuery = {
  q?: string;
  locale: Locale;
  type?: string;
  bore?: string;
  seal?: string;
  industries?: string[];
  ranges?: Partial<Record<Dim, [number | null, number | null]>>;
  sort?: SortKey;
  dir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

const num = (v: string | null) => (v === null || v === "" || isNaN(Number(v)) ? null : Number(v));
const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
const isSort = (v: string): v is SortKey => (sortKeys as readonly string[]).includes(v);

export function parseProductQuery(sp: URLSearchParams): ProductQuery {
  const g = (k: string) => sp.get(k) ?? "";
  return {
    q: g("search").slice(0, 100),
    locale: isLocale(g("locale")) ? g("locale") as Locale : routing.defaultLocale,
    type: g("type") || undefined,
    bore: g("bore") || undefined,
    seal: g("seal") || undefined,
    industries: g("industry").split(",").filter(Boolean),
    ranges: {
      d: [num(sp.get("dmin")), num(sp.get("dmax"))],
      D: [num(sp.get("Dmin")), num(sp.get("Dmax"))],
      B: [num(sp.get("Bmin")), num(sp.get("Bmax"))],
    },
    sort: isSort(g("sort")) ? g("sort") as SortKey : undefined,
    dir: g("dir") === "desc" ? "desc" : "asc",
    page: parseInt(g("page") || "1", 10) || 1,
    limit: Math.min(parseInt(g("limit") || String(PAGE_SIZE), 10) || PAGE_SIZE, MAX_LIMIT),
  };
}
