import Link from "next/link";

/**
 * The Sinag mark: a sun whose eight long rays run from gold into the flag's blue and red,
 * with finer gold rays between them. The ray ring turns very slowly (off for reduced motion).
 */
export function SinagMark({ className = "h-9 w-9", spin = true }: { className?: string; spin?: boolean }) {
  const long = Array.from({ length: 8 }, (_, i) => i);
  const fine = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/* Gradients run along an upright ray; each ray is rotated into place with its gradient. */}
        <linearGradient id="sinag-ray-blue" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.18" stopColor="#FCD116" />
          <stop offset="0.42" stopColor="#A9BFF2" />
          <stop offset="0.72" stopColor="#3F63C8" />
          <stop offset="1" stopColor="#0038A8" />
        </linearGradient>
        <linearGradient id="sinag-ray-red" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.18" stopColor="#FCD116" />
          <stop offset="0.58" stopColor="#EE5A2F" />
          <stop offset="1" stopColor="#CE1126" />
        </linearGradient>
        <linearGradient id="sinag-ray-fine" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-80">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sinag-core" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FFF6C2" />
          <stop offset="0.45" stopColor="#FCD116" />
          <stop offset="1" stopColor="#E0A800" />
        </radialGradient>
      </defs>

      <g
        className={spin ? "animate-[sinag-turn_90s_linear_infinite] motion-reduce:animate-none" : undefined}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        {fine.map((i) => (
          <polygon key={`f${i}`} points="-4,-34 4,-34 0,-80" fill="url(#sinag-ray-fine)" transform={`rotate(${i * 45 + 22.5})`} />
        ))}
        {long.map((i) => {
          const fill = i % 2 === 0 ? "url(#sinag-ray-blue)" : "url(#sinag-ray-red)";
          return (
            <g key={`l${i}`} transform={`rotate(${i * 45})`}>
              {/* two halves, one lit and one shaded, so each ray reads as a bevelled blade */}
              <polygon points="-11,-34 0,-34 0,-98" fill={fill} />
              <polygon points="0,-34 11,-34 0,-98" fill={fill} />
              <polygon points="0,-34 11,-34 0,-98" fill="#8A4B00" opacity="0.14" />
            </g>
          );
        })}
      </g>

      <circle r="30" fill="url(#sinag-core)" />
      <circle r="30" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle r="23" fill="none" stroke="#B88700" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Sinag home">
      <SinagMark />
      <span className={`font-display text-[26px] font-bold leading-none tracking-tight ${light ? "text-white" : "text-flag-blue"}`}>Sinag</span>
    </Link>
  );
}
