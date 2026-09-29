import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { dims, type Product } from "@/lib/domain/product";
import ProductTypeImage from "@/components/product/ProductTypeImage";

export default function ProductCard({ p }: { p: Product }) {
  const tt = useTranslations("BearingTypes");
  return (
    <Link
      href={`/catalog/${p.slug}`}
      className="group block rounded-xl bg-foreground/[0.03] border border-foreground/[0.07] p-4 hover:border-brand-1/30 hover:bg-foreground/[0.05] transition-all"
    >
      <div className="flex items-center gap-3">
        <ProductTypeImage type={p.type} className="w-14 h-12 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <h3 className="font-mono font-bold text-sm truncate group-hover:text-brand-2 transition-colors">{p.designation}</h3>
          <p className="text-xs text-foreground/50 truncate">{tt(`${p.type}.name`)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-mono text-foreground/60">{dims(p)} mm</p>
    </Link>
  );
}
