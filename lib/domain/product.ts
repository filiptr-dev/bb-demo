export const sealCodes = ["open", "shields", "both", "one-side", "other"] as const;
export const boreCodes = ["cylindrical", "tapered"] as const;
export type SealCode = (typeof sealCodes)[number];
export type BoreCode = (typeof boreCodes)[number];

// Rows live in the Postgres `products` table (scripts/schema.sql); query them through server/products.ts.
// Non-bearing items (housings, nuts, seals, …) have no seal/bore type, and some have no bore diameter.
export type Product = {
  slug: string;
  designation: string;
  brand: string;
  type: string;
  classification: string | null;
  d: number | null;
  D: number | null;
  B: number | null;
  seal: SealCode | null;
  boreType: BoreCode | null;
  industries: string[];
};

export const dim = (v: number | null) => (v == null ? "–" : String(v));
export const dims = (p: Pick<Product, "d" | "D" | "B">) => `${dim(p.d)} × ${dim(p.D)} × ${dim(p.B)}`;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
