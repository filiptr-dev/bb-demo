import { NextResponse } from "next/server";
import { searchProducts } from "@/server/products";
import { parseProductQuery } from "@/lib/catalog-query";

// GET /api/products — query keys documented in lib/catalog-query.ts
export async function GET(req: Request) {
  return NextResponse.json(await searchProducts(parseProductQuery(new URL(req.url).searchParams)));
}
