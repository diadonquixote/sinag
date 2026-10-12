/** PDYN Technologies lockup: app-icon tile + wordmark, in the same style as the PDYN site header. */
export default function PdynLogo({ className = "inline-flex" }: { className?: string }) {
  return (
    <span className={`items-center gap-2 ${className}`} aria-label="PDYN Technologies" role="img">
      <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
        <rect width="100" height="100" rx="26" fill="#0a0a0a" />
        <g fill="none" stroke="#fff" strokeWidth="8.5" strokeLinejoin="miter">
          <path d="M23 38 L43.5 65 L73 35" />
          <path d="M51 33.6 H73 V55.6" />
        </g>
      </svg>
      <span className="flex flex-col leading-none" aria-hidden="true">
        <span className="font-sans text-[22px] font-extrabold tracking-tight text-ink" style={{ fontStretch: "125%" }}>PDYN</span>
        <span className="mt-1 text-[6.5px] font-bold uppercase tracking-[0.38em] text-slate-500">Technologies</span>
      </span>
    </span>
  );
}
