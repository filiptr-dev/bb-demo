import { productsUpdatedAt } from "@/lib/products";
import { sitemapIds, sitemapUrl } from "@/lib/sitemap";

// Sitemap index: Next doesn't generate one for generateSitemaps, so list the chunks here.
export const revalidate = 86400;

export async function GET() {
  const [ids, updated] = await Promise.all([sitemapIds(), productsUpdatedAt()]);
  const entries = ids.map(({ id }) => {
    const lastmod = id !== "0" && updated ? `<lastmod>${updated.toISOString()}</lastmod>` : "";
    return `<sitemap><loc>${sitemapUrl(id)}</loc>${lastmod}</sitemap>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
