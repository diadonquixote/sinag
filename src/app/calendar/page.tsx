import Link from "next/link";
import { Empty, PageHeader } from "@/components/ui";
import { getMonthEvents } from "@/lib/queries";
import { categoryStyle } from "@/lib/roles";
import { first, fmtDateRange, todayManila } from "@/lib/format";

export const metadata = { title: "Calendar" };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const today = todayManila();
  const m = /^\d{4}-\d{2}$/.test(first(sp.m) ?? "") ? (first(sp.m) as string) : today.slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  const start = new Date(Date.UTC(y, mo - 1, 1));
  const end = new Date(Date.UTC(y, mo, 0));
  const events = await getMonthEvents(iso(start), iso(end));

  const prev = iso(new Date(Date.UTC(y, mo - 2, 1))).slice(0, 7);
  const next = iso(new Date(Date.UTC(y, mo, 1))).slice(0, 7);
  const label = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);

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
    <div className="container-x py-12">
      <PageHeader eyebrow="Calendar" title="What is happening, and when">
        Every scheduled SK project. Tap an event for its details and budget.
      </PageHeader>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/calendar?m=${prev}`} className="btn-outline btn-sm">← Previous</Link>
        <h2 className="text-xl font-bold">{label}</h2>
        <Link href={`/calendar?m=${next}`} className="btn-outline btn-sm">Next →</Link>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <div className="grid grid-cols-7 bg-flag-blue text-center text-xs font-bold uppercase tracking-wide text-white">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const inMonth = day.slice(0, 7) === m;
            return (
              <div key={day} className={`min-h-28 border-b border-r border-slate-100 p-1.5 ${inMonth ? "bg-white" : "bg-slate-50"}`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${day === today ? "bg-flag-red text-white" : inMonth ? "text-ink" : "text-slate-400"}`}>{Number(day.slice(8))}</span>
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
        <h3 className="mb-3 text-lg font-bold">This month</h3>
        {events.length === 0 ? <Empty>No projects are scheduled this month.</Empty> : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/projects/${e.id}`} className="card flex items-center justify-between gap-3 py-3 hover:border-flag-blue/40">
                  <span><b>{e.title}</b><br /><span className="text-sm text-slate-600">{fmtDateRange(e.start_date, e.end_date)}{e.location ? ` · ${e.location}` : ""}</span></span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryStyle(e.category).chip}`}>{e.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
