import SunRays from "./SunRays";

/** Two-panel frame for the log in and sign up pages. The blue panel only shows on wide screens. */
export default function AuthShell({ title, intro, points, children }: { title: string; intro: string; points: string[]; children: React.ReactNode }) {
  return (
    <div className="container-x py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-flag-blue p-10 text-white lg:flex">
          <SunRays className="pointer-events-none absolute -bottom-40 -right-40 -z-10 h-[28rem] w-[28rem] opacity-25" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-flag-yellow">Sinag</p>
            <p className="mt-4 font-display text-3xl font-bold leading-tight">Everything the SK decides, spends and does, in the open.</p>
          </div>
          <ul className="mt-10 space-y-3 text-sm text-blue-50">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-flag-yellow">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-10 lg:p-12">
          <h1 className="text-3xl font-bold leading-tight">{title}</h1>
          <p className="mt-2 text-slate-600">{intro}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
