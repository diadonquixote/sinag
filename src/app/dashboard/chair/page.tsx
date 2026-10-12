import Link from "next/link";
import { Empty, Flash, Stat } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fundSummary } from "@/lib/funds";
import { fmtDate, fmtDateTime, peso, todayManila } from "@/lib/format";
import { closePoll, createPoll, draftProposal, reviewIdea } from "@/actions/ideas";
import { publishDoc } from "@/actions/documents";

export const metadata = { title: "Chairperson desk" };
export const maxDuration = 60;

export default async function ChairDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("chairperson");
  const sp = await searchParams;
  const [funds, pendingDocs, pendingIdeas, approved, openPolls, won, projects, log] = await Promise.all([
    fundSummary(),
    sql<Row[]>`
      select 'minutes' as kind, id, title, created_at from minutes where status = 'pending'
      union all select 'report', id, title, created_at from reports where status = 'pending' order by created_at`,
    sql<Row[]>`select i.id, i.title, i.description, i.category, i.est_budget::float8 as est_budget, u.name as author from ideas i join users u on u.id = i.author_id where i.status = 'pending' order by i.created_at`,
    sql<Row[]>`select id, title, category from ideas where status = 'approved' order by created_at`,
    sql<Row[]>`select id, title, closes_at, max_votes, (select count(distinct user_id) from votes v where v.poll_id = polls.id)::int as voters from polls where status = 'open' order by closes_at`,
    sql<Row[]>`select i.id, i.title, (select count(*) from votes v where v.idea_id = i.id)::int as votes from ideas i where i.status = 'selected' order by i.created_at`,
    sql<Row[]>`select id, title, status, budget::float8 as budget from projects where status in ('proposed','approved') order by status desc, id`,
    sql<Row[]>`select a.action, a.detail, a.created_at, u.name from audit_log a left join users u on u.id = a.user_id order by a.created_at desc limit 20`,
  ]);
  const inTwoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <div>
        <h1 className="text-2xl font-bold">Chairperson desk</h1>
        <p className="mt-1 text-slate-600">Nothing goes public or gets funded until you approve it.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Available fund" value={peso(funds.available)} /><Stat label="Set aside" value={peso(funds.committed)} />
          <Stat label="Waiting for you" value={pendingDocs.length + pendingIdeas.length + projects.length + won.length} /><Stat label="Open polls" value={openPolls.length} />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold">1. Documents waiting for approval</h2>
        {pendingDocs.length === 0 ? <div className="mt-3"><Empty>Nothing waiting.</Empty></div> : (
          <ul className="mt-3 space-y-2">{pendingDocs.map((d) => (
            <li key={`${d.kind}${d.id}`} className="card flex flex-wrap items-center justify-between gap-3 py-3">
              <span><b>{d.title}</b><br /><span className="text-sm text-slate-500">{d.kind === "minutes" ? "Minutes" : "Financial report"} · {fmtDate(d.created_at)}</span></span>
              <span className="flex gap-2">
                <Link href={d.kind === "minutes" ? `/dashboard/minutes/${d.id}` : `/dashboard/reports/${d.id}`} className="btn-outline btn-sm">Review</Link>
                <form action={publishDoc}><input type="hidden" name="kind" value={d.kind} /><input type="hidden" name="id" value={d.id} /><SubmitButton className="btn-red btn-sm" pending="...">Publish</SubmitButton></form>
              </span>
            </li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">2. New ideas to review</h2>
        {pendingIdeas.length === 0 ? <div className="mt-3"><Empty>No new ideas.</Empty></div> : (
          <ul className="mt-3 space-y-3">{pendingIdeas.map((i) => (
            <li key={i.id} className="card">
              <b>{i.title}</b> <span className="text-sm text-slate-500">· {i.category} · by {i.author} · est. {peso(i.est_budget)}</span>
              <p className="mt-1 text-sm text-slate-700">{i.description}</p>
              <form action={reviewIdea} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="idea_id" value={i.id} />
                <input name="note" placeholder="Note to the author (required if declining)" aria-label="Note" className="input min-w-0 flex-1" />
                <button name="decision" value="approve" className="btn-primary btn-sm">Approve for polling</button>
                <button name="decision" value="reject" className="btn-outline btn-sm text-flag-red">Decline</button>
              </form>
            </li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">3. Open a poll</h2>
        {approved.length < 2 ? <div className="mt-3"><Empty>You need at least two approved ideas to open a poll.</Empty></div> : (
          <form action={createPoll} className="card mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1"><label className="label" htmlFor="title">Poll title</label><input id="title" name="title" required defaultValue="What should we do next?" className="input" /></div>
              <div><label className="label" htmlFor="closes_on">Voting closes on</label><input id="closes_on" name="closes_on" type="date" required min={todayManila()} defaultValue={inTwoWeeks} className="input" /></div>
              <div><label className="label" htmlFor="max_votes">Votes per person</label><input id="max_votes" name="max_votes" type="number" min={1} max={20} defaultValue={3} className="input" /></div>
            </div>
            <fieldset><legend className="label">Ideas in the poll</legend>
              <div className="grid gap-2 sm:grid-cols-2">{approved.map((i) => (
                <label key={i.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5 text-sm"><input type="checkbox" name="idea_ids" value={i.id} className="mt-1" /> <span><b>{i.title}</b> <span className="text-slate-500">· {i.category}</span></span></label>))}
              </div></fieldset>
            <SubmitButton pending="Opening...">Open poll</SubmitButton>
          </form>
        )}
        {openPolls.length > 0 && (
          <ul className="mt-4 space-y-2">{openPolls.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 py-3">
              <span><b>{p.title}</b><br /><span className="text-sm text-slate-500">Closes {fmtDate(p.closes_at)} · {p.voters} voters</span></span>
              <form action={closePoll} className="flex items-center gap-2"><input type="hidden" name="poll_id" value={p.id} />
                <label className="text-sm" htmlFor={`w${p.id}`}>Winners</label><input id={`w${p.id}`} name="winners" type="number" min={1} max={10} defaultValue={1} className="input w-16 py-1.5" />
                <SubmitButton className="btn-yellow btn-sm" pending="...">Close poll</SubmitButton></form>
            </li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">4. Turn winners into proposals</h2>
        {won.length === 0 ? <div className="mt-3"><Empty>No poll winners waiting.</Empty></div> : (
          <ul className="mt-3 space-y-2">{won.map((i) => (
            <li key={i.id} className="card flex flex-wrap items-center justify-between gap-3 py-3">
              <span><b>{i.title}</b> <span className="text-sm text-slate-500">· {i.votes} votes</span></span>
              <form action={draftProposal}><input type="hidden" name="idea_id" value={i.id} /><SubmitButton pending="Drafting proposal (up to a minute)...">Draft proposal with budget</SubmitButton></form>
            </li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">5. Approve budgets and schedule</h2>
        {projects.length === 0 ? <div className="mt-3"><Empty>No proposals waiting.</Empty></div> : (
          <ul className="mt-3 space-y-2">{projects.map((p) => (
            <li key={p.id}><Link href={`/projects/${p.id}`} className="card flex flex-wrap items-center justify-between gap-2 py-3 hover:border-flag-blue/40">
              <span><b>{p.title}</b><br /><span className="text-sm text-slate-500">{peso(p.budget)}</span></span>
              <span className="text-sm font-semibold text-flag-blue">{p.status === "proposed" ? "Review and approve" : "Schedule it"} →</span></Link></li>))}</ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Recent activity</h2>
        <ul className="card mt-3 divide-y divide-slate-100 text-sm">
          {log.map((a, i) => <li key={i} className="py-2"><b>{a.name ?? "Someone"}</b> {a.action}{a.detail ? <span className="text-slate-500"> · {a.detail}</span> : null}<span className="float-right text-xs text-slate-400">{fmtDateTime(a.created_at)}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
