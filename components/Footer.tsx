import Link from "next/link";
import { industries } from "@/lib/data";
import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-16 bg-ink border-t border-white/[0.06] overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-flame/[0.05] rounded-full blur-[130px] pointer-events-none" />
      <div className="relative container mx-auto px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3">
        <Reveal>
          <h3 className="font-display font-extrabold text-xl mb-3">Б&amp;Б <span className="text-gradient-brand">УНИКООП</span></h3>
          <p className="text-sm text-white/55 leading-relaxed">Официјален SKF дистрибутер за Македонија веќе 35 години. Лежишта, заптивки, пренос на моќност и мазива.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h4 className="text-amber text-xs tracking-[0.25em] uppercase font-semibold mb-4">Индустрии</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/60">
            {industries.map((i) => (
              <li key={i.slug}><Link className="hover:text-white transition-colors" href={`/catalog?industry=${i.slug}`}>{i.name}</Link></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.2}>
          <h4 className="text-amber text-xs tracking-[0.25em] uppercase font-semibold mb-4">Контакт · 24/7</h4>
          <ul className="text-sm text-white/60 space-y-2">
            <li>Прилеп: <a className="text-white hover:text-amber" href="tel:+38970353619">+389 70 353 619</a></li>
            <li>Скопје: <a className="text-white hover:text-amber" href="tel:+38970266179">+389 70 266 179</a></li>
            <li>Скопје, канцеларија: пон–пет 09:00–16:00</li>
          </ul>
        </Reveal>
      </div>
      <div className="relative border-t border-white/[0.06] py-4 text-center text-xs text-white/35">
        © Б&amp;Б Уникооп · Демо верзија
      </div>
    </footer>
  );
}
