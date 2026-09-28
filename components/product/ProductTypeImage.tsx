/* eslint-disable @next/next/no-img-element */
import { getType } from "@/lib/domain/taxonomy";
import BearingIcon from "@/components/brand/BearingIcon";

// Photo for a product's bearing type on a white plate (the shots are cut out on white).
// Types without a photo (e.g. toroidal) fall back to the drawn bearing.
// Legacy type banners have the product on the left and a blue SKF panel behind a diagonal
// (same curve on all 12: ~63% of the width at the top, ~34% at the bottom). Clip just inside it so only the product shows.
export default function ProductTypeImage({ type, className = "" }: { type: string; className?: string }) {
  const bt = getType(type);
  return (
    <span className={`relative block bg-white overflow-hidden ${className}`}>
      {!bt?.image
        ? <BearingIcon className="absolute inset-[15%] size-[70%]" />
        : bt.banner
          ? <img src={bt.image} alt="" className="absolute left-0 top-1/2 -translate-y-1/2 w-[165%] max-w-none [clip-path:polygon(0_0,61.5%_0,60.5%_20%,55.5%_40%,49%_60%,38%_80%,32.5%_100%,0_100%)]" />
          : <img src={bt.image} alt="" className="absolute inset-0 size-full object-cover" />}
    </span>
  );
}
