/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * The hero sun: the Sinag mark at poster scale and in motion.
 *  - Eight long bevelled rays (gold into the flag's blue and red) and eight fine gold rays turn together.
 *  - Twenty-four hairline beams turn slowly the other way.
 *  - Every ray lengthens and shortens from its base in a wave that travels around the sun.
 *  - A breathing glow, a white halo and a glossy core give it depth.
 * Decorative only. All motion stops for people who prefer reduced motion (see globals.css).
 */
const STRETCH_SECS = 5;
const ring = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i);
// Each ray starts a little later than the one before it, so the stretch ripples around the circle.
const wave = (i: number, n: number) => ({ animationDelay: `${-(i / n) * STRETCH_SECS}s` });

/** A ray drawn as two halves, lit on one side and shaded on the other, so it reads as a bevelled blade. */
function Blade({ w, len, fill }: { w: number; len: number; fill: string }) {
  return (
    <>
      <polygon points={`${-w},-34 0,-34 0,${-len}`} fill={fill} />
      <polygon points={`0,-34 ${w},-34 0,${-len}`} fill={fill} />
      <polygon points={`0,-34 ${w},-34 0,${-len}`} fill="#8A4B00" opacity="0.14" />
      <polygon points={`${-w},-34 0,-34 0,${-len}`} fill="#fff" opacity="0.12" />
    </>
  );
}

export default function SunRays({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-110 -110 220 220" className={className} style={{ overflow: "visible" }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-glow" r="0.5">
          <stop offset="0.18" stopColor="#FFE680" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#FCD116" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-halo" r="0.5">
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFF3B0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-blue" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.16" stopColor="#FCD116" />
          <stop offset="0.42" stopColor="#A9BFF2" />
          <stop offset="0.72" stopColor="#3F63C8" />
          <stop offset="1" stopColor="#0038A8" />
        </linearGradient>
        <linearGradient id="hero-red" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-98">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="0.16" stopColor="#FCD116" />
          <stop offset="0.5" stopColor="#F4894A" />
          <stop offset="0.75" stopColor="#E0402E" />
          <stop offset="1" stopColor="#CE1126" />
        </linearGradient>
        <linearGradient id="hero-fine" gradientUnits="userSpaceOnUse" x1="0" y1="-34" x2="0" y2="-82">
          <stop offset="0" stopColor="#FCD116" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-hair" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-104">
          <stop offset="0" stopColor="#FFE680" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE680" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-core" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFBE3" />
          <stop offset="0.35" stopColor="#FFE04D" />
          <stop offset="0.75" stopColor="#F7C200" />
          <stop offset="1" stopColor="#D08E00" />
        </radialGradient>
      </defs>

      {/* glow that breathes behind everything */}
      <g className="sun-breathe">
        <circle r="110" fill="url(#hero-glow)" />
      </g>

      {/* hairline beams, turning slowly the other way */}
      <g className="sun-turn-rev">
        {ring(24, 7.5).map((deg, i) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <polygon className="sun-stretch" style={wave(i * 5, 24)} points="-0.8,-34 0.8,-34 0,-104" fill="url(#hero-hair)" />
          </g>
        ))}
      </g>

      {/* main ring */}
      <g className="sun-turn-fwd">
        {ring(8, 22.5).map((deg, i) => (
          <g key={`f${deg}`} transform={`rotate(${deg})`}>
            <g className="sun-stretch" style={wave(i + 4, 8)}>
              <Blade w={4.5} len={82} fill="url(#hero-fine)" />
            </g>
          </g>
        ))}
        {ring(8).map((deg, i) => (
          <g key={`l${deg}`} transform={`rotate(${deg})`}>
            <g className="sun-stretch" style={wave(i, 8)}>
              <Blade w={11} len={98} fill={i % 2 === 0 ? "url(#hero-blue)" : "url(#hero-red)"} />
            </g>
          </g>
        ))}
      </g>

      {/* the sun itself */}
      <circle r="44" fill="url(#hero-halo)" opacity="0.55" />
      <circle r="33" fill="#FCD116" opacity="0.4" />
      <circle r="31" fill="url(#hero-core)" />
      <circle r="31" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.2" />
      <circle r="24" fill="none" stroke="#B88700" strokeOpacity="0.25" strokeWidth="0.7" />
      <ellipse cx="-10" cy="-12" rx="12" ry="6.5" fill="#fff" opacity="0.38" transform="rotate(-32 -10 -12)" />
    </svg>
  );
}
