import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { alternatesFor } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";

// Content mirrors the legacy "SKF автентикација" page (bbunikoop.com.mk/skf-avtentikacija); photos are hotlinked from it.
const legacy = "https://bbunikoop.com.mk/wp-content/uploads/2022/05/";
const photoGuide = [1, 2, 3, 4, 5].map((n) => `${legacy}authenticate-${n}.jpg`);
const appLinks = {
  ios: "https://apps.apple.com/app/skf-authenticate/id987442973",
  android: "https://play.google.com/store/apps/details?id=com.skf.authenticate",
};
const brandProtection = "https://www.skf.com/group/organisation/brand-protection";

export async function generateMetadata({ params }: PageProps<"/[locale]/authenticity">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.authenticity" });
  return { title: t("title"), description: t("description"), alternates: alternatesFor("/authenticity", locale) };
}

export default async function AuthenticityPage({ params }: PageProps<"/[locale]/authenticity">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Authenticity");
  const th = await getTranslations("Hero");
  const stats = t.raw("stats") as { value: string; label: string }[];
  const photos = t.raw("photos.items") as string[];
  const steps = t.raw("steps.items") as string[];
  const heading = "font-display font-bold text-2xl md:text-3xl tracking-tight mb-3";
  const body = "text-sm md:text-base leading-relaxed text-muted-foreground";

  return (
    <div className="pt-16">
      <section className="container mx-auto px-6 lg:px-10 py-12 lg:py-16 max-w-4xl space-y-16">
        <header>
          <p className="flex items-center gap-2 text-brand-2 text-xs tracking-[0.25em] uppercase font-semibold mb-4">
            <ShieldCheck className="size-4" /> {t("eyebrow")}
          </p>
          <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-3">{t("title")}</h1>
          <p className={`max-w-2xl ${body}`}>{t("subtitle")}</p>
          <img
            src={`${legacy}auth-3.jpg`}
            alt={t("bannerAlt")}
            className="mt-8 aspect-[21/9] w-full rounded-2xl border border-border object-cover"
          />
        </header>

        <section>
          <h2 className={heading}>{t("risk.h")}</h2>
          <p className={`max-w-2xl mb-8 ${body}`}>{t("risk.p")}</p>
          <dl className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.value} className="rounded-2xl border border-border bg-card p-5">
                <dt className="font-display font-black text-3xl text-gradient-brand mb-1">{s.value}</dt>
                <dd className="text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{t("risk.source")}</p>
        </section>

        <section className="flex flex-col-reverse gap-6 md:flex-row md:items-center rounded-2xl border border-border bg-brand-gradient-soft p-6 md:p-8">
          <div className="flex-1">
            <h2 className={heading}>{t("source.h")}</h2>
            <p className={`max-w-2xl mb-6 ${body}`}>{t("source.p")}</p>
            <div className="flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href="/catalog" />} className="rounded-full bg-brand-gradient text-white">{t("source.catalog")}</Button>
              <Button nativeButton={false} render={<Link href="/contact" />} variant="outline" className="rounded-full">{t("source.contact")}</Button>
            </div>
          </div>
          <img src="/images/brand/skf-authorized-distributor.png" alt={th("badgeAlt")} className="w-28 md:w-36 h-auto shrink-0" />
        </section>

        <section>
          <h2 className={heading}>{t("app.h")}</h2>
          <p className={`max-w-2xl mb-6 ${body}`}>{t("app.p")}</p>
          <div className="flex flex-wrap gap-3">
            {(["ios", "android"] as const).map((os) => (
              <a key={os} href={appLinks[os]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:border-primary transition-colors">
                {t(`app.${os}`)} <ArrowUpRight className="size-4" />
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className={heading}>{t("photos.h")}</h2>
          <p className={`max-w-2xl mb-6 ${body}`}>{t("photos.p")}</p>
          <ol className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {photos.map((caption, i) => (
              <li key={caption}>
                <img src={photoGuide[i]} alt="" loading="lazy" className="aspect-video w-full rounded-xl border border-border object-cover" />
                <p className="mt-2 text-sm"><span className="text-brand-2 font-semibold">{i + 1}.</span> {caption}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className={heading}>{t("steps.h")}</h2>
          <ol className="space-y-4 max-w-2xl">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
                <p className={`pt-1 ${body}`}>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border pt-8 text-sm text-muted-foreground">
          <p>
            {t.rich("more", {
              contact: (chunks) => <Link href="/contact" className="text-brand-2 underline">{chunks}</Link>,
              skf: (chunks) => <a href={brandProtection} target="_blank" rel="noopener noreferrer" className="text-brand-2 underline">{chunks}</a>,
            })}
          </p>
        </section>
      </section>
    </div>
  );
}
