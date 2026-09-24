"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BearingIcon from "./BearingIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const nav = [
  { href: "/#about", label: "За нас" },
  { href: "/#products", label: "Производи" },
  { href: "/#industries", label: "Индустрии" },
  { href: "/contact", label: "Контакт" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"}`}>
      <div className="container mx-auto px-6 lg:px-10 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <BearingIcon className="w-8 h-8" />
          <span className="font-display font-extrabold tracking-tight">Б&amp;Б <span className="text-gradient-brand">УНИКООП</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[13px] uppercase tracking-wider text-foreground/70">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-2 transition-colors">{n.label}</Link>
          ))}
        </nav>

        <form action="/catalog" className="ml-auto hidden md:block w-64">
          <label htmlFor="hs" className="sr-only">Пребарај лежиште</label>
          <Input id="hs" name="search" type="search" placeholder="Пребарај ознака, пр. 6205…" className="h-9 rounded-full px-4" />
        </form>

        <Button nativeButton={false} render={<Link href="/catalog" />} className="ml-auto md:ml-0 hidden sm:inline-flex rounded-full bg-brand-gradient text-white text-xs font-semibold uppercase tracking-wide h-9 px-5 hover:shadow-[0_0_30px_rgba(var(--brand-glow-1-rgb),0.45)] transition-shadow">Е-каталог</Button>

        <button className="lg:hidden ml-auto sm:ml-0 p-2" aria-label="Мени" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="block w-6 h-0.5 bg-foreground mb-1.5" /><span className="block w-6 h-0.5 bg-foreground mb-1.5" /><span className="block w-6 h-0.5 bg-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="lg:hidden">
          <SheetHeader><SheetTitle>Мени</SheetTitle></SheetHeader>
          <div className="px-4 space-y-4">
            <form action="/catalog">
              <Input name="search" type="search" placeholder="Пребарај ознака…" className="h-10 rounded-full px-4" />
            </form>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block text-sm uppercase tracking-wider text-foreground/80">{n.label}</Link>
            ))}
            <Button nativeButton={false} render={<Link href="/catalog" onClick={() => setOpen(false)} />} className="rounded-full bg-brand-gradient text-white text-xs font-semibold uppercase">Е-каталог</Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
