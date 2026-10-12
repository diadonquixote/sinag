import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { Badge, ProgressBar } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { categoryStyle, PROJECT_STATUS, ROLE_LABEL, type Role } from "@/lib/roles";
import { fmtDate, fmtDateRange, timeAgo } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return { title: "SK council" };
  const [u] = await sql<Row[]>`select name from users where id = ${id} and role <> 'kabataan'`;
  return { title: u ? `${u.name} · SK council` : "SK council" };
}

/** Public profile of an SK official: credentials, contributions they wrote, and what Sinag has on record. */
export default async function OfficialProfile({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [p] = await sql<Row[]>`
    select id, name, role, committee, bio, term, credentials, contributions,
           extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users where id = ${id} and role <> 'kabataan'`;
  if (!p) notFound();

  const [projects, [counts], activity, council] = await Promise.all([
    sql<Row[]>`
      select id, title, category, status, progress, start_date::text as start_date, end_date::text as end_date
      from projects where lead_id = ${id} and status in ('scheduled', 'ongoing', 'completed')
      order by case status when 'ongoing' then 0 when 'scheduled' then 1 else 2 end, start_date desc`,
    sql<Row[]>`
      select
        (select count(*) from project_updates where author_id = ${id})::int as updates,
        (select count(*) from minutes where author_id = ${id} and status = 'published')::int as minutes,
        (select count(*) from reports where author_id = ${id} and status = 'published')::int as reports,
        (select count(*) from transactions where created_by = ${id} and voided_at is null)::int as entries,
        ((select count(*) from minutes where published_by = ${id}) + (select count(*) from reports where published_by = ${id}))::int as approved_docs,
        (select count(*) from audit_log where user_id = ${id} and action = 'opened poll')::int as polls,
        (select count(*) from audit_log where user_id = ${id} and action in ('approved idea for polling', 'declined idea'))::int as ideas,
        (select count(*) from audit_log where user_id = ${id} and action = 'approved project and budget')::int as funded`,
    sql<Row[]>`
      select * from (
        select 'update' as kind, pu.created_at as at, pr.title, pr.id as project_id, null::int as doc_id, pu.body as detail
          from project_updates pu join projects pr on pr.id = pu.project_id where pu.author_id = ${id}
        union all
        select 'minutes', m.published_at, m.title, null, m.id, null from minutes m where m.author_id = ${id} and m.status = 'published'
        union all
        select 'report', r.published_at, r.title, null, r.id, null from reports r where r.author_id = ${id} and r.status = 'published'
      ) a where at is not null order by at desc limit 6`,
    sql<Row[]>`
      select id, name, role, extract(epoch from avatar_updated_at)::bigint::text as avatar_v from users
      where role <> 'kabataan' and id <> ${id}
      order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`,
  ]);

  const lines = (text: string | null) => (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const credentials = lines(p.credentials);
  const contributions = lines(p.contributions);
  const record: [string, number][] = (
    [
      ["Projects led", projects.length],
      ["Project updates posted", counts.updates],
      ["Minutes published", counts.minutes],
      ["Financial reports published", counts.reports],
      ["Ledger entries recorded", counts.entries],
      ["Documents approved", counts.approved_docs],
      ["Projects funded", counts.funded],
      ["Polls opened", counts.polls],
      ["Ideas reviewed", counts.ideas],
    ] as [string, number][]
  ).filter(([, n]) => n > 0);

  return (
    <div className="container-x py-10 sm:py-12">
      <Link href="/council" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue">
        <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>SK council
      </Link>

      {/* ---------------------------------------------------------------- who */}
      <section className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-flag-blue via-[#2a55c0] to-flag-red sm:h-28" aria-hidden="true" />
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Avatar id={p.id} name={p.name} v={p.avatar_v} size="xl" className="-mt-14 !h-28 !w-28 text-3xl ring-4 ring-white shadow-md" />
            <div className="min-w-0 sm:pt-5">
              <p className="eyebrow">{ROLE_LABEL[p.role as Role]}</p>
              <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {p.committee && <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-flag-blue ring-1 ring-inset ring-slate-200">{p.committee}</span>}
                {p.term && <span>Term {p.term}</span>}
              </div>
            </div>
          </div>
          {p.bio && <p className="mt-5 max-w-3xl leading-relaxed text-slate-700">{p.bio}</p>}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* ---------------------------------------------------------------- credentials */}
          <section className="card sm:p-6" aria-labelledby="cred-h">
            <h2 id="cred-h" className="text-xl font-bold">Credentials</h2>
            {credentials.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{p.name.split(" ")[0]} has not posted credentials yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {credentials.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-flag-yellow/25 text-xs text-yellow-800">★</span>
                    <span className="leading-relaxed text-slate-700">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------------------------------------------------------------- contributions */}
          <section className="card sm:p-6" aria-labelledby="contrib-h">
            <h2 id="contrib-h" className="text-xl font-bold">Contributions to the council</h2>
            {contributions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No contributions written yet. The record on the right is kept by Sinag automatically.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {contributions.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-flag-blue text-[11px] font-bold text-white">{i + 1}</span>
                    <span className="leading-relaxed text-slate-700">{c}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ---------------------------------------------------------------- recent activity */}
          <section className="card sm:p-6" aria-labelledby="act-h">
            <h2 id="act-h" className="text-xl font-bold">Recent public activity</h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nothing posted yet.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-flag-yellow pl-4">
                {activity.map((a, i) => (
                  <li key={i}>
                    <p className="text-xs text-slate-500">
                      {a.kind === "update" ? "Posted an update" : a.kind === "minutes" ? "Published minutes" : "Published a financial report"} · {timeAgo(a.at)}
                    </p>
                    <Link
                      href={a.kind === "update" ? `/projects/${a.project_id}` : a.kind === "minutes" ? `/feed/minutes/${a.doc_id}` : `/feed/reports/${a.doc_id}`}
                      className="font-semibold text-ink hover:text-flag-blue"
                    >
                      {a.title}
                    </Link>
                    {a.detail && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{a.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          {/* ---------------------------------------------------------------- on record */}
          <section className="card" aria-labelledby="rec-h">
            <h2 id="rec-h" className="text-lg font-bold">On record in Sinag</h2>
            <p className="mt-0.5 text-xs text-slate-500">Counted automatically from the public record.</p>
            {record.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {record.map(([label, n]) => (
                  <div key={label} className="rounded-xl bg-mist px-3 py-3 ring-1 ring-inset ring-slate-200">
                    <dd className="font-display text-2xl font-bold leading-none text-flag-blue tabular-nums">{n}</dd>
                    <dt className="mt-1 text-[11px] font-medium leading-snug text-slate-600">{label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* ---------------------------------------------------------------- projects */}
          <section className="card" aria-labelledby="proj-h">
            <h2 id="proj-h" className="text-lg font-bold">Point person for</h2>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No projects assigned yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {projects.map((pr) => {
                  const st = PROJECT_STATUS[pr.status] ?? PROJECT_STATUS.proposed;
                  return (
                    <li key={pr.id}>
                      <Link href={`/projects/${pr.id}`} className="block rounded-xl border border-slate-200 p-3 transition hover:border-flag-blue/40 hover:bg-mist/50">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <Badge className={st.className}>{st.label}</Badge>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryStyle(pr.category).chip}`}>{pr.category}</span>
                        </span>
                        <span className="mt-1.5 block font-semibold leading-snug text-ink">{pr.title}</span>
                        <span className="block text-xs text-slate-500">{fmtDateRange(pr.start_date, pr.end_date)}</span>
                        <span className="mt-2 block"><ProgressBar value={Number(pr.progress ?? 0)} label="Work done" /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* ---------------------------------------------------------------- rest of the council */}
      {council.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="others-h">
          <h2 id="others-h" className="text-lg font-bold">Others on the council</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {council.map((c) => (
              <li key={c.id}>
                <Link href={`/council/${c.id}`} className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm transition hover:border-flag-blue/40 hover:shadow-sm">
                  <Avatar id={c.id} name={c.name} v={c.avatar_v} size="sm" />
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-slate-500">{ROLE_LABEL[c.role as Role]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-8 text-xs text-slate-400">Profile details are written by {p.name.split(" ")[0]}. Counts are taken from Sinag records as of {fmtDate(new Date())}.</p>
    </div>
  );
}
