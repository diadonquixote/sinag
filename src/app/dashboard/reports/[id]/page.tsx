import Link from "next/link";
import { notFound } from "next/navigation";
import DocPanel from "@/components/DocPanel";
import ReportView from "@/components/ReportView";
import { Flash } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export default async function ReportEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("treasurer", "chairperson");
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [r] = await sql<Row[]>`select id, title, period, content, data, status, author_id from reports where id = ${id}`;
  if (!r || (user.role !== "chairperson" && r.author_id !== user.id)) notFound();
  return (
    <div className="space-y-6">
      <Link href="/dashboard/treasurer" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>Finance desk</Link>
      <Flash sp={sp} />
      <div><p className="eyebrow">Financial report</p><h1 className="mt-1.5 text-3xl font-bold leading-tight">{r.title}</h1><p className="mt-1 text-sm text-slate-500">{r.period}</p></div>
      <DocPanel kind="report" doc={r} user={user} />
      <h2 className="pt-4 text-xl font-bold">Preview of what the public will see</h2>
      <ReportView content={r.content} data={r.data} />
    </div>
  );
}
