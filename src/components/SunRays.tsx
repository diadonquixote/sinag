/**
 * The hero sun: the Sinag mark at poster scale and in motion. Two rings of rays turn in opposite
 * directions while each ray lengthens and shortens in a wave that travels around the sun, so it
 * seems to flare and breathe. Rays run from gold into the flag's blue and red. Decorative only;
 * the motion is switched off for people who prefer reduced motion (see globals.css).
 */
export default function SunRays({ className = "" }: { className?: string }) {
  const ring = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i);
  const STRETCH_SECS = 5;
  // Each ray starts a little later than the one before it, so the stretch ripples around the circle.
  const wave = (i: number, n: number) => ({ animationDelay: `${-(i / n) * STRETCH_SECS}s` });

  return (
    <svg viewBox="-100 -100 200 200" className={className} style={{ overflow: "visible" }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-glow" r="0.5">
          <stop offset="0.2" stopColor="#FFE680" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#FCD116" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FCD116" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-halo" r="0.5">
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.9" />
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
          <stop offset="0" stopColor="#FFE680" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE680" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-core" cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFF8D0" />
          <stop offset="0.4" stopColor="#FCD116" />
          <stop offset="1" stopColor="#D99A00" />
        </radialGradient>
      </defs>

      {/* glow that breathes behind everything */}
      <g className="sun-breathe">
        <circle r="100" fill="url(#hero-glow)" />
      </g>

      {/* outer ring: 24 hairline beams, turning slowly the other way */}
      <g className="sun-turn-rev">
        {ring(24, 7.5).map((deg, i) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <polygon className="sun-stretch" style={wave(i * 5, 24)} points="-0.9,-30 0.9,-30 0,-99" fill="url(#hero-hair)" />
          </g>
        ))}
      </g>

      {/* main ring: 8 long rays into flag blue and red, with 8 fine gold rays between */}
      <g className="sun-turn-fwd">
        {ring(8, 22.5).map((deg, i) => (
          <g key={`f${deg}`} transform={`rotate(${deg})`}>
            <polygon className="sun-stretch" style={wave(i + 4, 8)} points="-4,-34 4,-34 0,-84" fill="url(#hero-fine)" />
          </g>
        ))}
        {ring(8).map((deg, i) => (
          <g key={`l${deg}`} transform={`rotate(${deg})`}>
            <polygon
              className="sun-stretch"
              style={wave(i, 8)}
              points="-11,-34 11,-34 0,-98"
              fill={i % 2 === 0 ? "url(#hero-blue)" : "url(#hero-red)"}
            />
          </g>
        ))}
      </g>

      {/* the sun itself */}
      <circle r="42" fill="url(#hero-halo)" opacity="0.5" />
      <circle r="32" fill="#FCD116" opacity="0.35" />
      <circle r="30" fill="url(#hero-core)" />
      <circle r="30" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.2" />
      <circle r="23" fill="none" stroke="#B88700" strokeOpacity="0.3" strokeWidth="0.8" />
      <ellipse cx="-9" cy="-11" rx="11" ry="6" fill="#fff" opacity="0.35" transform="rotate(-30 -9 -11)" />
    </svg>
  );
}
