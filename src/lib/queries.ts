import { sql, type Row } from "./db";

/** Headline numbers for the landing page. */
export async function getStats() {
  const [row] = await sql<Row[]>`
    select
      (select count(*) from projects where status in ('approved','scheduled','ongoing','completed'))::int as projects,
      (select count(*) from projects where status = 'completed')::int as completed,
      (select count(*) from minutes where status = 'published')::int
        + (select count(*) from reports where status = 'published')::int as records,
      (select coalesce(sum(amount), 0) from transactions where kind = 'expense' and voided_at is null)::float8 as spent
  `;
  return row;
}

/** Scheduled or ongoing projects that have not finished yet, soonest first. */
export async function getUpcoming(limit: number) {
  return sql<Row[]>`
    select id, title, category, status, location,
           start_date::text as start_date, end_date::text as end_date, budget::float8 as budget
    from projects
    where status in ('scheduled', 'ongoing')
      and coalesce(end_date, start_date) >= (now() at time zone 'Asia/Manila')::date
    order by start_date nulls last, id
    limit ${limit}
  `;
}

export type FeedType = "minutes" | "report" | "update" | "project";

/** One public stream: published minutes and reports, project updates, newly funded projects. */
export async function getFeed(limit: number, type?: string | null) {
  const wanted = type && ["minutes", "report", "update", "project"].includes(type) ? type : null;
  return sql<Row[]>`
    select * from (
      select 'minutes'::text as type, m.id, null::int as project_id, m.title,
             coalesce(m.data->>'summary', left(m.content, 280)) as excerpt,
             m.published_at as at, u.name as author
      from minutes m join users u on u.id = m.author_id
      where m.status = 'published'
      union all
      select 'report', r.id, null::int, r.title, left(r.content, 280), r.published_at, u.name
      from reports r join users u on u.id = r.author_id
      where r.status = 'published'
      union all
      select 'update', pu.id, p.id, p.title, pu.body, pu.created_at, u.name
      from project_updates pu
      join projects p on p.id = pu.project_id
      left join users u on u.id = pu.author_id
      union all
      select 'project', p.id, p.id, p.title, left(p.description, 280), p.created_at, null::text
      from projects p
      where p.status in ('approved', 'scheduled', 'ongoing', 'completed')
    ) f
    where (${wanted}::text is null or f.type = ${wanted})
    order by f.at desc
    limit ${limit}
  `;
}

/** Projects with how much has actually been spent on each. */
export async function getProjects(filters: { category?: string | null; status?: string | null }) {
  const category = filters.category || null;
  const status = filters.status || null;
  return sql<Row[]>`
    select p.id, p.title, p.description, p.category, p.status, p.location, p.progress,
           p.start_date::text as start_date, p.end_date::text as end_date,
           p.budget::float8 as budget,
           coalesce((select sum(t.amount) from transactions t
                     where t.project_id = p.id and t.kind = 'expense' and t.voided_at is null), 0)::float8 as spent
    from projects p
    where p.status <> 'cancelled'
      and (${category}::text is null or p.category = ${category})
      and (${status}::text is null or p.status = ${status})
    order by
      case p.status when 'ongoing' then 0 when 'scheduled' then 1 when 'approved' then 2
                    when 'proposed' then 3 else 4 end,
      p.start_date nulls last, p.id desc
  `;
}

/** Projects overlapping a month, for the calendar. */
export async function getMonthEvents(monthStart: string, monthEnd: string) {
  return sql<Row[]>`
    select id, title, category, status, location,
           start_date::text as start_date, end_date::text as end_date
    from projects
    where status in ('scheduled', 'ongoing', 'completed')
      and start_date is not null
      and start_date <= ${monthEnd}::date
      and coalesce(end_date, start_date) >= ${monthStart}::date
    order by start_date, id
  `;
}
