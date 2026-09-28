"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("Hero");
  const tc = useTranslations("Common");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={sectionRef} className="relative min-h-[88vh] w-full overflow-hidden bg-background flex items-center pt-16">
      <motion.div
        className="absolute inset-y-0 right-0 w-full lg:w-[62%] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
        style={{ y: photoY }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src="/images/hero/worker.jpg" alt="" className="h-full w-full object-cover object-[28%_center]" />
      </motion.div>

      <motion.img
        src="/images/hero/skf-bb-badge.png"
        alt={t("badgeAlt")}
        className="absolute z-10 right-6 lg:right-12 bottom-16 lg:bottom-20 w-36 sm:w-44 lg:w-56 h-auto drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 lg:via-ink/70 to-ink/10 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/60 z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(var(--brand-glow-1-rgb),0.07)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-20 container mx-auto px-6 lg:px-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex items-center gap-3 mb-5">
          <div className="w-10 h-[2px] bg-brand-gradient" />
          <span className="text-brand-2 text-xs tracking-[0.3em] uppercase font-semibold">{t("eyebrow")}</span>
        </motion.div>

        <h1 className="font-display font-extrabold text-[2rem] sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.98] tracking-tighter mb-6">
          {(t.raw("heading") as string[]).map((w, i) => (
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

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="text-foreground/70 text-base lg:text-lg max-w-xl leading-relaxed mb-8">
          {t("description")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }} className="flex flex-wrap gap-3">
          <a href="#contact" className="px-7 py-3.5 bg-brand-gradient font-semibold rounded-full hover:shadow-[0_0_40px_rgba(var(--brand-glow-1-rgb),0.5)] transition-all duration-300 text-xs tracking-wide uppercase">
            {t("ctaQuote")}
          </a>
          <a href="#about" className="px-7 py-3.5 border border-foreground/25 font-medium rounded-full hover:bg-foreground/10 hover:border-foreground/40 transition-all duration-300 text-xs tracking-wide uppercase">
            {t("ctaAbout")}
          </a>
        </motion.div>
      </div>

      <motion.a href="#about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10" aria-label={tc("scrollAria")}>
        <span className="text-foreground/50 text-[10px] tracking-[0.2em] uppercase">{t("scroll")}</span>
        <span className="hero-scroll-bounce text-brand-2/60">↓</span>
      </motion.a>
    </section>
  );
}
