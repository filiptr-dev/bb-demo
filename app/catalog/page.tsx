import { Suspense } from "react";
import type { Metadata } from "next";
import CatalogClient from "@/components/CatalogClient";

export const metadata: Metadata = {
  title: "Каталог на лежишта",
  description: "Пребарувајте SKF лежишта по ознака или димензии и филтрирајте по индустрија.",
  alternates: { canonical: "/catalog" },
};

export default function CatalogPage() {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden py-10 lg:py-12">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-brand-1/[0.05] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10">
          <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">
            КАТАЛОГ <span className="text-gradient-brand">ПРОИЗВОДИ</span>
          </h1>
          <p className="text-white/55 max-w-2xl text-sm md:text-base">Пребарувајте по ознака (6205), димензии (25x52x15), тип, заптивање или индустрија – и пронајдете го точно она што ви треба.</p>
        </div>
      </section>
      <Suspense fallback={<p className="container mx-auto px-6 text-white/50">Се вчитува…</p>}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
