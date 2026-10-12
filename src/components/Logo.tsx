import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Sinag home">
      <svg viewBox="-100 -100 200 200" className="h-8 w-8" aria-hidden="true">
        <g fill="#FCD116">
          {Array.from({ length: 8 }, (_, i) => (
            <polygon key={i} points="-9,-34 9,-34 0,-98" transform={`rotate(${i * 45})`} />
          ))}
          <circle r="28" />
        </g>
      </svg>
      <span className={`font-display text-2xl font-bold tracking-tight ${light ? "text-white" : "text-flag-blue"}`}>Sinag</span>
    </Link>
  );
}
