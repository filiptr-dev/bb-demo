import Link from "next/link";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import CountUp from "@/components/CountUp";
import BearingIcon from "@/components/BearingIcon";
import ParallaxLayer from "@/components/ParallaxLayer";
import { industries } from "@/lib/data";

const stats: [number, string, string][] = [
  [35, "+", "Години искуство"],
  [2, "", "Локации"],
  [24, "/7", "Мобилна услуга"],
  [100, "%", "Оригинални производи"],
];

const categories = [
  ["Лежишта", "Куглични, валчести, аксијални и лежишни единици.", "/catalog"],
  ["Куќишта", "Куќишта и лежишни единици за секоја примена.", "#contact"],
  ["Заптивки", "Индустриски заптивки и заптивни системи.", "#contact"],
  ["Ремени и ланци", "Компоненти за пренос на моќност.", "#contact"],
  ["Системи за мазење", "Автоматско мазење што го продолжува векот на опремата.", "#contact"],
  ["Алати за одржување", "Алати за монтажа, демонтажа и дијагностика.", "#contact"],
];

const why = [
  ["Оригинални производи", "100% оригинални SKF лежишта со проверка на автентичност."],
  ["Широка достапност", "Лежишта, куќишта, заптивки, ремени, ланци и мазива на едно место."],
  ["Стручна поддршка", "Инженери кои ви помагаат да го изберете правилното решение."],
  ["Брза испорака", "Испорака низ цела Македонија, а итни случаи 24/7."],
  ["35 години искуство", "Долгогодишно партнерство со најголемите индустрии во земјата."],
  ["Сертификати", "Документација и сертификати за секој производ."],
];

const bg = "linear-gradient(180deg, #1a1a1a 0%, #1e1d1c 15%, #201f1d 50%, #1e1d1c 85%, #1a1a1a 100%)";

// Vary each grid item's entrance direction by column so cards don't all slide in from the same spot.
const dir3 = [
  { x: -45, y: 15, rotate: -2 },
  { x: 0, y: 45, rotate: 0 },
  { x: 45, y: 15, rotate: 2 },
];
const dir4 = [
  { x: -35, y: 22 },
  { x: -12, y: 34 },
  { x: 12, y: 34 },
  { x: 35, y: 22 },
];

export default function Home() {
  return (
    <>
      <Hero />

      <section id="about" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden" style={{ background: bg }}>
        <ParallaxLayer range={70} className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-brand-1/[0.03] rounded-full blur-[180px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow="За нас" num="01">
            Кои <span className="text-gradient-brand">сме ние</span>
          </SectionHeading>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <Reveal x={-50} y={0} duration={1} className="relative">
              <div className="relative overflow-hidden rounded-2xl h-[320px] lg:h-[380px] bg-gradient-to-br from-[#2a2826] to-[#161514] border border-white/[0.06] flex items-center justify-center">
                <BearingIcon className="w-56 h-56 opacity-90" spin />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/70 to-transparent" />
              </div>
              <div className="absolute -bottom-5 -right-3 md:-right-5 bg-brand-gradient rounded-2xl p-5 shadow-2xl shadow-brand-1/20">
                <div className="font-numbers text-4xl">35+</div>
                <div className="text-white/90 text-xs">Години<br />искуство</div>
              </div>
            </Reveal>
            <Reveal x={50} y={0} duration={1} delay={0.2}>
              <p className="text-white/65 leading-relaxed mb-4">
                Б&amp;Б Уникооп е официјален SKF дистрибутер за Македонија. Веќе 35 години ги снабдуваме индустриите со лежишта, куќишта, заптивки, ремени, ланци и системи за мазење.
              </p>
              <p className="text-white/65 leading-relaxed mb-6">
                Нашата мисија е да го намалиме времето на застој и да обезбедиме континуитет во работењето на нашите клиенти – со оригинални производи и стручна поддршка 24/7.
              </p>
              <ul className="flex flex-wrap gap-2 mb-6">
                {["Официјален SKF дистрибутер", "Сертификати", "Проверка на автентичност"].map((b) => (
                  <li key={b} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/70">{b}</li>
                ))}
              </ul>
              <Link href="/catalog" className="text-brand-2 text-sm font-semibold uppercase tracking-wide hover:underline">Погледни го каталогот →</Link>
            </Reveal>
          </div>

          <dl className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/[0.07] pt-10">
            {stats.map(([n, s, l], i) => (
              <Reveal key={l} delay={i * 0.1} className="text-center" {...dir4[i % 4]}>
                <dt className="font-numbers text-5xl lg:text-6xl tracking-wider"><CountUp to={n} suffix={s} /></dt>
                <dd className="text-white/55 text-xs mt-1.5 tracking-wide uppercase">{l}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section id="products" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden">
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow="Нашите производи" num="02" center>
            Комплетни <span className="text-gradient-brand">индустриски решенија</span>
          </SectionHeading>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(([t, d, href], i) => (
              <Reveal key={t} delay={i * 0.08} {...dir3[i % 3]}>
                <Link href={href} className="group block h-full p-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05] hover:border-brand-1/25 transition-all duration-500">
                  <span className="font-numbers text-3xl text-brand-1/60 group-hover:text-brand-2 transition-colors">0{i + 1}</span>
                  <h3 className="font-display font-bold text-lg mt-2 mb-1.5 group-hover:text-brand-2 transition-colors">{t}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{d}</p>
                  <span className="inline-block mt-3 text-xs text-brand-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">Дознај повеќе →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="relative scroll-mt-16 py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #1a1a1a 0%, rgba(30,28,26,0.92) 15%, rgba(30,28,26,0.88) 50%, rgba(30,28,26,0.92) 85%, #1a1a1a 100%)" }} />
        <ParallaxLayer range={90} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-1/[0.03] rounded-full blur-[200px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow="Индустрии што ги опслужуваме" num="03" center>
            Го придвижуваме <span className="text-gradient-brand">секој сектор</span>
          </SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {industries.map((i, idx) => (
              <Reveal key={i.slug} delay={idx * 0.05} {...dir4[idx % 4]}>
                <Link
                  href={`/catalog?industry=${i.slug}`}
                  className="group relative h-36 rounded-xl overflow-hidden border border-white/[0.07] hover:border-brand-1/30 flex flex-col items-center justify-center gap-2 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: i.image }} />
                  <div className="absolute inset-0 bg-white/[0.03] group-hover:bg-black/45 transition-colors" />
                  <span className="relative font-numbers text-2xl text-white/40 group-hover:text-white transition-colors">0{idx + 1}</span>
                  <span className="relative text-xs uppercase tracking-wide text-white/65 group-hover:text-white group-hover:font-semibold transition-all">{i.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="text-center mt-8">
            <Link href="/catalog" className="inline-block px-7 py-3 border border-white/25 rounded-full text-xs uppercase tracking-wide hover:bg-white/10 transition-colors">Отвори го каталогот</Link>
          </Reveal>
        </div>
      </section>

      <section id="brands" className="relative py-16 lg:py-20 overflow-hidden" style={{ background: bg }}>
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow="Овластен дистрибутер" num="04">
            Доверба од <span className="text-gradient-brand">светски бранд</span>
          </SectionHeading>
          <Reveal>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 lg:p-10 grid md:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="font-display font-extrabold text-6xl lg:text-7xl tracking-tighter text-gradient-brand">SKF</div>
              <div>
                <h3 className="font-display font-bold text-xl mb-2">Светски лидер во лежишта и заптивки</h3>
                <p className="text-white/60 leading-relaxed">Како официјален дистрибутер, нудиме целосен SKF асортиман: лежишта, куќишта, заптивки, системи за мазење и алатки за одржување, заедно со SKF Mount и DialSet.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="why" className="relative py-16 lg:py-20 overflow-hidden">
        <div className="relative container mx-auto px-6 lg:px-10">
          <SectionHeading eyebrow="Зошто Б&Б Уникооп" num="05" center>
            Градени на <span className="text-gradient-brand">доверба</span>, водени од <span className="text-gradient-brand">квалитет</span>
          </SectionHeading>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {why.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.08} {...dir3[i % 3]}>
                <div className="group h-full p-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05] hover:border-brand-1/25 transition-all duration-500">
                  <div className="w-11 h-11 rounded-xl bg-brand-1/10 group-hover:bg-brand-1/20 flex items-center justify-center font-numbers text-xl text-brand-1 group-hover:text-brand-2 mb-4 transition-colors">{i + 1}</div>
                  <h3 className="font-display font-bold text-lg mb-2 group-hover:text-brand-2 transition-colors">{t}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,90,50,0.12) 0%, #1a1a1a 30%, #1e1d1c 50%, #1a1a1a 70%, rgba(255,170,34,0.06) 100%)" }} />
        <ParallaxLayer range={60} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-1/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-10 text-center">
          <Reveal>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight mb-4">
              Барате сигурни<br /><span className="text-gradient-brand glow-text">индустриски решенија</span>?
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-white/60 max-w-xl mx-auto mb-8">Побарајте понуда денес. Нашиот тим е подготвен да ви помогне да го најдете вистинското решение.</p>
          </Reveal>
          <Reveal delay={0.3} className="flex flex-wrap justify-center gap-3">
            <a href="#contact" className="px-7 py-3.5 bg-brand-gradient font-semibold rounded-full hover:shadow-[0_0_45px_rgba(255,90,50,0.5)] transition-shadow text-xs tracking-wide uppercase">Стапи во контакт →</a>
            <Link href="/catalog" className="px-7 py-3.5 border border-white/25 rounded-full hover:bg-white/10 transition-colors text-xs tracking-wide uppercase">Каталог</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
