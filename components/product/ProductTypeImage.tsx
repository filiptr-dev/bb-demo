/* eslint-disable @next/next/no-img-element */
import { getType } from "@/lib/domain/taxonomy";

// Photo for a product's bearing type on a white plate (the shots are cut out on white).
// Legacy type banners have the product on the left ~55% and an SKF logo panel on the right — show only the product.
export default function ProductTypeImage({ type, className = "" }: { type: string; className?: string }) {
  const bt = getType(type);
  return (
    <span className={`relative block bg-white overflow-hidden ${className}`}>
      {bt?.image && (bt.banner
        ? <img src={bt.image} alt="" className="absolute left-0 top-1/2 -translate-y-1/2 w-[185%] max-w-none" />
        : <img src={bt.image} alt="" className="absolute inset-0 size-full object-cover" />)}
    </span>
  );
}
