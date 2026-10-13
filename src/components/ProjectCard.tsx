import Link from "next/link";
import type { Row } from "@/lib/db";
import { categoryStyle, PROJECT_STATUS } from "@/lib/roles";
import { fmtDateRange, peso, pct } from "@/lib/format";
import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/messages";
import { Badge, ProgressBar } from "./ui";

export default async function ProjectCard({ p }: { p: Row }) {
  const { t } = await getT();
  const status = PROJECT_STATUS[p.status as string] ? (p.status as string) : "proposed";
  const cat = categoryStyle(p.category as string);
  return (
    <article className="card card-link relative flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={PROJECT_STATUS[status].className}>{t(`status.${status}` as MessageKey)}</Badge>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className={`h-2 w-2 rounded-full ${cat.dot}`} />{p.category}
        </span>
      </div>
      <h2 className="mt-2 text-lg font-bold leading-snug"><Link href={`/projects/${p.id}`} className="after:absolute after:inset-0 after:rounded-2xl hover:text-flag-blue">{p.title}</Link></h2>
      <p className="mt-1 text-sm text-slate-600">{p.start_date ? fmtDateRange(p.start_date, p.end_date) : t("project.tba")}{p.location ? ` · ${p.location}` : ""}</p>
      <div className="mt-auto space-y-3 pt-4">
        {p.spent !== undefined && (
          <ProgressBar value={pct(Number(p.spent), Number(p.budget))} label={t("projects.spentOf", { spent: peso(p.spent), budget: peso(p.budget) })} />
        )}
        {["scheduled", "ongoing", "completed"].includes(p.status as string) && <ProgressBar value={Number(p.progress ?? 0)} label={t("projects.progress")} />}
      </div>
    </article>
  );
}
