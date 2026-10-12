import Link from "next/link";
import type { Row } from "@/lib/db";
import { categoryStyle, PROJECT_STATUS } from "@/lib/roles";
import { fmtDateRange, peso, pct } from "@/lib/format";
import { Badge, ProgressBar } from "./ui";

export default function ProjectCard({ p }: { p: Row }) {
  const st = PROJECT_STATUS[p.status as string] ?? PROJECT_STATUS.proposed;
  const cat = categoryStyle(p.category as string);
  return (
    <article className="card flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={st.className}>{st.label}</Badge>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className={`h-2 w-2 rounded-full ${cat.dot}`} />{p.category}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug"><Link href={`/projects/${p.id}`} className="hover:text-flag-blue">{p.title}</Link></h3>
      <p className="mt-1 text-sm text-slate-600">{fmtDateRange(p.start_date, p.end_date)}{p.location ? ` · ${p.location}` : ""}</p>
      <div className="mt-auto space-y-3 pt-4">
        {p.spent !== undefined && (
          <ProgressBar value={pct(Number(p.spent), Number(p.budget))} label={`${peso(p.spent)} spent of ${peso(p.budget)}`} />
        )}
        {["scheduled", "ongoing", "completed"].includes(p.status as string) && <ProgressBar value={Number(p.progress ?? 0)} label="Progress" />}
      </div>
    </article>
  );
}
