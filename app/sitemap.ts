import type { MetadataRoute } from "next";
import { industries, products } from "@/lib/data";

const base = "https://bbunikoop.com.mk";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/` },
    { url: `${base}/catalog` },
    ...industries.map((i) => ({ url: `${base}/industries/${i.slug}` })),
    ...products.map((p) => ({ url: `${base}/catalog/${p.slug}` })),
  ];
}
