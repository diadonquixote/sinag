import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, Flash } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { IDEA_STATUS, ROLE_HOME } from "@/lib/roles";
import { fmtDate, peso } from "@/lib/format";

export const metadata = { title: "My activity" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole();
  if (user.role !== "kabataan") redirect(ROLE_HOME[user.role]);
  const sp = await searchParams;
  const [ideas, votes, helping] = await Promise.all([
    sql<Row[]>`select id, title, status, review_note, est_budget::float8 as est_budget, created_at from ideas where author_id = ${user.id} order by created_at desc`,
    sql<Row[]>`select i.title, p.title as poll, p.status from votes v join ideas i on i.id = v.idea_id join polls p on p.id = v.poll_id where v.user_id = ${user.id} order by v.created_at desc limit 10`,
    sql<Row[]>`select p.id, p.title, p.start_date::text as start_date from project_volunteers v join projects p on p.id = v.project_id where v.user_id = ${user.id} order by p.start_date nulls last`,
  ]);
  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Your ideas</h1>
          <Link href="/ideas/new" className="btn-red">Suggest a project</Link>
        </div>
        {ideas.length === 0 ? <div className="mt-4"><Empty>You have not suggested anything yet. What does our barangay need?</Empty></div> : (
          <ul className="mt-4 space-y-3">
            {ideas.map((i) => {
              const st = IDEA_STATUS[i.status];
              return (
                <li key={i.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b>{i.title}</b><Badge className={st.className}>{st.label}</Badge></div>
                  <p className="mt-1 text-xs text-slate-500">Sent {fmtDate(i.created_at)} · est. {peso(i.est_budget)}</p>
                  {i.review_note && <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-sm"><b>SK note:</b> {i.review_note}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="grid gap-8 md:grid-cols-2">
        <div><h2 className="text-xl font-bold">Your votes</h2>
          {votes.length === 0 ? <p className="mt-2 text-sm text-slate-500">No votes yet. <Link href="/ideas" className="font-semibold text-flag-blue">See open polls</Link>.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{votes.map((v, i) => <li key={i} className="card py-3"><b>{v.title}</b><br /><span className="text-slate-500">{v.poll} · {v.status === "open" ? "poll open" : "poll closed"}</span></li>)}</ul>)}
        </div>
        <div><h2 className="text-xl font-bold">Projects you are helping</h2>
          {helping.length === 0 ? <p className="mt-2 text-sm text-slate-500">You can volunteer from any scheduled project page.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{helping.map((h) => <li key={h.id} className="card py-3"><Link href={`/projects/${h.id}`} className="font-bold text-flag-blue">{h.title}</Link><br /><span className="text-slate-500">{h.start_date ? fmtDate(h.start_date) : "Date to be announced"}</span></li>)}</ul>)}
        </div>
      </section>
    </div>
  );
}
