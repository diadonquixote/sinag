/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import SunRays from "@/components/SunRays";
import FeedItem from "@/components/FeedItem";
import { ArrowLink, DateTile, Empty, SectionHeader } from "@/components/ui";
import { getFeed, getStats, getUpcoming } from "@/lib/queries";
import { categoryStyle } from "@/lib/roles";
import { fmtDate, fmtDateRange, peso } from "@/lib/format";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { ORG_NAME } from "@/lib/org";
import { toCentavos, toPesos } from "@/lib/money";

export default async function Home() {
  const [stats, upcoming, feed, user, { t }] = await Promise.all([getStats(), getUpcoming(4), getFeed(4), currentUser(), getT()]);
  const steps = [1, 2, 3, 4, 5].map((n) => [t(`home.step${n}` as "home.step1"), t(`home.step${n}d` as "home.step1d")] as const);
  const trust = [
    ["home.trust1", "home.trust1d", "M5 13l4 4L19 7"],
    ["home.trust2", "home.trust2d", "M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"],
    ["home.trust3", "home.trust3d", "M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2"],
    ["home.trust4", "home.trust4d", "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"],
  ] as const;

  return (
    <>
      {/* ---------------------------------------------------------------- hero: what this is, and how current it is */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[radial-gradient(48rem_30rem_at_90%_40%,#FFF6D1_0%,rgba(255,255,255,0)_70%)]">
        <SunRays className="pointer-events-none absolute -right-40 -top-32 -z-10 h-[22rem] w-[22rem] opacity-20 sm:-right-24 sm:top-1/2 sm:h-[34rem] sm:w-[34rem] sm:-translate-y-1/2 sm:opacity-30" />
        <div className="container-x py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">{ORG_NAME}</p>
            <h1 className="mt-4 text-[2.3rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">{t("home.title")}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{t("home.lead")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/feed" className="btn-primary px-5 py-3">{t("home.ctaBulletin")}</Link>
              <Link href="/funds" className="btn-yellow px-5 py-3">{t("home.ctaMoney")}</Link>
              <Link href="/calendar" className="btn-outline px-5 py-3">{t("home.ctaCalendar")}</Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${stats.last_update ? "bg-emerald-500" : "bg-slate-300"}`} />
                {stats.last_update ? t("home.lastUpdate", { date: fmtDate(stats.last_update) }) : t("home.noUpdate")}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t("home.computed")}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- numbers */}
      <section aria-label={t("home.numbers")} className="border-b border-slate-200 bg-white">
        <div className="container-x">
          <dl className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
            {[
              [t("home.statProjects"), stats.projects],
              [t("home.statCompleted"), stats.completed],
              [t("home.statRecords"), stats.records],
              [t("home.statSpent"), peso(toPesos(toCentavos(stats.spent as string)))],
            ].map(([label, value], i) => (
              <div key={label as string} className={`bg-white py-6 ${i % 2 === 0 ? "pr-4" : "pl-5"} ${i === 0 ? "sm:pr-6" : "sm:px-6"}`}>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                {/* The peso total is the longest of these, so it steps down a size to stay on one line. */}
                <dd className={`mt-2 font-display font-bold leading-none text-flag-blue tabular-nums ${String(value).length > 6 ? "text-2xl sm:text-3xl" : "text-4xl"}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- upcoming */}
      <section className="container-x py-16 sm:py-20">
        <SectionHeader eyebrow={t("home.upcomingEyebrow")} title={t("home.upcomingTitle")} action={<ArrowLink href="/calendar">{t("home.upcomingAll")}</ArrowLink>} />
        {upcoming.length === 0 ? (
          <Empty>{t("home.upcomingEmpty")}</Empty>
        ) : (
          <div className={`grid gap-4 sm:grid-cols-2 ${upcoming.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {upcoming.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card card-link flex gap-4">
                <DateTile value={p.start_date} />
                <span className="min-w-0">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryStyle(p.category).chip}`}>{p.category}</span>
                  <span className="mt-2 block font-display text-base font-bold leading-snug text-ink">{p.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">{fmtDateRange(p.start_date, p.end_date)}</span>
                  {p.location && <span className="block truncate text-xs text-slate-500">{p.location}</span>}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- how it works */}
      <section className="border-y border-slate-200 bg-mist py-16 sm:py-20">
        <div className="container-x">
          <SectionHeader eyebrow={t("home.stepsEyebrow")} title={t("home.stepsTitle")} />
          <ol className="relative grid gap-3 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden="true" className="absolute left-[2.35rem] right-[2.35rem] top-[2.4rem] hidden h-px bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red lg:block" />
            {steps.map(([title, desc], i) => (
              <li key={title} className="relative flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:block lg:p-5">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flag-blue text-sm font-bold text-white ring-4 ring-white">{i + 1}</span>
                <div className="lg:mt-4">
                  <h3 className="text-lg font-bold leading-tight">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- bulletin */}
      <section className="container-x py-16 sm:py-20">
        <SectionHeader eyebrow={t("home.feedEyebrow")} title={t("home.feedTitle")} action={<ArrowLink href="/feed">{t("home.feedAll")}</ArrowLink>} />
        {feed.length === 0 ? <Empty>{t("home.feedEmpty")}</Empty> : (
          <div className="grid gap-4 md:grid-cols-2">{feed.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
        )}
      </section>

      {/* ---------------------------------------------------------------- why the record can be relied on */}
      <section className="container-x pb-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight">{t("home.trustTitle")}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{t("home.trustLead")}</p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {trust.map(([title, desc, icon]) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-mist p-5 ring-1 ring-inset ring-slate-200">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flag-blue text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                </span>
                <span>
                  <span className="block font-bold text-ink">{t(title)}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">{t(desc)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/council" className="btn-primary px-5 py-3">{t("home.meetCouncil")}</Link>
            <Link href="/about" className="btn-outline px-5 py-3">{t("stage.more")}</Link>
            {!user && <Link href="/login" className="btn-outline px-5 py-3">{t("home.officialsLogin")}</Link>}
          </div>
        </div>
      </section>
    </>
  );
}
