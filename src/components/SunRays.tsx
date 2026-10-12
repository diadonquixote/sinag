/** The eight rays of the sun from the flag, as a soft decorative background. */
export default function SunRays({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden="true" focusable="false">
      <g fill="#FCD116">
        {rays.map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <polygon points="-5,-30 5,-30 0,-98" />
            <polygon points="-3,-30 3,-30 22,-92 12,-94" opacity="0.55" transform="rotate(-11)" />
            <polygon points="-3,-30 3,-30 -12,-94 -22,-92" opacity="0.55" transform="rotate(11)" />
          </g>
        ))}
        <circle r="24" />
      </g>
    </svg>
  );
}
