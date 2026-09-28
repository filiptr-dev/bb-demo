import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { site } from "@/lib/site";
import { dim, dims } from "@/lib/domain/product";
import { getProduct, relatedProducts } from "@/server/products";
import ProductTypeImage from "@/components/product/ProductTypeImage";
import ProductCard from "@/components/product/ProductCard";

// ~15k products: render each on first visit, then serve it cached for an hour
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "ProductDetail" });
  const tt = await getTranslations({ locale, namespace: "BearingTypes" });
  const values = { designation: p.designation, brand: p.brand, d: dim(p.d), D: dim(p.D), B: dim(p.B), type: tt(`${p.type}.name`).toLowerCase() };
  const plain = p.d == null && p.D == null && p.B == null;
  return {
    title: t(plain ? "metaTitlePlain" : "metaTitle", values),
    description: t(plain ? "metaDescriptionPlain" : "metaDescription", values),
    alternates: alternatesFor(`/catalog/${p.slug}`, locale),
  };
}

export default async function ProductPage({ params }: PageProps<"/[locale]/catalog/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const p = await getProduct(slug);
  if (!p) notFound();
  const t = await getTranslations("ProductDetail");
  const tt = await getTranslations("BearingTypes");
  const ta = await getTranslations("ProductAttrs");
  const ti = await getTranslations("Industries");
  const typeName = tt(`${p.type}.name`);
  const hasDims = p.d != null || p.D != null || p.B != null;
  const description = hasDims ? `${tt(`${p.type}.blurb`)} ${ta("dimensionsLabel")} ${dims(p)} mm.` : tt(`${p.type}.blurb`);
  const related = await relatedProducts(p);

  const specs: [string, string][] = [
    [t("specs.designation"), p.designation],
    [t("specs.brand"), p.brand],
    [t("specs.type"), typeName],
    ...([[t("specs.dInner"), p.d], [t("specs.dOuter"), p.D], [t("specs.width"), p.B]] as const)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, `${v} mm`] as [string, string]),
    ...(p.seal ? [[t("specs.seal"), ta(`seal.${p.seal}`)] as [string, string]] : []),
  ];
  const url = (path: string) => site.url + getPathname({ href: path, locale: locale as Locale });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${p.brand} ${p.designation}`,
      sku: p.designation,
      mpn: p.designation,
      brand: { "@type": "Brand", name: p.brand },
      category: tt(`${p.type}.short`),
      description,
      additionalProperty: ([["Bore diameter", p.d], ["Outside diameter", p.D], ["Width", p.B]] as const)
        .filter(([, value]) => value != null)
        .map(([name, value]) => ({ "@type": "PropertyValue", name, value, unitCode: "MMT" })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: url("/") },
        { "@type": "ListItem", position: 2, name: t("breadcrumbCatalog"), item: url("/catalog") },
        { "@type": "ListItem", position: 3, name: p.designation },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-6 lg:px-10 pt-24 pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-foreground/45">
        <Link href="/" className="hover:text-brand-2">{t("breadcrumbHome")}</Link> / <Link href="/catalog" className="hover:text-brand-2">{t("breadcrumbCatalog")}</Link> / <span className="text-foreground">{p.designation}</span>
      </nav>

      <div className="mt-5 grid md:grid-cols-[300px_1fr] gap-8">
        <ProductTypeImage type={p.type} className="aspect-square rounded-2xl border border-foreground/[0.07]" />
        <div>
          <p className="text-brand-2 font-semibold text-sm">{p.brand}</p>
          <h1 className="font-mono text-3xl md:text-4xl font-extrabold">{p.designation}</h1>
          <p className="mt-1 text-lg text-foreground/60">{typeName}</p>
          <p className="mt-4 text-foreground/65 max-w-2xl">{description}</p>

          <h2 className="mt-10 font-display text-xl font-bold">{t("specsHeading")}</h2>
          <table className="mt-3 w-full max-w-2xl text-sm bg-foreground/[0.03] rounded-xl overflow-hidden border border-foreground/[0.07]">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b last:border-0 border-foreground/[0.06]">
                  <th scope="row" className="text-left font-medium text-foreground/50 px-4 py-2.5 w-1/2">{k}</th>
                  <td className="px-4 py-2.5 font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="mt-10 font-display text-xl font-bold">{t("industriesHeading")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.industries.map((s) => (
              <Link key={s} href={`/catalog?industry=${s}`} className="rounded-full bg-foreground/5 border border-foreground/10 px-4 py-1.5 text-sm hover:border-brand-1/50 hover:text-brand-2">
                {ti(`${s}.name`)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-14 font-display text-xl font-bold">{t("relatedHeading")}</h2>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.map((r) => <ProductCard key={r.slug} p={r} />)}
      </div>
    </div>
  );
}
