import { Link } from "@/i18n/navigation";
import type { ProductCategory } from "@/lib/domain/taxonomy";

// One "Original SKF offer" tile: product photo on a white plate + name. Used on the homepage grid and category pages.
export default function CategoryCard({ category, name, num }: { category: ProductCategory; name: string; num?: number }) {
  return (
    <Link
      href={`/products/${category.slug}`}
      className="group flex flex-col h-full rounded-2xl overflow-hidden border border-foreground/[0.08] bg-card hover:border-brand-1/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-1/10 transition-all duration-300"
    >
      {/* product shots are cut out on white, so the plate stays white in every theme */}
      <div className="relative aspect-[4/3] bg-white overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.image}
          alt={name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-3 md:p-4 transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {num !== undefined && (
          <span className="absolute top-2.5 left-3 font-numbers text-base tracking-wide text-neutral-400">{String(num).padStart(2, "0")}</span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5 border-t border-foreground/[0.06]">
        <span className="text-xs md:text-sm font-semibold leading-snug group-hover:text-brand-2 transition-colors">{name}</span>
        <span
          aria-hidden
          className="shrink-0 grid place-items-center w-7 h-7 rounded-full border border-foreground/15 text-xs text-foreground/50 group-hover:bg-brand-1 group-hover:border-brand-1 group-hover:text-white transition-colors"
        >
          →
        </span>
      </div>
    </Link>
  );
}
