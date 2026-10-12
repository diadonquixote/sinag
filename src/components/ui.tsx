import Link from "next/link";
import { first } from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

export function Flash({ sp }: { sp: SP }) {
  const ok = first(sp.ok);
  const err = first(sp.err);
  if (!ok && !err) return null;
  return (
    <div
      role={err ? "alert" : "status"}
      className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
        err ? "border-red-200 bg-red-50 text-flag-red" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {err ?? ok}
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

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 border-b border-slate-200 pb-6">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-slate-600">{children}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-mist px-5 py-10 text-center text-sm text-slate-600">{children}</div>;
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold text-flag-blue">{value}</p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-semibold text-flag-blue underline-offset-4 hover:underline">{children}</Link>;
}
