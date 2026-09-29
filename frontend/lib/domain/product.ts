import type { components } from "@/lib/api/schema";

export const sealCodes = ["open", "shields", "both", "one-side", "other"] as const;
export const boreCodes = ["cylindrical", "tapered"] as const;
export type SealCode = (typeof sealCodes)[number];
export type BoreCode = (typeof boreCodes)[number];

// Catalog rows come from the API (lib/api/products.ts); the type is generated from its OpenAPI contract.
// Non-bearing items (housings, nuts, seals, …) have no seal/bore type, and some have no bore diameter.
export type Product = components["schemas"]["Product"];

export const dim = (v: number | null) => (v == null ? "–" : String(v));
export const dims = (p: Pick<Product, "d" | "D" | "B">) => `${dim(p.d)} × ${dim(p.D)} × ${dim(p.B)}`;
