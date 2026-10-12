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
      <Link href="/dashboard/treasurer" className="text-sm font-semibold text-flag-blue">← Finance desk</Link>
      <Flash sp={sp} />
      <h1 className="text-2xl font-bold">{r.title} <span className="text-base font-normal text-slate-500">· {r.period}</span></h1>
      <DocPanel kind="report" doc={r} user={user} />
      <h2 className="pt-4 text-lg font-bold">Preview of what the public will see</h2>
      <ReportView content={r.content} data={r.data} />
    </div>
  );
}
