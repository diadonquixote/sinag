import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Empty, FilterChips, PageHeader } from "@/components/ui";
import { getProjects } from "@/lib/queries";
import { CATEGORIES, PROJECT_STATUS } from "@/lib/roles";
import { first } from "@/lib/format";

export const metadata = { title: "Projects" };

function link(params: Record<string, string>): string {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `/projects?${q}` : "/projects";
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const category = first(sp.category) ?? "";
  const status = first(sp.status) ?? "";
  const projects = await getProjects({ category, status });
  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="Projects" title="What the SK is building">
        Every project, its schedule, its budget and how much has actually been spent.
      </PageHeader>
      <div className="mb-8 space-y-3">
        <FilterChips
          label="Status"
          current={status}
          items={[["", "All"], ...Object.entries(PROJECT_STATUS).filter(([k]) => k !== "cancelled").map(([k, v]) => [k, v.label] as [string, string])]}
          href={(v) => link({ status: v, category })}
        />
        <FilterChips label="Category" current={category} items={[["", "All"], ...CATEGORIES.map((c) => [c, c] as [string, string])]} href={(v) => link({ status, category: v })} />
      </div>
      {projects.length === 0 ? (
        <Empty action={(category || status) ? <Link href="/projects" className="btn-outline btn-sm">Clear filters</Link> : undefined}>No projects match these filters.</Empty>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{projects.length} {projects.length === 1 ? "project" : "projects"}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        </>
      )}
    </div>
  );
}
