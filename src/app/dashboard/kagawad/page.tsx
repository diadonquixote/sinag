import { Empty, Flash, PageHeader } from "@/components/ui";
import ProjectCard from "@/components/ProjectCard";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "My projects" };

export default async function KagawadDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("kagawad");
  const sp = await searchParams;
  const mine = await sql<Row[]>`
    select p.id, p.title, p.category, p.status, p.location, p.progress, p.start_date::text as start_date, p.end_date::text as end_date, p.budget::float8 as budget,
           coalesce((select sum(t.amount) from transactions t where t.project_id = p.id and t.kind = 'expense' and t.voided_at is null), 0)::float8 as spent
    from projects p where p.lead_id = ${user.id} and p.status <> 'cancelled' order by p.start_date nulls last`;
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <PageHeader eyebrow="Kagawad desk" title="Projects you lead" size="md">Open a project to post an update. Updates go straight to the public feed, so keep them short and factual. You can ask Sinag to polish your wording.</PageHeader>
      {mine.length === 0 ? <Empty>The Chairperson has not made you point person on a project yet.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
