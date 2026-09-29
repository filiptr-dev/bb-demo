import type { Product } from "@/lib/domain/product";

export type ProductPage = { rows: Product[]; total: number; page: number };

// Client side of GET /api/products; `params` uses the keys from lib/catalog-query.ts.
export async function fetchProducts(params: URLSearchParams | Record<string, string>, signal?: AbortSignal): Promise<ProductPage> {
  const r = await fetch(`/api/products?${new URLSearchParams(params)}`, { signal });
  if (!r.ok) throw new Error(`products ${r.status}`);
  return r.json();
}
