import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { api, apiConfigured, apiFetch, ApiRequestError } from "./client";
import type { Product } from "@/lib/domain/product";
import type { components } from "./schema";

export type ProductSpecs = components["schemas"]["ProductSpecs"];

// Page data for server components. Every response is cached (ISR) and tagged "products", plus "product:<slug>" for a
// detail page, so POST /api/revalidate can refresh it when the catalog changes.
const HOUR = 3600;
const DAY = 86400;
const cached = (revalidate: number, ...tags: string[]) => apiFetch({ next: { revalidate, tags: ["products", ...tags] } });

// Without an API URL (a build whose env vars are missing, e.g. CI) the page is deferred to request time instead of
// failing the build, so the error shows up where the missing variable matters.
async function whenApi() {
  if (!apiConfigured) await connection();
}

function required<T>(data: T | undefined, response: Response, path: string): T {
  if (data === undefined) throw new ApiRequestError(response.status, path);
  return data;
}

export const getProduct = cache(async (slug: string): Promise<Product | undefined> => {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/products/{slug}", {
    params: { path: { slug } },
    fetch: cached(HOUR, `product:${slug}`),
  });
  if (response.status === 404) return undefined;
  return required(data, response, "/products/{slug}");
});

// SKF technical data (load ratings, speeds, weight); undefined when the product has none yet
export const getProductSpecs = cache(async (slug: string): Promise<ProductSpecs | undefined> => {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/products/{slug}/specs", {
    params: { path: { slug } },
    fetch: cached(HOUR, `product:${slug}`),
  });
  if (response.status === 404) return undefined;
  return required(data, response, "/products/{slug}/specs");
});

// same type, closest bore first
export async function relatedProducts(p: Product, limit = 4): Promise<Product[]> {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/products/{slug}/related", {
    params: { path: { slug: p.slug }, query: { limit } },
    fetch: cached(HOUR, `product:${p.slug}`),
  });
  return required(data, response, "/products/{slug}/related").data;
}

// our curated picks first
export async function productsByIndustry(slug: string, limit: number): Promise<Product[]> {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/industries/{slug}/products", {
    params: { path: { slug }, query: { limit } },
    fetch: cached(HOUR),
  });
  return required(data, response, "/industries/{slug}/products").data;
}

const productStats = cache(async () => {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/products/stats", { fetch: cached(HOUR) });
  return required(data, response, "/products/stats");
});

export const productCount = async () => (await productStats()).count;

export const productsUpdatedAt = async () => {
  const { updatedAt } = await productStats();
  return updatedAt ? new Date(updatedAt) : null;
};

// One sitemap chunk: slugs in catalog order with their last import time.
export async function productSitemapRows(offset: number, limit: number) {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/products/sitemap", {
    params: { query: { offset, limit } },
    fetch: cached(DAY),
  });
  return required(data, response, "/products/sitemap").data.map((r) => ({ slug: r.slug, updatedAt: new Date(r.updatedAt) }));
}
