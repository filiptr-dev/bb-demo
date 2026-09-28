import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { site } from "@/lib/site";
import { products, getProduct } from "@/lib/data";
import BearingIcon from "@/components/BearingIcon";
import ProductCard from "@/components/ProductCard";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "ProductDetail" });
  const tt = await getTranslations({ locale, namespace: "BearingTypes" });
  const values = { designation: p.designation, brand: p.brand, d: p.d, D: p.D, B: p.B, type: tt(`${p.type}.name`).toLowerCase() };
  return {
    title: t("metaTitle", values),
    description: t("metaDescription", values),
    alternates: alternatesFor(`/catalog/${p.slug}`, locale),
  };
}

export default async function ProductPage({ params }: PageProps<"/[locale]/catalog/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const p = getProduct(slug);
  if (!p) notFound();
  const t = await getTranslations("ProductDetail");
  const tt = await getTranslations("BearingTypes");
  const ta = await getTranslations("ProductAttrs");
  const ti = await getTranslations("Industries");
  const typeName = tt(`${p.type}.name`);
  const description = `${tt(`${p.type}.blurb`)} ${ta("dimensionsLabel")} ${p.d} × ${p.D} × ${p.B} mm.`;
  const related = products.filter((x) => x.slug !== p.slug && (x.type === p.type || x.d === p.d)).slice(0, 4);

  const specs: [string, string][] = [
    [t("specs.designation"), p.designation],
    [t("specs.brand"), p.brand],
    [t("specs.type"), typeName],
    [t("specs.dInner"), `${p.d} mm`],
    [t("specs.dOuter"), `${p.D} mm`],
    [t("specs.width"), `${p.B} mm`],
    [t("specs.seal"), ta(`seal.${p.seal}`)],
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
      additionalProperty: [
        { "@type": "PropertyValue", name: "Bore diameter", value: p.d, unitCode: "MMT" },
        { "@type": "PropertyValue", name: "Outside diameter", value: p.D, unitCode: "MMT" },
        { "@type": "PropertyValue", name: "Width", value: p.B, unitCode: "MMT" },
      ],
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
        <div className="rounded-2xl bg-foreground/[0.03] border border-foreground/[0.07] p-8 flex items-center justify-center">
          <BearingIcon className="w-56 h-56" spin />
        </div>
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
