import Link from "next/link";
import type { Row } from "@/lib/db";
import { timeAgo } from "@/lib/format";

const TYPE: Record<string, { label: string; className: string }> = {
  minutes: { label: "Minutes", className: "bg-blue-50 text-flag-blue" },
  report: { label: "Financial report", className: "bg-yellow-50 text-yellow-800" },
  update: { label: "Project update", className: "bg-emerald-50 text-emerald-800" },
  project: { label: "New project", className: "bg-red-50 text-flag-red" },
};

export function feedHref(item: Row): string {
  if (item.type === "minutes") return `/feed/minutes/${item.id}`;
  if (item.type === "report") return `/feed/reports/${item.id}`;
  return `/projects/${item.project_id}`;
}

export default function FeedItem({ item }: { item: Row }) {
  const t = TYPE[item.type as string] ?? TYPE.update;
  return (
    <article className="card card-link relative flex flex-col">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${t.className}`}>{t.label}</span>
        <span className="text-slate-500">{timeAgo(item.at as string)}</span>
        {item.author && <span className="text-slate-500">· {item.author}</span>}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">
        <Link href={feedHref(item)} className="after:absolute after:inset-0 after:rounded-2xl hover:text-flag-blue">{item.title}</Link>
      </h3>
      {item.excerpt && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.excerpt}</p>}
      <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-flag-blue">Read more <span>→</span></span>
    </article>
  );
}
