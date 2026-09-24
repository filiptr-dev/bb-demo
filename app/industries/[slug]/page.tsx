import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { industries, getIndustry, products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const i = getIndustry(slug);
  if (!i) return {};
  return {
    title: `Лежишта за ${i.name.toLowerCase()}`,
    description: i.blurb,
    alternates: { canonical: `/industries/${i.slug}` },
  };
}

export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const { slug } = await params;
  const i = getIndustry(slug);
  if (!i) notFound();
  const list = products.filter((p) => p.industries.includes(i.slug));
  return (
    <div className="container mx-auto px-6 lg:px-10 pt-24 pb-14">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Лежишта за {i.name.toLowerCase()}</h1>
      <p className="mt-2 text-foreground/60 max-w-2xl">{i.blurb}</p>
      <Link href={`/catalog?industry=${i.slug}`} className="mt-4 inline-block text-brand-2 font-semibold hover:underline">
        Отвори во каталог со филтри →
      </Link>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </div>
  );
}
