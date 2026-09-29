import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// POST /api/revalidate { "tags": ["products", "product:6205"] } with header X-Revalidate-Secret.
// Called by the API when catalog data changes; the tagged pages refresh on their next visit.
const secret = process.env.REVALIDATE_SECRET ?? "";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req: Request) {
  if (!secret) return Response.json({ error: "Revalidation is not configured.", code: "not_configured" }, { status: 503 });
  if (!same(req.headers.get("x-revalidate-secret") ?? "", secret))
    return Response.json({ error: "Wrong or missing secret.", code: "unauthorized" }, { status: 401 });

  const body: unknown = await req.json().catch(() => null);
  const tags = (body as { tags?: unknown } | null)?.tags;
  if (!Array.isArray(tags) || !tags.length || !tags.every((t) => typeof t === "string" && t.length > 0 && t.length <= 256))
    return Response.json({ error: "Expected { tags: string[] }.", code: "invalid_body" }, { status: 422 });

  for (const tag of tags) revalidateTag(tag, "max");
  return Response.json({ revalidated: tags });
}
