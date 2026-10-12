import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Flash, ProgressBar } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { categoryStyle, isOfficial, PROJECT_STATUS } from "@/lib/roles";
import { fmtDateRange, fmtDateTime, peso, pct, todayManila } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { fundSummary } from "@/lib/funds";
import type { Proposal } from "@/lib/types";
import { approveProject, postUpdate, scheduleProject, toggleVolunteer, updateProposalBudget } from "@/actions/projects";

export const maxDuration = 60;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();

  const [p] = await sql<Row[]>`
    select p.id, p.title, p.description, p.category, p.status, p.location, p.progress, p.proposal, p.lead_id,
           p.start_date::text as start_date, p.end_date::text as end_date, p.budget::float8 as budget,
           u.name as lead_name, i.id as idea_id,
           (select count(*) from votes v where v.idea_id = i.id)::int as votes,
           coalesce((select sum(t.amount) from transactions t where t.project_id = p.id and t.kind = 'expense' and t.voided_at is null), 0)::float8 as spent
    from projects p left join users u on u.id = p.lead_id left join ideas i on i.id = p.idea_id
    where p.id = ${id} and p.status <> 'cancelled'`;
  if (!p) notFound();

  const user = await currentUser();
  const isChair = user?.role === "chairperson";
  const canUpdate = !!user && ["scheduled", "ongoing", "completed"].includes(p.status) &&
    (user.role === "chairperson" || user.role === "secretary" || user.role === "treasurer" || (user.role === "kagawad" && p.lead_id === user.id));

  const [updates, volunteers, spendLines, officials, funds] = await Promise.all([
    sql<Row[]>`select pu.body, pu.progress, pu.created_at, u.name from project_updates pu left join users u on u.id = pu.author_id where pu.project_id = ${id} order by pu.created_at desc`,
    sql<Row[]>`
      select v.user_id, u.name, u.role, u.phone, u.skills, u.purok, extract(epoch from u.avatar_updated_at)::bigint::text as avatar_v
      from project_volunteers v join users u on u.id = v.user_id where v.project_id = ${id} order by v.created_at`,
    sql<Row[]>`select tx_date::text as tx_date, description, amount::float8 as amount, reference from transactions where project_id = ${id} and kind = 'expense' and voided_at is null order by tx_date desc, id desc`,
    isChair ? sql<Row[]>`select id, name, role from users where role <> 'kabataan' order by name` : Promise.resolve([] as Row[]),
    isChair && p.status === "proposed" ? fundSummary() : Promise.resolve(null),
  ]);

  const st = PROJECT_STATUS[p.status] ?? PROJECT_STATUS.proposed;
  const proposal = p.proposal as Proposal | null;
  const joined = !!user && volunteers.some((v) => v.user_id === user.id);
  // Officials see volunteers' photos and contact details so they can coordinate. The public sees names only.
  const seesContacts = !!user && isOfficial(user.role);
  const photoFor = (v: Row) => (seesContacts || v.user_id === user?.id || isOfficial(v.role as string) ? (v.avatar_v as string | null) : null);

  return (
    <div className="container-x py-10 sm:py-12">
      <Link href="/projects" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>All projects</Link>
      <div className="mt-4"><Flash sp={sp} /></div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={st.className}>{st.label}</Badge>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryStyle(p.category).chip}`}>{p.category}</span>
      </div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{p.title}</h1>
      <p className="mt-2 text-slate-600">{fmtDateRange(p.start_date, p.end_date)}{p.location ? ` · ${p.location}` : ""}</p>
      {p.lead_name && <p className="mt-1 text-sm text-slate-500">Point person: <Link href={`/council/${p.lead_id}`} className="font-semibold text-flag-blue hover:underline">{p.lead_name}</Link></p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="text-lg font-bold">About this project</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{p.description}</p>
            {p.votes > 0 && <p className="mt-3 text-sm text-slate-600">Chosen by kabataan with {p.votes} votes.</p>}
          </section>

          {proposal && (
            <section className="card space-y-4">
              <h2 className="text-lg font-bold">Proposal</h2>
              {proposal.template && <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-900">This is a generic template. The figures will be updated with real quotes.</p>}
              <p className="text-sm text-slate-700"><b>Who benefits:</b> {proposal.beneficiaries} · <b>Duration:</b> {proposal.duration}</p>
              {proposal.objectives?.length > 0 && <div><h3 className="font-bold">Objectives</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">{proposal.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></div>}
              {proposal.activities?.length > 0 && <div><h3 className="font-bold">Activities</h3><ul className="mt-1 space-y-1 text-sm text-slate-700">{proposal.activities.map((a, i) => <li key={i}><b>{a.name}.</b> {a.description}</li>)}</ul></div>}
              {proposal.budget_lines?.length > 0 && (
                <div className="relative overflow-x-auto"><h3 className="font-bold">Budget breakdown</h3>
                  <table className="mt-2 w-full min-w-[420px] text-sm">
                    <thead><tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="py-2">Item</th><th>Qty</th><th>Unit cost</th><th className="text-right">Total</th></tr></thead>
                    <tbody>{proposal.budget_lines.map((b, i) => (
                      <tr key={i} className="border-b border-slate-100"><td className="py-2">{b.item}</td><td>{b.qty} {b.unit}</td><td>{peso(b.unit_cost)}</td><td className="text-right font-semibold tabular-nums">{peso(b.qty * b.unit_cost)}</td></tr>
                    ))}</tbody>
                    <tfoot><tr><td colSpan={3} className="pt-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total</td><td className="pt-2 text-right font-bold tabular-nums text-ink">{peso(proposal.budget_lines.reduce((sum, b) => sum + b.qty * b.unit_cost, 0))}</td></tr></tfoot>
                  </table>
                </div>
              )}
              {proposal.expected_outcomes?.length > 0 && <div><h3 className="font-bold">Expected outcomes</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">{proposal.expected_outcomes.map((o, i) => <li key={i}>{o}</li>)}</ul></div>}
              {proposal.risks?.length > 0 && <div><h3 className="font-bold">Risks</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">{proposal.risks.map((o, i) => <li key={i}>{o}</li>)}</ul></div>}
            </section>
          )}

          <section className="card">
            <h2 className="text-lg font-bold">Updates</h2>
            {updates.length === 0 ? <p className="mt-2 text-sm text-slate-500">No updates yet.</p> : (
              <ol className="mt-4 space-y-4 border-l-2 border-flag-yellow pl-4">
                {updates.map((u, i) => (
                  <li key={i}>
                    <p className="text-xs text-slate-500">{fmtDateTime(u.created_at)}{u.name ? ` · ${u.name}` : ""}{u.progress != null ? ` · ${u.progress}% done` : ""}</p>
                    <p className="mt-1 whitespace-pre-line text-slate-700">{u.body}</p>
                  </li>
                ))}
              </ol>
            )}
            {canUpdate && (
              <form action={postUpdate} className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                <input type="hidden" name="project_id" value={p.id} />
                <div><label className="label" htmlFor="body">Post an update</label><textarea id="body" name="body" rows={3} required className="input" placeholder="What happened? Short and plain is best." /></div>
                <div className="flex flex-wrap items-end gap-4">
                  <div><label className="label" htmlFor="progress">Progress (%)</label><input id="progress" name="progress" type="number" min={0} max={100} defaultValue={p.progress} className="input w-28" /></div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="polish" /> Polish my wording with AI</label>
                  <SubmitButton pending="Posting...">Post update</SubmitButton>
                </div>
              </form>
            )}
          </section>
        </div>

        <aside className="order-first min-w-0 space-y-6 lg:order-none">
          <section className="card space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Budget</p>
              <p className="mt-1 font-display text-3xl font-bold leading-none text-ink tabular-nums">{peso(p.budget)}</p>
            </div>
            <ProgressBar value={pct(p.spent, p.budget)} label={`${peso(p.spent)} spent`} />
            {["scheduled", "ongoing", "completed"].includes(p.status) && <ProgressBar value={p.progress} label="Work done" />}
            {spendLines.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spending</p>
                <ul className="space-y-2 text-sm">
                  {spendLines.map((s, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 text-slate-600">{s.description}{s.reference ? <span className="block text-xs text-slate-400">{s.reference}</span> : null}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{peso(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/funds" className="block border-t border-slate-100 pt-3 text-xs font-semibold text-flag-blue hover:underline">See the full ledger →</Link>
          </section>

          {["scheduled", "ongoing"].includes(p.status) && (
            <section className="card">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">Volunteers</h2>
                <span className="text-sm font-semibold text-slate-500">{volunteers.length}</span>
              </div>
              {volunteers.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {volunteers.map((v) => (
                    <li key={v.user_id} className="flex items-center gap-2 rounded-full bg-mist py-1 pl-1 pr-3 text-xs font-medium text-ink ring-1 ring-inset ring-slate-200">
                      <Avatar id={v.user_id} name={v.name} v={photoFor(v)} size="xs" tone="light" />
                      {v.name}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500">Be the first to help.</p>}
              {seesContacts && volunteers.length > 0 && (
                <details className="group mt-4 rounded-xl border border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    Contact details <span className="text-xs font-normal text-slate-400">officials only <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-180">⌄</span></span>
                  </summary>
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
                    {volunteers.map((v) => (
                      <li key={v.user_id} className="px-3 py-2.5">
                        <p className="font-semibold text-ink">{v.name}</p>
                        <p className="text-xs text-slate-500">{[v.purok, v.skills].filter(Boolean).join(" · ") || "No details yet"}</p>
                        {v.phone ? <a href={`tel:${String(v.phone).replace(/\s/g, "")}`} className="text-xs font-semibold text-flag-blue hover:underline">{v.phone}</a> : <p className="text-xs text-slate-400">No mobile number</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {user ? (
                <form action={toggleVolunteer} className="mt-4"><input type="hidden" name="project_id" value={p.id} />
                  <SubmitButton className={`${joined ? "btn-outline" : "btn-yellow"} w-full`}>{joined ? "Leave the volunteer list" : "I want to help"}</SubmitButton></form>
              ) : <Link href="/login" className="btn-yellow mt-4 w-full">Log in to volunteer</Link>}
            </section>
          )}

          {isChair && p.status === "proposed" && funds && (
            <section className="card space-y-3 border-flag-blue/30 ring-4 ring-flag-blue/5">
              <h2 className="text-lg font-bold">Chairperson: review</h2>
              <p className="text-sm text-slate-600">Available fund: <b>{peso(funds.available)}</b></p>
              <form action={updateProposalBudget} className="flex gap-2"><label htmlFor="proposal_budget" className="sr-only">Budget</label><input type="hidden" name="project_id" value={p.id} />
                <input id="proposal_budget" name="budget" defaultValue={p.budget} inputMode="decimal" className="input" /><SubmitButton className="btn-outline">Set</SubmitButton></form>
              <form action={approveProject}><input type="hidden" name="project_id" value={p.id} /><SubmitButton className="btn-primary w-full">Approve and set aside budget</SubmitButton></form>
            </section>
          )}

          {isChair && ["approved", "scheduled"].includes(p.status) && (
            <section className="card">
              <h2 className="text-lg font-bold">{p.status === "approved" ? "Chairperson: schedule" : "Reschedule"}</h2>
              <form action={scheduleProject} className="mt-3 space-y-3">
                <input type="hidden" name="project_id" value={p.id} />
                <div><label className="label" htmlFor="start_date">Start</label><input id="start_date" name="start_date" type="date" required min={todayManila()} defaultValue={p.start_date ?? ""} className="input" /></div>
                <div><label className="label" htmlFor="end_date">End (optional)</label><input id="end_date" name="end_date" type="date" defaultValue={p.end_date ?? ""} className="input" /></div>
                <div><label className="label" htmlFor="location">Location</label><input id="location" name="location" required defaultValue={p.location ?? ""} className="input" /></div>
                <div><label className="label" htmlFor="lead_id">Point person</label>
                  <select id="lead_id" name="lead_id" required defaultValue={p.lead_id ?? ""} className="input"><option value="" disabled>Choose...</option>{officials.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allow_overlap" /> Allow overlap with another event</label>
                <SubmitButton className="btn-primary w-full">Save schedule</SubmitButton>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
