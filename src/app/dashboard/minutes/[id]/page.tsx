import Link from "next/link";
import { notFound } from "next/navigation";
import DocPanel from "@/components/DocPanel";
import NotesInput from "@/components/NotesInput";
import SubmitButton from "@/components/SubmitButton";
import { Flash } from "@/components/ui";
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
      <Link href="/dashboard/secretary" className="text-sm font-semibold text-flag-blue">← All minutes</Link>
      <Flash sp={sp} />
      <h1 className="text-2xl font-bold">{m.title} <span className="text-base font-normal text-slate-500">· {fmtDate(m.session_date)}</span></h1>
      {data?.budget_check && data.budget_check.total > 0 && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${data.budget_check.over ? "border-red-200 bg-red-50 text-flag-red" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          Budget items in these minutes add up to <b>{peso(data.budget_check.total)}</b>. {data.budget_check.over ? `That is more than the ${peso(data.budget_check.available)} available at the time of drafting.` : `The fund can cover it (${peso(data.budget_check.available)} available at the time of drafting).`}
        </div>
      )}
      {data?.used_ai === false && <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-900">This is a simple draft (AI was unavailable). Please review it carefully.</p>}
      <DocPanel kind="minutes" doc={m} user={user} rich />
      {m.status !== "published" && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">Fix the raw notes and regenerate</summary>
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
