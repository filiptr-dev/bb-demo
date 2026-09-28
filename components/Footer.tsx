import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { industries } from "@/lib/data";
import { site } from "@/lib/site";
import Reveal from "./Reveal";

export default async function Footer() {
  const t = await getTranslations("Footer");
  const tc = await getTranslations("Common");
  const ti = await getTranslations("Industries");
  return (
    <footer id="contact" className="relative scroll-mt-16 bg-background border-t border-foreground/[0.06] overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-brand-1/[0.05] rounded-full blur-[130px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3">
        <Reveal>
          <h3 className="font-display font-extrabold text-xl mb-3">{tc("brandFirst")} <span className="text-gradient-brand">{tc("brandSecond")}</span></h3>
          <p className="text-sm text-foreground/55 leading-relaxed">{t("tagline")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h4 className="text-brand-2 text-xs tracking-[0.25em] uppercase font-semibold mb-4">{t("industriesHeading")}</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground/60">
            {industries.map((i) => (
              <li key={i.slug}><Link className="hover:text-foreground transition-colors" href={`/catalog?industry=${i.slug}`}>{ti(`${i.slug}.name`)}</Link></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.2}>
          <h4 className="text-brand-2 text-xs tracking-[0.25em] uppercase font-semibold mb-4">{t("contactHeading")}</h4>
          <ul className="text-sm text-foreground/60 space-y-2">
            {site.phones.map((p) => (
              <li key={p.tel}>{tc(`cities.${p.city}`)}: <a className="text-foreground hover:text-brand-2" href={`tel:${p.tel}`}>{p.label}</a></li>
            ))}
            <li>{t("officeHours")}</li>
            <li><Link className="text-brand-2 hover:underline" href="/contact">{t("sendMessage")}</Link></li>
          </ul>
        </Reveal>
      </div>
      <div className="relative border-t border-foreground/[0.06] py-4 text-center text-xs text-foreground/35">
        © {new Date().getFullYear()} {t("copyright")} ·{" "}
        <Link href="/privacy" className="hover:text-foreground">{t("privacy")}</Link> ·{" "}
        <Link href="/terms" className="hover:text-foreground">{t("terms")}</Link>
      </div>
    </footer>
  );
}
