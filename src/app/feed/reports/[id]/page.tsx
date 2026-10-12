import Link from "next/link";
import { notFound } from "next/navigation";
import ReportView from "@/components/ReportView";
import { sql, type Row } from "@/lib/db";

export default async function PublicReport({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [r] = await sql<Row[]>`
    select r.title, r.period, r.content, r.data, u.name as author, p.name as approver
    from reports r join users u on u.id = r.author_id left join users p on p.id = r.published_by
    where r.id = ${id} and r.status = 'published'`;
  if (!r) notFound();
  return (
    <div className="container-x py-10 sm:py-12"><div className="max-w-4xl">
      <Link href="/feed" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>Back to bulletin</Link>
      <p className="eyebrow mt-6">Financial report</p>
      <h1 className="mt-1 text-3xl font-bold">{r.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{r.period} · Prepared by {r.author}{r.approver ? ` · Approved by ${r.approver}` : ""}</p>
      <div className="mt-6"><ReportView content={r.content} data={r.data} /></div>
    </div></div>
  );
}
