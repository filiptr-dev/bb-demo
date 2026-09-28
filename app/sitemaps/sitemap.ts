import type { MetadataRoute } from "next";
import { industries, productCategories } from "@/lib/domain/taxonomy";
import { productSitemapRows } from "@/server/products";
import { productChunk, sitemapIds, withAlternates } from "@/server/sitemap";

const pages = [
  "/",
  "/catalog",
  "/contact",
  "/privacy",
  "/terms",
  ...industries.map((i) => `/industries/${i.slug}`),
  ...productCategories.map((c) => `/products/${c.slug}`),
];

// Served as /sitemaps/sitemap/<id>.xml and listed by the index at /sitemap.xml.
export const revalidate = 86400;

export const generateSitemaps = sitemapIds;

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  if (id === 0) return pages.map(withAlternates);
  const rows = await productSitemapRows((id - 1) * productChunk, productChunk);
  return rows.map((r) => ({ ...withAlternates(`/catalog/${r.slug}`), lastModified: r.updated_at }));
}
