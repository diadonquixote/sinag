import Link from "next/link";
import { notFound } from "next/navigation";
import DocPanel from "@/components/DocPanel";
import NotesInput from "@/components/NotesInput";
import SubmitButton from "@/components/SubmitButton";
import { Flash, Notice } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fmtDate, peso } from "@/lib/format";
import type { MinutesData } from "@/lib/types";
import { regenerateMinutes } from "@/actions/documents";

export const maxDuration = 60;

export default async function MinutesEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("secretary", "chairperson");
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [m] = await sql<Row[]>`select id, title, content, data, raw_notes, status, author_id, session_date::text as session_date from minutes where id = ${id}`;
  if (!m || (user.role !== "chairperson" && m.author_id !== user.id)) notFound();
  const data = m.data as MinutesData | null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/secretary" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>All minutes</Link>
      <Flash sp={sp} />
      <div><p className="eyebrow">Minutes</p><h1 className="mt-1.5 text-3xl font-bold leading-tight">{m.title}</h1><p className="mt-1 text-sm text-slate-500">Meeting held {fmtDate(m.session_date)}</p></div>
      {data?.budget_check && data.budget_check.total > 0 && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${data.budget_check.over ? "border-red-200 bg-red-50 text-flag-red" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          Budget items in these minutes add up to <b>{peso(data.budget_check.total)}</b>. {data.budget_check.over ? `That is more than the ${peso(data.budget_check.available)} available at the time of drafting.` : `The fund can cover it (${peso(data.budget_check.available)} available at the time of drafting).`}
        </div>
      )}
      {data?.used_ai === false && <Notice>This is a simple draft because AI was unavailable. Please review it carefully.</Notice>}
      <DocPanel kind="minutes" doc={m} user={user} rich />
      {m.status !== "published" && (
        <details className="card group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">Fix the raw notes and regenerate <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180">⌄</span></summary>
          <form action={regenerateMinutes} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={m.id} /><input type="hidden" name="kind" value="minutes" />
            <NotesInput canScan={false} defaultValue={String(m.raw_notes)} />
            <SubmitButton pending="Regenerating...">Regenerate (replaces the text above)</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
