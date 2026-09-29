/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryContent as Content, CategoryItem } from "@/lib/domain/category-content";
import { bannerImageClass } from "@/components/product/ProductTypeImage";

const card = "group flex flex-col h-full rounded-2xl overflow-hidden border border-foreground/[0.08] bg-card";
const hoverCard = "hover:border-brand-1/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-1/10 transition-all duration-300";

function ItemBody({ item, title, note }: { item: CategoryItem; title: string; note?: string }) {
  return (
    <>
      {/* product shots are cut out on white, so the plate stays white in every theme */}
      <div className="relative aspect-[4/3] bg-white overflow-hidden">
        {item.banner
          ? <img src={item.image} alt={title} loading="lazy" className={bannerImageClass} />
          : <img src={item.image} alt={title} loading="lazy" className="absolute inset-0 size-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]" />}
      </div>
      <div className="flex-1 px-4 py-3 border-t border-foreground/[0.06]">
        {item.code && <p className="font-display font-bold text-sm tracking-tight">{item.code}</p>}
        <p className={item.code ? "text-xs text-foreground/60 leading-snug" : "text-sm font-semibold leading-snug"}>{title}</p>
        {note && <p className="mt-1.5 text-[11px] uppercase tracking-wide text-brand-2 font-semibold">{note} →</p>}
      </div>
    </>
  );
}

export default async function CategoryContent({ content }: { content: Content }) {
  const t = await getTranslations("ProductCategoryDetail");
  const ti = await getTranslations("CategoryItems");
  const tb = await getTranslations("BearingTypes");
  const heading = "font-display font-bold text-xl md:text-2xl tracking-tight mb-5";

  return (
    <>
      {content.items && (
        <section className="mt-16">
          <h2 className={heading}>{t("productsHeading")}</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.items.map((item, i) => {
              const title = item.type ? tb(`${item.type}.name`) : ti(item.label!);
              return (
                <li key={i}>
                  {item.type ? (
                    <Link href={`/catalog?type=${item.type}`} className={`${card} ${hoverCard}`}>
                      <ItemBody item={item} title={title} note={t("inCatalog")} />
                    </Link>
                  ) : item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${card} ${hoverCard}`}>
                      <ItemBody item={item} title={title} note="SKF" />
                    </a>
                  ) : (
                    <div className={card}>
                      <ItemBody item={item} title={title} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {content.gallery && (
        <section className="mt-16">
          <h2 className={heading}>{t("galleryHeading")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.gallery.map((src) => (
              <div key={src} className="aspect-[4/3] rounded-2xl border border-foreground/[0.08] bg-white overflow-hidden">
                        <img src={src} alt="" loading="lazy" className="size-full object-contain p-3" />
              </div>
            ))}
          </div>
        </section>
      )}

      {content.resources && (
        <section className="mt-16">
          <h2 className={heading}>{t("resourcesHeading")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {content.resources.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-foreground/[0.08] bg-card px-4 py-3 text-sm hover:border-brand-1/40 transition-colors"
                >
                  {r.kind === "pdf" ? <FileText className="size-4 shrink-0 text-brand-2" /> : <ArrowUpRight className="size-4 shrink-0 text-brand-2" />}
                  <span className="flex-1">
                    {t(r.kind === "pdf" ? "resourcePdf" : "resourceLink")}
                    {r.title && <span className="text-foreground/55"> · {r.title}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
