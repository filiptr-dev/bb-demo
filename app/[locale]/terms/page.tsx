import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.terms" });
  return { title: t("title"), description: t("description"), alternates: alternatesFor("/terms", locale) };
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Terms");
  const tc = await getTranslations("Common");
  const sections = t.raw("sections") as { h: string; p: string }[];
  return (
    <div className="pt-16">
      <article className="container mx-auto max-w-3xl px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mb-2">{t("title")}</h1>
        <p className="text-xs text-muted-foreground mb-8">{t("updatedLabel")} {tc("updated")}</p>
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          {sections.map((s, i) => (
            <section key={s.h}>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">{s.h}</h2>
              <div className="space-y-2">
                <p>{t.rich(`sections.${i}.p`, { link: (chunks) => <Link className="text-brand-2 underline" href="/contact">{chunks}</Link> })}</p>
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
