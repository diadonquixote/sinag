/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
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
import { visionConfigured } from "@/lib/ai";

export const maxDuration = 60;

export default async function MinutesEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("secretary", "chairperson");
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [m] = await sql<Row[]>`select id, title, content, data, raw_notes, status, author_id, session_date::text as session_date from minutes where id = ${id}`;
  if (!m || (user.role !== "chairperson" && m.author_id !== user.id)) notFound();
  const data = m.data as MinutesData | null;
  const photos = await sql<Row[]>`select id, page from minutes_photos where minutes_id = ${m.id} order by page`;
  const canScan = visionConfigured();

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
      {photos.length > 0 && (
        <section className="card sm:p-6" aria-labelledby="orig-h">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="orig-h" className="text-lg font-bold">Original notes</h2>
            <p className="text-xs text-slate-500">{photos.length} photo{photos.length === 1 ? "" : "s"} · only you and the Chairperson can see these</p>
          </div>
          <ul className="mt-4 flex flex-wrap gap-3">
            {photos.map((p) => (
              <li key={p.id}>
                <a href={`/api/minutes-photo/${p.id}`} target="_blank" rel="noreferrer" className="group relative block h-32 w-24 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 transition hover:ring-2 hover:ring-flag-blue">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/minutes-photo/${p.id}`} alt={`Page ${p.page} of the handwritten notes`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{p.page}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <DocPanel kind="minutes" doc={m} user={user} rich />
      {m.status !== "published" && (
        <details className="card group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">Fix the raw notes or add photos, then regenerate <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180">⌄</span></summary>
          <form action={regenerateMinutes} className="mt-5 space-y-4">
            <input type="hidden" name="id" value={m.id} /><input type="hidden" name="kind" value="minutes" />
            <NotesInput canScan={canScan} defaultValue={String(m.raw_notes)} firstPage={photos.length + 1} showSample={false} />
            <SubmitButton pending="Regenerating...">Regenerate (replaces the text above)</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
