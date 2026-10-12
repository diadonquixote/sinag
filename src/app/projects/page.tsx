import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Empty, PageHeader } from "@/components/ui";
import { getProjects } from "@/lib/queries";
import { CATEGORIES, PROJECT_STATUS } from "@/lib/roles";
import { first } from "@/lib/format";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const category = first(sp.category) ?? "";
  const status = first(sp.status) ?? "";
  const projects = await getProjects({ category, status });
  return (
    <div className="container-x py-12">
      <PageHeader eyebrow="Projects" title="What the SK is building">
        Every project, its schedule, its budget and how much has actually been spent.
      </PageHeader>
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category} className="input">
            <option value="">All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">All</option>{Object.entries(PROJECT_STATUS).filter(([k]) => k !== "cancelled").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></div>
        <button className="btn-primary">Filter</button>
        {(category || status) && <Link href="/projects" className="btn-outline">Clear</Link>}
      </form>
      {projects.length === 0 ? <Empty>No projects match.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
