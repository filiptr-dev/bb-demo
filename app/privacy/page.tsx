import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Политика за приватност",
  description: "Како Б&Б Уникооп ги собира, користи и штити вашите лични податоци.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <div className="pt-16">
      <article className="container mx-auto max-w-3xl px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mb-2">Политика за приватност</h1>
        <p className="text-xs text-muted-foreground mb-8">Последно ажурирано: {site.updated}</p>
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">1. Контролор на податоци</h2><div className="space-y-2"><p>Б&Б Уникооп („ние“) е контролор на личните податоци собрани преку оваа веб-страница. Контакт: <a className="text-brand-2 underline" href="/contact">/contact</a>.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">2. Кои податоци ги собираме</h2><div className="space-y-2"><p>Кога ни пишувате преку контакт-формата: име, е-пошта, телефон (по избор) и содржина на пораката. Не бараме и не собираме чувствителни податоци.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">3. Цел и правна основа</h2><div className="space-y-2"><p>Податоците ги користиме само за одговор на вашето барање и подготовка на понуда, врз основа на вашата согласност и наш легитимен интерес за деловна комуникација.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">4. Рок на чување</h2><div className="space-y-2"><p>Податоците ги чуваме најдолго додека е потребно за комуникацијата и законските обврски, потоа се бришат.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">5. Споделување</h2><div className="space-y-2"><p>Не ги продаваме вашите податоци. Може да ги обработуваат провајдери на услуги (хостинг, испраќање е-пошта) само по наше упатство.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">6. Колачиња</h2><div className="space-y-2"><p>Оваа веб-страница не користи колачиња за следење или рекламирање. Може да се користат технички неопходни колачиња.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">7. Ваши права</h2><div className="space-y-2"><p>Имате право на пристап, исправка, бришење, ограничување, преносливост и приговор, како и право на поплатка до Агенцијата за заштита на личните податоци. Барања праќајте преку страницата за контакт.</p></div></section>
        </div>
      </article>
    </div>
  );
}
