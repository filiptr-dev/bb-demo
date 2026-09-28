import { NextResponse } from "next/server";
import { searchProducts } from "@/server/products";
import { parseProductQuery } from "@/lib/catalog-query";

// GET /api/products — query keys documented in lib/catalog-query.ts
export async function GET(req: Request) {
  try {
    return NextResponse.json(await searchProducts(parseProductQuery(new URL(req.url).searchParams)));
  } catch (e) {
    console.error("GET /api/products failed", e);
    return NextResponse.json(
      { error: "Product search is temporarily unavailable.", code: "unavailable" },
      { status: 503, headers: { "Retry-After": "10" } },
    );
  }
}
