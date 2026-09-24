import Reveal from "./Reveal";
import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow, children, center = false, num,
}: { eyebrow: string; children: ReactNode; center?: boolean; num?: string }) {
  return (
    <div className={`relative mb-10 ${center ? "text-center" : ""}`}>
      {num && (
        <span className="absolute -top-8 left-0 font-numbers text-[110px] md:text-[150px] text-white/[0.03] leading-none select-none pointer-events-none">
          {num}
        </span>
      )}
      <Reveal y={-15} className={`relative flex items-center gap-3 mb-4 ${center ? "justify-center" : ""}`}>
        <div className={`w-10 h-[2px] bg-gradient-to-r ${center ? "from-transparent to-flame" : "from-flame to-amber"}`} />
        <span className="text-amber text-xs tracking-[0.3em] uppercase font-semibold">{eyebrow}</span>
        {center && <div className="w-10 h-[2px] bg-gradient-to-r from-flame to-transparent" />}
      </Reveal>
      <Reveal delay={0.15}>
        <h2 className="relative font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight">{children}</h2>
      </Reveal>
    </div>
  );
}
