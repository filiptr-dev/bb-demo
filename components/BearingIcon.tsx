export default function BearingIcon({ className = "", spin = false, style }: { className?: string; spin?: boolean; style?: React.CSSProperties }) {
  const balls = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { x: 100 + Math.cos(a) * 62, y: 100 + Math.sin(a) * 62 };
  });
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} role="img" aria-label="Лежиште">
      <defs>
        <radialGradient id="steel" cx="35%" cy="30%">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#64748b" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#steel)" stroke="#334155" strokeWidth="2" />
      <circle cx="100" cy="100" r="78" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
      <g className={spin ? "animate-spin-slow" : ""} style={{ transformOrigin: "100px 100px" }}>
        {balls.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="11" fill="url(#steel)" stroke="#334155" strokeWidth="1.5" />
        ))}
      </g>
      <circle cx="100" cy="100" r="46" fill="url(#steel)" stroke="#334155" strokeWidth="2" />
      <circle cx="100" cy="100" r="30" fill="#0b1b34" stroke="#94a3b8" strokeWidth="2" />
    </svg>
  );
}
