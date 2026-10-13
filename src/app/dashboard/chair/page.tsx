import Link from "next/link";
import { Empty, Flash, PageHeader, Stat, StepHeading } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fundSummary } from "@/lib/funds";
import { CATEGORIES } from "@/lib/roles";
import { fmtDate, fmtDateTime, peso } from "@/lib/format";
import { createProject } from "@/actions/projects";
import { publishDoc } from "@/actions/documents";

export const metadata = { title: "Chairperson desk" };
export const maxDuration = 60;

export default async function ChairDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("chairperson");
  const sp = await searchParams;
  const [funds, pendingDocs, projects, log] = await Promise.all([
    fundSummary(),
    sql<Row[]>`
      select 'minutes' as kind, id, title, created_at from minutes where status = 'pending'
      union all select 'report', id, title, created_at from reports where status = 'pending' order by created_at`,
    sql<Row[]>`select id, title, status, budget::float8 as budget from projects where status in ('proposed','approved') order by status desc, id`,
    sql<Row[]>`select a.action, a.detail, a.created_at, u.name from audit_log a left join users u on u.id = a.user_id order by a.created_at desc limit 20`,
  ]);

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <div>
        <PageHeader eyebrow="Chairperson desk" title="Approvals & projects" size="md">Nothing goes public or gets funded until you approve it. Work through the steps below from top to bottom.</PageHeader>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Available fund" value={peso(funds.available)} />
          <Stat label="Set aside" value={peso(funds.committed)} />
          <Stat label="Waiting for you" tone={pendingDocs.length + projects.length > 0 ? "red" : "ink"} value={pendingDocs.length + projects.length} />
          <Stat label="Projects in motion" value={projects.length} />
        </div>
      </div>

      <section>
        <StepHeading n={1} title="Documents waiting for approval" count={pendingDocs.length} />
        {pendingDocs.length === 0 ? <Empty size="sm">Nothing waiting. Minutes and reports appear here when they are submitted.</Empty> : (
          <ul className="space-y-2">{pendingDocs.map((d) => (
            <li key={`${d.kind}${d.id}`} className="card flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0"><b className="font-semibold">{d.title}</b><br /><span className="text-xs text-slate-500">{d.kind === "minutes" ? "Minutes" : "Financial report"} · {fmtDate(d.created_at)}</span></span>
              <span className="flex gap-2">
                <Link href={d.kind === "minutes" ? `/dashboard/minutes/${d.id}` : `/dashboard/reports/${d.id}`} className="btn-outline btn-sm">Review</Link>
                <form action={publishDoc}><input type="hidden" name="kind" value={d.kind} /><input type="hidden" name="id" value={d.id} /><SubmitButton className="btn-red btn-sm" pending="...">Publish</SubmitButton></form>
              </span>
            </li>))}</ul>
        )}
      </section>

      <section>
        <StepHeading n={2} title="Record a project the council agreed on" />
        <form action={createProject} className="card space-y-5 sm:p-6">
          <p className="text-sm text-slate-600">Once the council decides on a project, record it here so the public can follow it. It starts as a proposal; you approve the budget and set the dates in the next step.</p>
          <div><label className="label" htmlFor="title">Project title</label>
            <input id="title" name="title" required maxLength={200} placeholder="Barangay Clean-Up Drive" className="input" /></div>
          <div><label className="label" htmlFor="description">What it is, in a sentence or two</label>
            <textarea id="description" name="description" required rows={3} maxLength={4000} placeholder="A monthly clean-up along the creek, with the youth of every purok." className="input" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" required defaultValue="" className="input">
                <option value="" disabled>Choose one</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="label" htmlFor="budget">Budget in pesos</label>
              <input id="budget" name="budget" required inputMode="decimal" placeholder="15000" className="input" /></div>
          </div>
          <SubmitButton pending="Recording...">Record the project</SubmitButton>
        </form>
      </section>

      <section>
        <StepHeading n={3} title="Approve budgets and schedule" count={projects.length} />
        {projects.length === 0 ? <Empty size="sm">No proposals waiting.</Empty> : (
          <ul className="space-y-2">{projects.map((p) => (
            <li key={p.id}><Link href={`/projects/${p.id}`} className="card flex flex-wrap items-center justify-between gap-2 py-3 card-link">
              <span className="min-w-0"><b className="font-semibold">{p.title}</b><br /><span className="text-xs text-slate-500">{peso(p.budget)}</span></span>
              <span className="text-sm font-semibold text-flag-blue">{p.status === "proposed" ? "Review and approve" : "Schedule it"} →</span></Link></li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Recent activity</h2>
        {log.length === 0 ? <Empty size="sm">No activity yet.</Empty> : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
            {log.map((a, i) => (
              <li key={i} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="min-w-0"><b className="font-semibold text-ink">{a.name ?? "Someone"}</b> {a.action}{a.detail ? <span className="text-slate-500"> · {a.detail}</span> : null}</span>
                <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
