/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { Badge, Empty, Flash, Notice, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import NotesInput from "@/components/NotesInput";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { aiConfigured, aiProviderLabel, visionConfigured } from "@/lib/ai";
import { DOC_STATUS } from "@/lib/roles";
import { fmtDate, todayManila } from "@/lib/format";
import { createMinutes } from "@/actions/documents";

export const metadata = { title: "Minutes assistant" };
export const maxDuration = 60;

export default async function SecretaryDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("secretary", "chairperson");
  const sp = await searchParams;
  const rows = user.role === "chairperson"
    ? await sql<Row[]>`select m.id, m.title, m.status, m.session_date::text as session_date, u.name as author, (select count(*)::int from minutes_photos p where p.minutes_id = m.id) as photos from minutes m join users u on u.id = m.author_id order by m.session_date desc, m.id desc`
    : await sql<Row[]>`select m.id, m.title, m.status, m.session_date::text as session_date, u.name as author, (select count(*)::int from minutes_photos p where p.minutes_id = m.id) as photos from minutes m join users u on u.id = m.author_id where m.author_id = ${user.id} order by m.session_date desc, m.id desc`;
  const canScan = visionConfigured();
  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <section>
        <PageHeader eyebrow="Secretary desk" title="Minutes assistant" size="md">Upload photos of your handwritten notes or type them in. Sinag turns them into clear minutes with attendance, decisions, action items and draft resolutions. You check it, then the Chairperson approves it before it goes public.</PageHeader>
        {!aiConfigured() ? <Notice>AI is not connected yet, so drafts will be simple and photos are not read automatically. Add a free GEMINI_API_KEY to turn on the full assistant.</Notice>
          : !canScan && <Notice>{aiProviderLabel()} cannot read photos, so they are saved with the minutes but not transcribed. Switch AI_PROVIDER to one that reads images to turn this on.</Notice>}
        <form action={createMinutes} className="card space-y-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="title">Meeting title</label><input id="title" name="title" required defaultValue="Regular Session" className="input" /></div>
            <div><label className="label" htmlFor="session_date">Date of meeting</label><input id="session_date" name="session_date" type="date" required defaultValue={todayManila()} className="input" /></div>
          </div>
          <NotesInput canScan={canScan} />
          <SubmitButton pending="Writing the minutes (this can take a minute)...">Turn into minutes</SubmitButton>
        </form>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">{user.role === "chairperson" ? "All minutes" : "Your minutes"}</h2>
        {rows.length === 0 ? <Empty size="sm">No minutes yet.</Empty> : (
          <ul className="space-y-2">
            {rows.map((m) => (
              <li key={m.id}><Link href={`/dashboard/minutes/${m.id}`} className="card flex flex-wrap items-center justify-between gap-2 py-3 card-link">
                <span className="min-w-0"><b className="font-semibold">{m.title}</b><br /><span className="text-xs text-slate-500">{fmtDate(m.session_date)}{user.role === "chairperson" ? ` · ${m.author}` : ""}{m.photos > 0 ? ` · ${m.photos} photo${m.photos === 1 ? "" : "s"} of notes` : ""}</span></span>
                <Badge className={DOC_STATUS[m.status].className}>{DOC_STATUS[m.status].label}</Badge>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
