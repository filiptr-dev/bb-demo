import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products, getProduct, getType, getIndustry } from "@/lib/data";
import BearingIcon from "@/components/BearingIcon";
import ProductCard from "@/components/ProductCard";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const t = getType(p.type)!;
  return {
    title: `${p.designation} ${p.brand} лежиште – ${p.d}×${p.D}×${p.B} mm`,
    description: `${p.brand} ${p.designation}: ${t.name.toLowerCase()}, внатрешен ø ${p.d} mm, надворешен ø ${p.D} mm, ширина ${p.B} mm. Достапно кај Б&Б Уникооп.`,
    alternates: { canonical: `/catalog/${p.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/catalog/[slug]">) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const t = getType(p.type)!;
  const related = products.filter((x) => x.slug !== p.slug && (x.type === p.type || x.d === p.d)).slice(0, 4);

  const specs: [string, string][] = [
    ["Ознака", p.designation],
    ["Бренд", p.brand],
    ["Тип", t.name],
    ["Внатрешен дијаметар (d)", `${p.d} mm`],
    ["Надворешен дијаметар (D)", `${p.D} mm`],
    ["Ширина (B)", `${p.B} mm`],
    ["Заптивање", p.seal],
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${p.brand} ${p.designation}`,
      sku: p.designation,
      mpn: p.designation,
      brand: { "@type": "Brand", name: p.brand },
      category: t.short,
      description: p.description,
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
        { "@type": "ListItem", position: 1, name: "Почетна", item: "https://bbunikoop.com.mk/" },
        { "@type": "ListItem", position: 2, name: "Каталог", item: "https://bbunikoop.com.mk/catalog" },
        { "@type": "ListItem", position: 3, name: p.designation },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-6 lg:px-10 pt-24 pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-white/45">
        <Link href="/" className="hover:text-brand-2">Почетна</Link> / <Link href="/catalog" className="hover:text-brand-2">Каталог</Link> / <span className="text-white">{p.designation}</span>
      </nav>

      <div className="mt-5 grid md:grid-cols-[300px_1fr] gap-8">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-8 flex items-center justify-center">
          <BearingIcon className="w-56 h-56" spin />
        </div>
        <div>
          <p className="text-brand-2 font-semibold text-sm">{p.brand}</p>
          <h1 className="font-mono text-3xl md:text-4xl font-extrabold">{p.designation}</h1>
          <p className="mt-1 text-lg text-white/60">{t.name}</p>
          <p className="mt-4 text-white/65 max-w-2xl">{p.description}</p>


          <h2 className="mt-10 font-display text-xl font-bold">Технички карактеристики</h2>
          <table className="mt-3 w-full max-w-2xl text-sm bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.07]">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b last:border-0 border-white/[0.06]">
                  <th scope="row" className="text-left font-medium text-white/50 px-4 py-2.5 w-1/2">{k}</th>
                  <td className="px-4 py-2.5 font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="mt-10 font-display text-xl font-bold">Примена по индустрии</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.industries.map((s) => (
              <Link key={s} href={`/catalog?industry=${s}`} className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm hover:border-brand-1/50 hover:text-brand-2">
                {getIndustry(s)?.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-14 font-display text-xl font-bold">Слични производи</h2>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.map((r) => <ProductCard key={r.slug} p={r} />)}
      </div>
    </div>
  );
}
