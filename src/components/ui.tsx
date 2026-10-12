import Link from "next/link";
import { dateTile, first } from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

export function Flash({ sp }: { sp: SP }) {
  const ok = first(sp.ok);
  const err = first(sp.err);
  if (!ok && !err) return null;
  return (
    <div
      role={err ? "alert" : "status"}
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        err ? "border-red-200 bg-red-50 text-flag-red" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${err ? "bg-flag-red" : "bg-emerald-600"}`}>{err ? "!" : "✓"}</span>
      <span>{err ?? ok}</span>
    </div>
  );
}

/** A yellow note for things the reader should know before acting. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="mb-5 flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
      <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
      <div>{children}</div>
    </div>
  );
}

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{label}</span><span>{v}%</span></div>}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-flag-blue" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

/** Page title block. `action` sits on the right on wide screens and drops below the text on phones. */
export function PageHeader({
  eyebrow,
  title,
  children,
  action,
  size = "lg",
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`mt-1.5 font-bold leading-tight text-ink ${size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>{title}</h1>
        {children && <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">{children}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Heading for a section inside a page, with an optional link or button on the right. */
export function SectionHeader({
  eyebrow,
  title,
  children,
  action,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className={`font-bold leading-tight text-ink ${Tag === "h2" ? "mt-1 text-2xl sm:text-3xl" : "text-xl"}`}>{title}</Tag>
        {children && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Numbered step heading for a workflow page, with a count of items waiting. */
export function StepHeading({ n, title, count, busyLabel = "waiting" }: { n: number; title: string; count?: number; busyLabel?: string }) {
  const busy = (count ?? 0) > 0;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${busy ? "bg-flag-blue text-white" : "bg-slate-100 text-slate-500"}`}>{n}</span>
      <h2 className="text-xl font-bold leading-tight text-ink">{title}</h2>
      {count !== undefined && (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${busy ? "bg-red-50 text-flag-red ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"}`}>
          {busy ? `${count} ${busyLabel}` : "All clear"}
        </span>
      )}
    </div>
  );
}

/** A row of filter pills. Scrolls sideways on phones instead of wrapping into a tall block. */
export function FilterChips({ label, items, current, href }: { label: string; items: [string, string][]; current: string; href: (value: string) => string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:block">{label}</span>
      <nav aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map(([value, text]) => {
          const active = value === current;
          return (
            <Link
              key={value || "all"}
              href={href(value)}
              aria-current={active ? "true" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
                active ? "bg-flag-blue text-white ring-flag-blue" : "bg-white text-slate-600 ring-slate-200 hover:text-flag-blue hover:ring-flag-blue/50"
              }`}
            >
              {text}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Calendar-style month and day square. */
export function DateTile({ value }: { value: string | null | undefined }) {
  const t = dateTile(value);
  if (!t) return null;
  return (
    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-mist ring-1 ring-inset ring-slate-200">
      <span className="text-[10px] font-bold tracking-wider text-flag-red">{t.month}</span>
      <span className="font-display text-xl font-bold leading-none text-ink">{t.day}</span>
    </span>
  );
}

/** Small link with an arrow, for "see all" style actions next to a heading. */
export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-flag-blue hover:text-[#002f8f]">
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

export function Empty({ children, action, size = "md" }: { children: React.ReactNode; action?: React.ReactNode; size?: "md" | "sm" }) {
  if (size === "sm") return <p className="rounded-xl border border-dashed border-slate-200 bg-mist/60 px-4 py-3 text-sm text-slate-500">{children}</p>;
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-mist/70 px-5 py-8 text-center text-sm text-slate-600">
      <p className="mx-auto max-w-md">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

type Tone = "blue" | "red" | "ink" | "green";
const TONE: Record<Tone, string> = { blue: "text-flag-blue", red: "text-flag-red", ink: "text-ink", green: "text-emerald-700" };

/** A number with a label above it. Used for fund totals and counts across the app. */
export function Stat({ label, value, tone = "blue", hint }: { label: string; value: string | number; tone?: Tone; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold leading-none tabular-nums sm:text-[28px] ${TONE[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-semibold text-flag-blue underline-offset-4 hover:underline">{children}</Link>;
}
