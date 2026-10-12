import Link from "next/link";
import { Badge, Empty, Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import NotesInput from "@/components/NotesInput";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { DOC_STATUS } from "@/lib/roles";
import { fmtDate, todayManila } from "@/lib/format";
import { createMinutes } from "@/actions/documents";

export const metadata = { title: "Minutes assistant" };
export const maxDuration = 60;

export default async function SecretaryDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("secretary", "chairperson");
  const sp = await searchParams;
  const rows = user.role === "chairperson"
    ? await sql<Row[]>`select m.id, m.title, m.status, m.session_date::text as session_date, u.name as author from minutes m join users u on u.id = m.author_id order by m.session_date desc, m.id desc`
    : await sql<Row[]>`select m.id, m.title, m.status, m.session_date::text as session_date, u.name as author from minutes m join users u on u.id = m.author_id where m.author_id = ${user.id} order by m.session_date desc, m.id desc`;
  const canScan = aiConfigured() && !!process.env.NEBIUS_VISION_MODEL;
  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <section>
        <h1 className="text-2xl font-bold">Minutes assistant</h1>
        <p className="mt-1 max-w-2xl text-slate-600">Paste your raw notes. Sinag turns them into clear minutes with attendance, decisions, action items and draft resolutions. You check it, then the Chairperson approves it before it goes public.</p>
        {!aiConfigured() && <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-900">AI is not connected, so drafts will be simple. Add NEBIUS_API_KEY to enable the full assistant.</p>}
        <form action={createMinutes} className="card mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="title">Meeting title</label><input id="title" name="title" required defaultValue="Regular Session" className="input" /></div>
            <div><label className="label" htmlFor="session_date">Date of meeting</label><input id="session_date" name="session_date" type="date" required defaultValue={todayManila()} className="input" /></div>
          </div>
          <NotesInput canScan={canScan} />
          <SubmitButton pending="Writing the minutes (this can take a minute)...">Turn into minutes</SubmitButton>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-bold">{user.role === "chairperson" ? "All minutes" : "Your minutes"}</h2>
        {rows.length === 0 ? <div className="mt-3"><Empty>No minutes yet.</Empty></div> : (
          <ul className="mt-3 space-y-2">
            {rows.map((m) => (
              <li key={m.id}><Link href={`/dashboard/minutes/${m.id}`} className="card flex flex-wrap items-center justify-between gap-2 py-3 hover:border-flag-blue/40">
                <span><b>{m.title}</b><br /><span className="text-sm text-slate-500">{fmtDate(m.session_date)}{user.role === "chairperson" ? ` · ${m.author}` : ""}</span></span>
                <Badge className={DOC_STATUS[m.status].className}>{DOC_STATUS[m.status].label}</Badge>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
