import type { Metadata } from "next";
import { Phone, Clock, MapPin } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакт",
  description: "Контактирајте го Б&Б Уникооп – официјален SKF дистрибутер во Македонија. Телефон 24/7, Прилеп и Скопје.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pt-16">
      <section className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">СТАПИ ВО <span className="text-gradient-brand">КОНТАКТ</span></h1>
        <p className="max-w-2xl text-sm md:text-base text-muted-foreground">Побарајте понуда или советување за избор на лежиште. Одговараме во најкраток рок.</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-5 text-sm">
            {site.phones.map((p) => (
              <li key={p.tel} className="flex items-start gap-3"><Phone className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">{p.city} · 24/7</div><a href={`tel:${p.tel}`} className="text-lg font-semibold hover:text-brand-2">{p.label}</a></div></li>
            ))}
            <li className="flex items-start gap-3"><Clock className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">Канцеларија, Скопје</div><div className="font-semibold">{site.hours}</div></div></li>
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">Локации</div><div className="font-semibold">Прилеп · Скопје, Македонија</div></div></li>
          </ul>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
