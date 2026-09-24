import type { MetadataRoute } from "next";
import { industries, products } from "@/lib/data";

const base = "https://bbunikoop.com.mk";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/` },
    { url: `${base}/catalog` },
    { url: `${base}/contact` },
    { url: `${base}/privacy` },
    { url: `${base}/terms` },
    ...industries.map((i) => ({ url: `${base}/industries/${i.slug}` })),
    ...products.map((p) => ({ url: `${base}/catalog/${p.slug}` })),
  ];
}
