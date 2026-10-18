/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { DateTile, Empty, PageHeader } from "@/components/ui";
import { getMonthEvents } from "@/lib/queries";
import { categoryStyle } from "@/lib/roles";
import { first, fmtDateRange, todayManila } from "@/lib/format";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("calendar.title") };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { t, lang }] = await Promise.all([searchParams, getT()]);
  const today = todayManila();
  const m = /^\d{4}-\d{2}$/.test(first(sp.m) ?? "") ? (first(sp.m) as string) : today.slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  const start = new Date(Date.UTC(y, mo - 1, 1));
  const end = new Date(Date.UTC(y, mo, 0));
  const events = await getMonthEvents(iso(start), iso(end));

  const prev = iso(new Date(Date.UTC(y, mo - 2, 1))).slice(0, 7);
  const next = iso(new Date(Date.UTC(y, mo, 1))).slice(0, 7);
  const label = new Intl.DateTimeFormat(lang === "fil" ? "fil-PH" : "en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);

  // Grid starts on the Sunday on or before the 1st.
  const gridStart = new Date(start);
  gridStart.setUTCDate(1 - start.getUTCDay());
  const cells: string[] = [];
  const weeks = Math.ceil((start.getUTCDay() + end.getUTCDate()) / 7);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    cells.push(iso(d));
  }
  const onDay = (day: string) => events.filter((e) => e.start_date <= day && (e.end_date ?? e.start_date) >= day);

  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow={t("calendar.title")} title={t("calendar.heading")}>{t("calendar.lead")}</PageHeader>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{label}</h2>
        <div className="flex items-center gap-1">
          <Link href={`/calendar?m=${prev}`} aria-label={t("calendar.prev")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-flag-blue hover:text-flag-blue">←</Link>
          <Link href="/calendar" className="flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-flag-blue hover:text-flag-blue">{t("calendar.today")}</Link>
          <Link href={`/calendar?m=${next}`} aria-label={t("calendar.next")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-flag-blue hover:text-flag-blue">→</Link>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("calendar.days").split(",").map((d) => <div key={d} className="py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const inMonth = day.slice(0, 7) === m;
            return (
              <div key={day} className={`min-h-28 border-b border-r border-slate-100 p-1.5 [&:nth-child(7n)]:border-r-0 ${inMonth ? "bg-white" : "bg-slate-50/70"}`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${day === today ? "bg-flag-red text-white" : inMonth ? "text-ink" : "text-slate-500"}`}>{Number(day.slice(8))}</span>
                <div className="mt-1 space-y-1">
                  {inMonth && onDay(day).map((e) => (
                    <Link key={e.id} href={`/projects/${e.id}`} className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${categoryStyle(e.category).chip}`} title={e.title}>{e.title}</Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <h3 className="mb-3 text-xl font-bold">{t("calendar.month")}</h3>
        {events.length === 0 ? <Empty>{t("calendar.none")}</Empty> : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/projects/${e.id}`} className="card card-link flex items-center gap-4 py-4">
                  <DateTile value={e.start_date} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{e.title}</span>
                    <span className="block text-sm text-slate-500">{fmtDateRange(e.start_date, e.end_date)}{e.location ? ` · ${e.location}` : ""}</span>
                  </span>
                  <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${categoryStyle(e.category).chip}`}>{e.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
