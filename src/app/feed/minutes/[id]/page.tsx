import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import { sql, type Row } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function PublicMinutes({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [m] = await sql<Row[]>`
    select m.title, m.content, m.session_date::text as session_date, m.published_at, u.name as author, p.name as approver
    from minutes m join users u on u.id = m.author_id left join users p on p.id = m.published_by
    where m.id = ${id} and m.status = 'published'`;
  if (!m) notFound();
  return (
    <div className="container-x max-w-3xl py-12">
      <Link href="/feed" className="text-sm font-semibold text-flag-blue">← Back to bulletin</Link>
      <p className="eyebrow mt-6">Minutes of the meeting</p>
      <p className="mt-1 text-sm text-slate-600">Held {fmtDate(m.session_date)} · Recorded by {m.author}{m.approver ? ` · Approved by ${m.approver}` : ""}</p>
      <div className="card mt-6"><RichText text={m.content} /></div>
    </div>
  );
}
