"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BearingIcon from "./BearingIcon";

const nav = [
  { href: "/#about", label: "За нас" },
  { href: "/#products", label: "Производи" },
  { href: "/#industries", label: "Индустрии" },
  { href: "/#contact", label: "Контакт" },
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
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || open ? "bg-ink/95 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}>
      <div className="container mx-auto px-6 lg:px-10 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <BearingIcon className="w-8 h-8" />
          <span className="font-display font-extrabold tracking-tight">Б&amp;Б <span className="text-gradient-brand">УНИКООП</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[13px] uppercase tracking-wider text-white/70">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-amber transition-colors">{n.label}</Link>
          ))}
        </nav>

        <form action="/catalog" className="ml-auto hidden md:block w-64">
          <label htmlFor="hs" className="sr-only">Пребарај лежиште</label>
          <input
            id="hs"
            name="search"
            type="search"
            placeholder="Пребарај ознака, пр. 6205…"
            className="w-full rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:border-flame/60 transition-colors"
          />
        </form>

        <Link href="/catalog" className="ml-auto md:ml-0 hidden sm:inline-block px-5 py-2 rounded-full bg-gradient-to-r from-flame to-amber text-xs font-semibold uppercase tracking-wide hover:shadow-[0_0_30px_rgba(255,90,50,0.45)] transition-shadow">
          Е-каталог
        </Link>

        <button className="lg:hidden ml-auto sm:ml-0 p-2" aria-label="Мени" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="block w-6 h-0.5 bg-white mb-1.5" /><span className="block w-6 h-0.5 bg-white mb-1.5" /><span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden container mx-auto px-6 pb-5 space-y-3">
          <form action="/catalog">
            <input name="search" type="search" placeholder="Пребарај ознака…" className="w-full rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm focus:outline-none focus:border-flame/60" />
          </form>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block text-sm uppercase tracking-wider text-white/80">{n.label}</Link>
          ))}
          <Link href="/catalog" onClick={() => setOpen(false)} className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-flame to-amber text-xs font-semibold uppercase">Е-каталог</Link>
        </div>
      )}
    </header>
  );
}
