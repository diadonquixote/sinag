/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import { sql, type Row } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { getT } from "@/lib/i18n";

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  const [m] = await sql<Row[]>`
    select m.title, m.content, m.session_date::text as session_date, m.published_at, u.name as author, p.name as approver
    from minutes m join users u on u.id = m.author_id left join users p on p.id = m.published_by
    where m.id = ${id} and m.status = 'published'`;
  return m ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const m = await load((await params).id);
  return { title: m ? m.title : "Minutes" };
}

export default async function PublicMinutes({ params }: { params: Promise<{ id: string }> }) {
  const [m, { t }] = await Promise.all([params.then((p) => load(p.id)), getT()]);
  if (!m) notFound();
  return (
    <div className="container-x py-10 sm:py-12"><div className="max-w-3xl">
      <Link href="/feed" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>{t("feed.backToBulletin")}</Link>
      <p className="eyebrow mt-6">{t("minutes.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-bold">{m.title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {t("minutes.held", { date: fmtDate(m.session_date) })} · {t("common.recordedBy", { name: m.author })}
        {m.approver ? ` · ${t("common.approvedBy", { name: m.approver })}` : ""}
        {m.published_at ? ` · ${t("common.publishedOn", { date: fmtDate(m.published_at) })}` : ""}
      </p>
      <div className="card mt-6"><RichText text={m.content} /></div>
    </div></div>
  );
}
