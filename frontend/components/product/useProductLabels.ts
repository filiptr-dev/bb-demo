import { useTranslations } from "next-intl";
import type { BoreCode, Product, SealCode } from "@/lib/domain/product";

// Localised names for a product's codes; "–" when the product has none (housings, nuts, …).
export function useProductLabels() {
  const tt = useTranslations("BearingTypes");
  const ta = useTranslations("ProductAttrs");
  return {
    typeName: (p: Pick<Product, "type">) => tt(`${p.type}.name`),
    sealName: (c: SealCode | null) => (c ? ta(`seal.${c}`) : "–"),
    boreName: (c: BoreCode | null) => (c ? ta(`boreType.${c}`) : "–"),
  };
}
