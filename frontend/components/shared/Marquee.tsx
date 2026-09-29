import type { ReactNode } from "react";

// Endless horizontal strip. The track holds the items twice and slides by half its width,
// so the loop is seamless. CSS-only: pauses on hover/focus, stops under prefers-reduced-motion.
export default function Marquee({
  items, label, seconds = 60, className = "",
}: { items: ReactNode[]; label: string; seconds?: number; className?: string }) {
  return (
    <div role="region" aria-label={label} className={`marquee group relative overflow-hidden ${className}`}>
      <div className="marquee-track flex w-max" style={{ animationDuration: `${seconds}s` }}>
        <ul className="flex shrink-0 items-center">
          {items.map((item, i) => <li key={i} className="shrink-0">{item}</li>)}
        </ul>
        {/* visual copy for the loop only */}
        <ul className="marquee-copy flex shrink-0 items-center" aria-hidden inert>
          {items.map((item, i) => <li key={i} className="shrink-0">{item}</li>)}
        </ul>
      </div>
    </div>
  );
}
