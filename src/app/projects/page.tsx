import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Empty, FilterChips, PageHeader } from "@/components/ui";
import { getProjects } from "@/lib/queries";
import { CATEGORIES, PROJECT_STATUS } from "@/lib/roles";
import { first } from "@/lib/format";
import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/messages";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("projects.title") };
}

function link(params: Record<string, string>): string {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `/projects?${q}` : "/projects";
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { t }] = await Promise.all([searchParams, getT()]);
  const category = first(sp.category) ?? "";
  const status = first(sp.status) ?? "";
  const projects = await getProjects({ category, status });
  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow={t("projects.title")} title={t("projects.heading")}>{t("projects.lead")}</PageHeader>
      <div className="mb-8 space-y-3">
        <FilterChips
          label={t("projects.status")}
          current={status}
          items={[["", t("common.all")], ...Object.keys(PROJECT_STATUS).filter((k) => k !== "cancelled").map((k) => [k, t(`status.${k}` as MessageKey)] as [string, string])]}
          href={(v) => link({ status: v, category })}
        />
        <FilterChips label={t("projects.category")} current={category} items={[["", t("common.all")], ...CATEGORIES.map((c) => [c, c] as [string, string])]} href={(v) => link({ status, category: v })} />
      </div>
      {projects.length === 0 ? (
        <Empty action={(category || status) ? <Link href="/projects" className="btn-outline btn-sm">{t("projects.clear")}</Link> : undefined}>{t("projects.none")}</Empty>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{projects.length === 1 ? t("projects.countOne") : t("projects.count", { n: projects.length })}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        </>
      )}
    </div>
  );
}
