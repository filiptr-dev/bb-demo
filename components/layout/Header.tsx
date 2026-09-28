"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import BearingIcon from "@/components/brand/BearingIcon";
import { Button } from "@/components/ui/button";
import HeaderSearch from "@/components/search/HeaderSearch";
import QuoteHeaderLink from "@/components/quote/QuoteHeaderLink";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const nav = [
  { href: "/#about", key: "about" },
  { href: "/#products", key: "products" },
  { href: "/#industries", key: "industries" },
  { href: "/decoder", key: "decoder" },
  { href: "/contact", key: "contact" },
] as const;
// the desktop bar has no room for more; the tool pages link to each other
const mobileNav = [...nav.slice(0, 4), { href: "/size-finder", key: "sizeFinder" }, nav[4]] as const;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useTranslations("Nav");
  const tc = useTranslations("Common");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"}`}>
      <div className="container mx-auto px-6 lg:px-10 h-16 flex items-center gap-8 2xl:gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <BearingIcon className="w-8 h-8" />
          <span className="font-display font-extrabold tracking-tight">{tc("brandFirst")} <span className="text-gradient-brand">{tc("brandSecond")}</span></span>
        </Link>

        <nav className="hidden 2xl:flex items-center gap-6 whitespace-nowrap text-[13px] uppercase tracking-wider text-foreground/70">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-2 transition-colors">{t(n.key)}</Link>
          ))}
        </nav>

        <span className="flex-1 md:hidden" />
        <HeaderSearch placeholder={t("searchPlaceholder")} className="ml-auto hidden md:block w-64 2xl:w-44 shrink-0" inputClassName="h-9 rounded-full px-4" />

        <LanguageSwitcher className="hidden sm:inline-flex" />

        <Button nativeButton={false} render={<Link href="/catalog" />} className="hidden sm:inline-flex rounded-full bg-brand-gradient text-white text-xs font-semibold uppercase tracking-wide h-9 px-5 hover:shadow-[0_0_30px_rgba(var(--brand-glow-1-rgb),0.45)] transition-shadow">{t("eCatalog")}</Button>

        <QuoteHeaderLink onClick={() => setOpen(false)} />

        <button className="2xl:hidden p-2" aria-label={t("menu")} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="block w-6 h-0.5 bg-foreground mb-1.5" /><span className="block w-6 h-0.5 bg-foreground mb-1.5" /><span className="block w-6 h-0.5 bg-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="2xl:hidden">
          <SheetHeader><SheetTitle>{t("menu")}</SheetTitle></SheetHeader>
          <div className="px-4 space-y-4">
            <HeaderSearch placeholder={tc("searchShort")} inputClassName="h-10 rounded-full px-4" onNavigate={() => setOpen(false)} />
            {mobileNav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block text-sm uppercase tracking-wider text-foreground/80">{t(n.key)}</Link>
            ))}
            <Button nativeButton={false} render={<Link href="/catalog" onClick={() => setOpen(false)} />} className="rounded-full bg-brand-gradient text-white text-xs font-semibold uppercase">{t("eCatalog")}</Button>
            <LanguageSwitcher className="sm:hidden" />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
