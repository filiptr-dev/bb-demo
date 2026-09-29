import { api, ApiRequestError } from "./client";
import { MAX_LIMIT, PAGE_SIZE, parseProductQuery, type ProductQuery } from "@/lib/catalog-query";
import type { Product } from "@/lib/domain/product";

export type ProductPage = { rows: Product[]; total: number; page: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

// ProductQuery (catalog URL keys) → GET /api/v1/products query. Only set values are sent, so the API's validation
// never sees a half-typed URL value.
export function toApiQuery(q: ProductQuery) {
  const range = (dim: "d" | "D" | "B", i: 0 | 1) => q.ranges?.[dim]?.[i] ?? undefined;
  return {
    search: q.q?.trim() || undefined,
    locale: q.locale,
    type: q.type,
    bore: q.bore,
    seal: q.seal,
    industry: q.industries?.length ? q.industries : undefined,
    dmin: range("d", 0), dmax: range("d", 1),
    Dmin: range("D", 0), Dmax: range("D", 1),
    Bmin: range("B", 0), Bmax: range("B", 1),
    sort: q.sort,
    dir: q.sort ? q.dir : undefined,
    page: Math.max(1, q.page ?? 1),
    perPage: clamp(q.limit ?? PAGE_SIZE, 1, MAX_LIMIT),
  };
}

export async function searchProducts(q: ProductQuery, signal?: AbortSignal): Promise<ProductPage> {
  const { data, response } = await api.GET("/api/v1/products", { params: { query: toApiQuery(q) }, signal });
  if (!data) throw new ApiRequestError(response.status, "/products");
  return { rows: data.data, total: data.meta.total, page: data.meta.page };
}

// Browser search (catalog, header search, size finder): `params` uses the catalog URL keys from lib/catalog-query.ts.
export const fetchProducts = (params: URLSearchParams | Record<string, string>, signal?: AbortSignal) =>
  searchProducts(parseProductQuery(new URLSearchParams(params)), signal);
