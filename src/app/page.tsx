import Link from "next/link";
import SunRays from "@/components/SunRays";
import FeedItem from "@/components/FeedItem";
import { ArrowLink, DateTile, Empty, SectionHeader } from "@/components/ui";
import { getFeed, getStats, getUpcoming } from "@/lib/queries";
import { categoryStyle } from "@/lib/roles";
import { fmtDateRange, peso } from "@/lib/format";
import { currentUser } from "@/lib/auth";
import { ORG_NAME } from "@/lib/org";

const STEPS: [string, string][] = [
  ["Decide", "The council agrees on a project and records it here."],
  ["Fund", "The Chairperson approves the budget against the fund that is actually available."],
  ["Schedule", "It gets dates and a place, and appears on the public calendar."],
  ["Spend", "Every peso is entered in the ledger, with the receipt attached."],
  ["Report", "Updates, minutes and financial reports are published for everyone to read."],
];

const ROLES: [string, string][] = [
  ["Chairperson", "Record projects, approve budgets, set the schedule, publish."],
  ["Secretary", "Turn raw meeting notes into clear minutes and draft resolutions."],
  ["Treasurer", "Keep the ledger and generate plain-language financial reports."],
  ["Kagawad", "Post progress updates for the projects you lead."],
];

export default async function Home() {
  const [stats, upcoming, feed, user] = await Promise.all([getStats(), getUpcoming(4), getFeed(4), currentUser()]);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(56rem_36rem_at_88%_45%,#FFF6D1_0%,rgba(255,255,255,0)_70%)]">
        <SunRays className="pointer-events-none absolute -right-36 -top-28 -z-10 h-[22rem] w-[22rem] opacity-25 sm:-right-24 sm:top-1/2 sm:h-[40rem] sm:w-[40rem] sm:-translate-y-1/2 sm:opacity-50 lg:-right-16 lg:h-[44rem] lg:w-[44rem] lg:opacity-100" />
        <div className="container-x flex min-h-[30rem] items-center py-16 sm:min-h-[36rem] sm:py-24">
          <div className="max-w-xl lg:max-w-[34rem]">
            <p className="eyebrow">{ORG_NAME}</p>
            <h1 className="mt-4 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Let in the <span className="text-flag-blue">light</span> on every SK peso and project.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              See what the SK is doing, what it costs, and where the money went. The calendar, the projects, the ledger, the minutes and the financial reports — open to everyone, no account needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/feed" className="btn-primary px-5 py-3">See the bulletin</Link>
              <Link href="/funds" className="btn-yellow px-5 py-3">Follow the money</Link>
              <Link href="/calendar" className="btn-outline px-5 py-3">View the calendar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- numbers */}
      <section aria-label="Sinag in numbers" className="border-y border-slate-200 bg-white">
        <div className="container-x">
          <dl className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
            {[
              ["Funded projects", stats.projects],
              ["Completed", stats.completed],
              ["Published records", stats.records],
              ["Spent so far", peso(stats.spent)],
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
        <SectionHeader eyebrow="Coming up" title="What the SK is doing next" action={<ArrowLink href="/calendar">Full calendar</ArrowLink>} />
        {upcoming.length === 0 ? (
          <Empty>Nothing is scheduled yet. Projects appear here once the council sets their dates.</Empty>
        ) : (
          <div className={`grid gap-4 sm:grid-cols-2 ${upcoming.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {upcoming.map((p) => {
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="card card-link flex gap-4">
                  <DateTile value={p.start_date} />
                  <span className="min-w-0">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryStyle(p.category).chip}`}>{p.category}</span>
                    <span className="mt-2 block font-display text-base font-bold leading-snug text-ink">{p.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{fmtDateRange(p.start_date, p.end_date)}</span>
                    {p.location && <span className="block truncate text-xs text-slate-500">{p.location}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- how it works */}
      <section className="border-y border-slate-200 bg-mist py-16 sm:py-20">
        <div className="container-x">
          <SectionHeader eyebrow="Paano gumagana" title="From your idea to a funded project" />
          <ol className="relative grid gap-3 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden="true" className="absolute left-[2.35rem] right-[2.35rem] top-[2.4rem] hidden h-px bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red lg:block" />
            {STEPS.map(([t, d], i) => (
              <li key={t} className="relative flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:block lg:p-5">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flag-blue text-sm font-bold text-white ring-4 ring-white">{i + 1}</span>
                <div className="lg:mt-4">
                  <h3 className="text-lg font-bold leading-tight">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- bulletin */}
      <section className="container-x py-16 sm:py-20">
        <SectionHeader eyebrow="Public bulletin" title="Latest from the SK" action={<ArrowLink href="/feed">See everything</ArrowLink>} />
        {feed.length === 0 ? <Empty>Nothing has been posted yet.</Empty> : (
          <div className="grid gap-4 md:grid-cols-2">{feed.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
        )}
      </section>

      {/* ---------------------------------------------------------------- roles */}
      <section className="container-x pb-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-flag-blue px-6 py-10 text-white sm:px-12 sm:py-14">
          <SunRays className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[30rem] w-[30rem] opacity-[0.12]" />
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">A helper for every SK role</h2>
            <p className="mt-3 leading-relaxed text-blue-100">SK officials log in to a desk made for their position. Sinag drafts, they review, and the Chairperson approves before anything goes public.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-white/[0.08] p-5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-flag-yellow">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-blue-50/90">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/council" className="btn bg-white px-5 py-3 text-flag-blue hover:bg-blue-50">Meet the council</Link>
            {!user && <Link href="/login" className="btn-yellow px-5 py-3">SK officials: log in</Link>}
          </div>
        </div>
      </section>
    </>
  );
}
