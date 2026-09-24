import Link from "next/link";
import { Product, getType } from "@/lib/data";
import BearingIcon from "./BearingIcon";

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/catalog/${p.slug}`}
      className="group block rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 hover:border-flame/30 hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-center gap-3">
        <BearingIcon className="w-12 h-12 shrink-0 group-hover:rotate-45 transition-transform duration-500" />
        <div className="min-w-0">
          <h3 className="font-mono font-bold text-sm truncate group-hover:text-amber transition-colors">{p.designation}</h3>
          <p className="text-xs text-white/50 truncate">{getType(p.type)?.name}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-mono text-white/60">{p.d} × {p.D} × {p.B} mm</p>
    </Link>
  );
}
