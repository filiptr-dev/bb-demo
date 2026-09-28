import type { Metadata } from "next";
import { Phone, Clock, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.contact" });
  return { title: t("title"), description: t("description"), alternates: alternatesFor("/contact", locale) };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Contact");
  const tc = await getTranslations("Common");
  return (
    <div className="pt-16">
      <section className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-2">{t("titlePrefix")} <span className="text-gradient-brand">{t("titleHighlight")}</span></h1>
        <p className="max-w-2xl text-sm md:text-base text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-5 text-sm">
            {site.phones.map((p) => (
              <li key={p.tel} className="flex items-start gap-3"><Phone className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">{tc(`cities.${p.city}`)} · {t("availability")}</div><a href={`tel:${p.tel}`} className="text-lg font-semibold hover:text-brand-2">{p.label}</a></div></li>
            ))}
            <li className="flex items-start gap-3"><Clock className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">{t("office")}</div><div className="font-semibold">{tc("hours")}</div></div></li>
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 text-brand-2" /><div><div className="text-muted-foreground">{t("locations")}</div><div className="font-semibold">{t("locationsValue")}</div></div></li>
          </ul>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
