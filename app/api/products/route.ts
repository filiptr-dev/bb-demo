import { NextResponse } from "next/server";
import { searchProducts, type ProductQuery } from "@/lib/products";
import { locales, type Locale } from "@/i18n/routing";

const sorts = new Set(["designation", "type", "boreType", "seal", "d", "D", "B"]);
const num = (v: string | null) => (v === null || v === "" || isNaN(Number(v)) ? null : Number(v));

// GET /api/products?search=&locale=&type=&bore=&seal=&industry=a,b&dmin=&dmax=&Dmin=&Dmax=&Bmin=&Bmax=&sort=&dir=&page=&limit=
// Same query keys as the /catalog URL, so the client can forward its search params as-is.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const g = (k: string) => sp.get(k) ?? "";
  const locale = (locales as readonly string[]).includes(g("locale")) ? (g("locale") as Locale) : "mk";
  const sort = sorts.has(g("sort")) ? (g("sort") as ProductQuery["sort"]) : undefined;

  const result = await searchProducts({
    q: g("search").slice(0, 100),
    locale,
    type: g("type") || undefined,
    bore: g("bore") || undefined,
    seal: g("seal") || undefined,
    industries: g("industry").split(",").filter(Boolean),
    ranges: {
      d: [num(sp.get("dmin")), num(sp.get("dmax"))],
      D: [num(sp.get("Dmin")), num(sp.get("Dmax"))],
      B: [num(sp.get("Bmin")), num(sp.get("Bmax"))],
    },
    sort,
    dir: g("dir") === "desc" ? "desc" : "asc",
    page: parseInt(g("page") || "1", 10) || 1,
    limit: parseInt(g("limit") || "15", 10) || 15,
  });
  return NextResponse.json(result);
}
