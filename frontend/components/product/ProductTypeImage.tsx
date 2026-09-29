/* eslint-disable @next/next/no-img-element */
import { getType } from "@/lib/domain/taxonomy";
import BearingIcon from "@/components/brand/BearingIcon";

// Photo for a product's bearing type on a white plate (the shots are cut out on white).
// Types without a photo (e.g. toroidal) fall back to the drawn bearing.
// Legacy type banners have the product on the left and a blue SKF panel behind a diagonal
// (same curve on all 12: ~63% of the width at the top, a step from ~50% to ~46% just below the middle, ~34% at the bottom).
// Clip ~1.5% inside it so only the product shows.
export const bannerImageClass =
  "absolute left-0 top-1/2 -translate-y-1/2 w-[165%] max-w-none [clip-path:polygon(0_0,61.5%_0,60%_20%,57%_30%,54.5%_40%,52%_50%,49.5%_57%,44%_60%,41%_70%,38%_80%,35%_90%,32.5%_100%,0_100%)]";

export default function ProductTypeImage({ type, className = "" }: { type: string; className?: string }) {
  const bt = getType(type);
  return (
    <span className={`relative block bg-white overflow-hidden ${className}`}>
      {!bt?.image
        ? <BearingIcon className="absolute inset-[15%] size-[70%]" />
        : bt.banner
          ? <img src={bt.image} alt="" className={bannerImageClass} />
          : <img src={bt.image} alt="" className="absolute inset-0 size-full object-cover" />}
    </span>
  );
}
