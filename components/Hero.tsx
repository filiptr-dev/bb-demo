"use client";

import { motion } from "motion/react";
import BearingIcon from "./BearingIcon";

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] w-full overflow-hidden bg-ink flex items-center pt-16">
      <motion.div
        className="absolute right-[-8%] md:right-[0%] lg:right-[4%] top-1/2 -translate-y-1/2 w-[70%] sm:w-[52%] lg:w-[42%] xl:w-[38%]"
        initial={{ opacity: 0, scale: 0.3, rotate: -90, filter: "blur(30px)" }}
        animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <div className="hero-bearing-float">
          <div className="hero-bearing-spin">
            <BearingIcon className="w-full h-auto" style={{ filter: "drop-shadow(0 0 80px rgba(255,90,50,0.25)) drop-shadow(0 0 160px rgba(255,170,34,0.12))" }} />
          </div>
        </div>
        <div className="hero-bearing-glow absolute inset-0 -z-10 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,90,50,0.15) 0%, rgba(255,170,34,0.08) 35%, transparent 60%)" }} />
        <div className="hero-particle-ring absolute inset-[-15%] -z-10">
          {Array.from({ length: 6 }, (_, b) => (
            <div
              key={b}
              className="hero-light-particle absolute w-1.5 h-1.5 rounded-full bg-amber"
              style={{ top: `${(50 + 45 * Math.sin((b * 2 * Math.PI) / 6)).toFixed(2)}%`, left: `${(50 + 45 * Math.cos((b * 2 * Math.PI) / 6)).toFixed(2)}%`, animationDelay: `${b * 0.5}s` }}
            />
          ))}
        </div>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/60 z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(255,90,50,0.07)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-20 container mx-auto px-6 lg:px-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex items-center gap-3 mb-5">
          <div className="w-10 h-[2px] bg-gradient-to-r from-flame to-amber" />
          <span className="text-amber text-xs tracking-[0.3em] uppercase font-semibold">Од 1991 · SKF дистрибутер</span>
        </motion.div>

        <h1 className="font-display font-extrabold text-[2rem] sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.98] tracking-tighter mb-6">
          {["ИНТЕГРИРАНИ", "ИНДУСТРИСКИ", "РЕШЕНИЈА"].map((w, i) => (
            <motion.span
              key={w}
              className={`block mb-1.5 ${i === 2 ? "text-gradient-brand glow-text" : ""}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="text-white/70 text-base lg:text-lg max-w-xl leading-relaxed mb-8">
          Б&amp;Б Уникооп обезбедува индустриски лежишта, опрема за пренос на моќност и решенија за одржување низ Македонија. Како официјален SKF дистрибутер, испорачуваме 100% оригинални производи.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }} className="flex flex-wrap gap-3">
          <a href="#contact" className="px-7 py-3.5 bg-gradient-to-r from-flame to-amber font-semibold rounded-full hover:shadow-[0_0_40px_rgba(255,90,50,0.5)] transition-all duration-300 text-xs tracking-wide uppercase">
            Побарај понуда
          </a>
          <a href="#about" className="px-7 py-3.5 border border-white/25 font-medium rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-xs tracking-wide uppercase">
            Дознај повеќе
          </a>
        </motion.div>
      </div>

      <motion.a href="#about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10" aria-label="Скролај надолу">
        <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">Скролај</span>
        <span className="hero-scroll-bounce text-amber/60">↓</span>
      </motion.a>
    </section>
  );
}
