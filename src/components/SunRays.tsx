/**
 * The hero sun: the Sinag mark at poster scale. A warm glow, two rings of rays that drift in opposite
 * directions (gold fading into the flag's blue and red), hairline light beams, and a glossy golden core.
 * Decorative only. Rotation is off for people who prefer reduced motion.
 */
export default function SunRays({ className = "" }: { className?: string }) {
  const ring = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i);
  // Full class names so Tailwind can see them.
  const FORWARD = "animate-[sinag-turn_140s_linear_infinite] motion-reduce:animate-none";
  const BACKWARD = "animate-[sinag-turn_240s_linear_infinite_reverse] motion-reduce:animate-none";
  const box = { transformBox: "fill-box", transformOrigin: "center" } as const;

  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-glow" r="0.5">
          <stop offset="0.25" stopColor="#FCD116" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#FCD116" stopOpacity="0.14" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-blue" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.18" stopColor="#FCD116" />
          <stop offset="0.42" stopColor="#A9BFF2" />
          <stop offset="0.72" stopColor="#3F63C8" />
          <stop offset="1" stopColor="#0038A8" />
        </linearGradient>
        <linearGradient id="hero-red" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.18" stopColor="#FCD116" />
          <stop offset="0.58" stopColor="#EE5A2F" />
          <stop offset="1" stopColor="#CE1126" />
        </linearGradient>
        <linearGradient id="hero-fine" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-84">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-hair" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-99">
          <stop offset="0" stopColor="#FFE680" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE680" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-core" cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFF8D0" />
          <stop offset="0.4" stopColor="#FCD116" />
          <stop offset="1" stopColor="#D99A00" />
        </radialGradient>
      </defs>

      <circle r="100" fill="url(#hero-glow)" />

      {/* outer ring: 24 hairline beams, slowly counter-turning */}
      <g className={BACKWARD} style={box}>
        {ring(24, 7.5).map((deg) => (
          <polygon key={deg} points="-0.9,-30 0.9,-30 0,-99" fill="url(#hero-hair)" transform={`rotate(${deg})`} />
        ))}
      </g>

      {/* main ring: 8 long rays into flag blue and red, with 8 fine gold rays between */}
      <g className={FORWARD} style={box}>
        {ring(8, 22.5).map((deg) => (
          <polygon key={`f${deg}`} points="-4,-34 4,-34 0,-84" fill="url(#hero-fine)" transform={`rotate(${deg})`} />
        ))}
        {ring(8).map((deg, i) => (
          <polygon
            key={`l${deg}`}
            points="-11,-34 11,-34 0,-98"
            fill={i % 2 === 0 ? "url(#hero-blue)" : "url(#hero-red)"}
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* the sun itself */}
      <circle r="32" fill="#FCD116" opacity="0.35" />
      <circle r="30" fill="url(#hero-core)" />
      <circle r="30" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.2" />
      <circle r="23" fill="none" stroke="#B88700" strokeOpacity="0.3" strokeWidth="0.8" />
      <ellipse cx="-9" cy="-11" rx="11" ry="6" fill="#fff" opacity="0.35" transform="rotate(-30 -9 -11)" />
    </svg>
  );
}
