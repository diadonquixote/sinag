import Link from "next/link";
import SunRays from "@/components/SunRays";
import FeedItem from "@/components/FeedItem";
import { Empty } from "@/components/ui";
import { getFeed, getStats, getUpcoming } from "@/lib/queries";
import { categoryStyle } from "@/lib/roles";
import { fmtDateRange } from "@/lib/format";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const [stats, upcoming, feed, user] = await Promise.all([getStats(), getUpcoming(4), getFeed(4), getSession()]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200">
        <SunRays className="pointer-events-none absolute -right-24 -top-24 h-[34rem] w-[34rem] opacity-60 sm:-right-10 sm:-top-32 sm:h-[44rem] sm:w-[44rem]" />
        <div className="container-x relative py-16 sm:py-24">
          <p className="eyebrow">Para sa kabataan, kasama ang kabataan</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Let in the <span className="text-flag-blue">light</span> on every SK peso and project.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-700">
            Suggest ideas, vote on what happens next, see the schedule, and read the minutes and financial reports. All in one place, open to every kabataan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/feed" className="btn-primary">See the bulletin</Link>
            {user ? (
              <Link href="/ideas/new" className="btn-yellow">Suggest a project</Link>
            ) : (
              <Link href="/register" className="btn-red">Join as kabataan</Link>
            )}
            <Link href="/calendar" className="btn-outline">View the calendar</Link>
          </div>
          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Ideas from youth", stats.ideas],
              ["Votes cast", stats.votes],
              ["Funded projects", stats.projects],
              ["Completed", stats.completed],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <dd className="text-3xl font-bold text-flag-blue">{value as number}</dd>
                <dt className="text-xs font-medium text-slate-600">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Coming up</p>
            <h2 className="text-2xl font-bold sm:text-3xl">What the SK is doing next</h2>
          </div>
          <Link href="/calendar" className="text-sm font-semibold text-flag-blue">Full calendar</Link>
        </div>
        {upcoming.length === 0 ? (
          <Empty>Nothing is scheduled yet. Check back soon, or suggest a project.</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card block transition hover:border-flag-blue/40">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryStyle(p.category).chip}`}>{p.category}</span>
                <h3 className="mt-3 text-base font-bold leading-snug">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{fmtDateRange(p.start_date, p.end_date)}</p>
                {p.location && <p className="text-sm text-slate-500">{p.location}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-mist py-14">
        <div className="container-x">
          <p className="eyebrow">Paano gumagana</p>
          <h2 className="text-2xl font-bold sm:text-3xl">From your idea to a funded project</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Suggest", "Any kabataan can send in a project idea."],
              ["Review", "The Chairperson checks it and opens it for voting."],
              ["Vote", "Kabataan spread their votes. Top ideas win."],
              ["Fund & schedule", "The winner becomes a proposal with a budget and a date."],
              ["Report", "Updates, minutes and spending are posted publicly."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-flag-blue text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Public bulletin</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Latest from the SK</h2>
          </div>
          <Link href="/feed" className="text-sm font-semibold text-flag-blue">See everything</Link>
        </div>
        {feed.length === 0 ? <Empty>Nothing has been posted yet.</Empty> : (
          <div className="grid gap-4 md:grid-cols-2">{feed.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
        )}
      </section>

      <section className="container-x pb-6">
        <div className="rounded-3xl bg-flag-blue p-8 text-white sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">A helper for every SK role</h2>
          <p className="mt-2 max-w-2xl text-blue-100">SK officials log in to a desk made for their position. Sinag drafts, they review, and the Chairperson approves before anything goes public.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Chairperson", "Approve ideas, run polls, approve budgets, schedule, publish."],
              ["Secretary", "Turn raw meeting notes into clear minutes and draft resolutions."],
              ["Treasurer", "Keep the ledger and generate plain-language financial reports."],
              ["Kagawad", "Post progress updates for the projects you lead."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                <h3 className="font-bold text-flag-yellow">{t}</h3>
                <p className="mt-1 text-sm text-blue-50">{d}</p>
              </div>
            ))}
          </div>
          {!user && <Link href="/login" className="btn-yellow mt-6">SK officials: log in</Link>}
        </div>
      </section>
    </>
  );
}
