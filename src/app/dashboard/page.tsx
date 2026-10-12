import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, Flash, PageHeader, SectionHeader } from "@/components/ui";
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
      <PageHeader eyebrow="Kabataan desk" title="My activity" size="md" action={<Link href="/ideas/new" className="btn-red">Suggest a project</Link>}>
        Track the ideas you sent, the polls you voted in, and the projects you volunteer for.
      </PageHeader>
      <section>
        <SectionHeader as="h3" title="Your ideas" />
        {ideas.length === 0 ? <Empty>You have not suggested anything yet. What does our barangay need?</Empty> : (
          <ul className="space-y-3">
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
        <div>
          <SectionHeader as="h3" title="Your votes" />
          {votes.length === 0 ? <Empty action={<Link href="/ideas" className="btn-outline btn-sm">See open polls</Link>}>No votes yet.</Empty> : (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {votes.map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{v.title}</span>
                    <span className="block truncate text-xs text-slate-500">{v.poll}</span>
                  </span>
                  <Badge className={v.status === "open" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}>{v.status === "open" ? "Poll open" : "Closed"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <SectionHeader as="h3" title="Projects you are helping" />
          {helping.length === 0 ? <Empty action={<Link href="/projects" className="btn-outline btn-sm">Browse projects</Link>}>You can volunteer from any scheduled project page.</Empty> : (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {helping.map((h) => (
                <li key={h.id}>
                  <Link href={`/projects/${h.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-mist">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-flag-blue">{h.title}</span>
                      <span className="block text-xs text-slate-500">{h.start_date ? fmtDate(h.start_date) : "Date to be announced"}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
