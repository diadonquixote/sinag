/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import ReportView from "@/components/ReportView";
import { sql, type Row } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { getT } from "@/lib/i18n";

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  const [r] = await sql<Row[]>`
    select r.title, r.period, r.content, r.data, r.published_at, u.name as author, p.name as approver
    from reports r join users u on u.id = r.author_id left join users p on p.id = r.published_by
    where r.id = ${id} and r.status = 'published'`;
  return r ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  return { title: r ? r.title : "Financial report" };
}

export default async function PublicReport({ params }: { params: Promise<{ id: string }> }) {
  const [r, { t }] = await Promise.all([params.then((p) => load(p.id)), getT()]);
  if (!r) notFound();
  return (
    <div className="container-x py-10 sm:py-12"><div className="max-w-4xl">
      <Link href="/feed" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-flag-blue"><span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>{t("feed.backToBulletin")}</Link>
      <p className="eyebrow mt-6">{t("report.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-bold">{r.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {r.period} · {t("common.preparedBy", { name: r.author })}
        {r.approver ? ` · ${t("common.approvedBy", { name: r.approver })}` : ""}
        {r.published_at ? ` · ${t("common.publishedOn", { date: fmtDate(r.published_at) })}` : ""}
      </p>
      <div className="mt-6"><ReportView content={r.content} data={r.data} /></div>
    </div></div>
  );
}
