import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Услови за користење",
  description: "Услови за користење на веб-страницата на Б&Б Уникооп.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <div className="pt-16">
      <article className="container mx-auto max-w-3xl px-6 lg:px-10 py-12 lg:py-16">
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mb-2">Услови за користење</h1>
        <p className="text-xs text-muted-foreground mb-8">Последно ажурирано: {site.updated}</p>
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">1. Прифаќање</h2><div className="space-y-2"><p>Со користење на оваа веб-страница ги прифаќате овие услови. Ако не се согласувате, ве молиме не ја користете.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">2. Информативен карактер</h2><div className="space-y-2"><p>Каталогот има информативна намена. Димензиите, ознаките и описите се дадени со најдобра намера, но може да содржат грешки. Пред нарачка проверете ги податоците кај нас. Информациите на страницата не претставуваат обврзувачка понуда.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">3. Цени и достапност</h2><div className="space-y-2"><p>Цените и залихите не се објавуваат на страницата и се договараат индивидуално преку понуда.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">4. Интелектуална сопственост</h2><div className="space-y-2"><p>Содржината на страницата е сопственост на Б&Б Уникооп или на нејзините носители на права. SKF и другите марки припаѓаат на нивните сопственици. Не е дозволено копирање без наша согласност.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">5. Ограничување на одговорност</h2><div className="space-y-2"><p>Не превземаме одговорност за штета настаната од користење на информациите од страницата, во границите дозволени со закон.</p></div></section>
          <section><h2 className="font-display text-xl font-bold text-foreground mb-2">6. Измени и применливо право</h2><div className="space-y-2"><p>Условите може да се менуваат; важи верзијата објавена на страницата. Применливо е правото на Република Северна Македонија.</p></div></section>
        </div>
      </article>
    </div>
  );
}
