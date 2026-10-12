import Link from "next/link";
import { Badge, Empty, Flash, PageHeader, Stat } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fundSummary } from "@/lib/funds";
import { DOC_STATUS } from "@/lib/roles";
import { fmtDate, peso, todayManila } from "@/lib/format";
import { addTransaction, createReport, setFund, voidTransaction } from "@/actions/finance";

export const metadata = { title: "Finance assistant" };
export const maxDuration = 60;

const CATS = ["Supplies", "Food", "Venue", "Printing", "Transportation", "Prizes", "Honoraria", "Equipment", "Other"];

export default async function TreasurerDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("treasurer", "chairperson");
  const sp = await searchParams;
  const isTreasurer = user.role === "treasurer";
  const today = todayManila();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [f, ledger, projects, reports] = await Promise.all([
    fundSummary(),
    sql<Row[]>`select t.id, t.tx_date::text as tx_date, t.kind, t.description, t.reference, t.amount::float8 as amount, t.voided_at, t.void_reason, p.title as project
               from transactions t left join projects p on p.id = t.project_id order by t.tx_date desc, t.id desc limit 40`,
    sql<Row[]>`select id, title from projects where status in ('approved','scheduled','ongoing','completed') order by id desc`,
    sql<Row[]>`select id, title, period, status from reports order by created_at desc`,
  ]);
  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <section>
        <PageHeader eyebrow="Treasurer desk" title="Finance assistant" size="md">Record money in and out. Sinag builds the financial report from your ledger, computes every number itself, and writes a plain-language summary for kabataan.</PageHeader>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Total SK fund" value={peso(f.total)} /><Stat label="Other income" value={peso(f.income)} /><Stat label="Spent" value={peso(f.expense)} />
          <Stat label="Set aside for projects" value={peso(f.committed)} /><Stat label="Available" tone={f.available < 0 ? "red" : "green"} value={peso(f.available)} />
        </div>
        <form action={setFund} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-mist/60 p-4">
          <div className="min-w-0 flex-1 sm:flex-none"><label className="label" htmlFor="total_fund">Total SK fund for the year (PHP)</label><input id="total_fund" name="total_fund" inputMode="decimal" defaultValue={f.total} className="input sm:w-56" /></div>
          <SubmitButton className="btn-outline" pending="Saving...">Update fund</SubmitButton>
          <p className="hint w-full sm:mt-0 sm:w-auto sm:flex-1 sm:self-center">The yearly budget of the SK. Income and spending are added from the ledger.</p>
        </form>
      </section>

      {isTreasurer && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form action={addTransaction} className="card space-y-4 sm:p-6">
            <div><h2 className="text-lg font-bold">Record an entry</h2><p className="hint mt-0.5">Every peso in or out. Entries can be voided later, never deleted.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="kind">Type</label><select id="kind" name="kind" className="input"><option value="expense">Expense</option><option value="income">Income</option></select></div>
              <div><label className="label" htmlFor="amount">Amount (PHP)</label><input id="amount" name="amount" required inputMode="decimal" className="input" /></div>
            </div>
            <div><label className="label" htmlFor="description">What was it for?</label><input id="description" name="description" required className="input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="input">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label" htmlFor="tx_date">Date</label><input id="tx_date" name="tx_date" type="date" defaultValue={today} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="project_id">Project (optional)</label><select id="project_id" name="project_id" className="input"><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
              <div><label className="label" htmlFor="reference">Receipt / OR no.</label><input id="reference" name="reference" className="input" /></div>
            </div>
            <SubmitButton pending="Saving...">Save entry</SubmitButton>
          </form>

          <form action={createReport} className="card flex flex-col gap-4 sm:p-6">
            <div><h2 className="text-lg font-bold">Generate a financial report</h2><p className="hint mt-0.5">Sinag computes the numbers from the ledger and drafts a summary for you to check.</p></div>
            <div><label className="label" htmlFor="title">Report title</label><input id="title" name="title" required defaultValue={`Financial report, ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "Asia/Manila" }).format(new Date())}`} className="input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="from">From</label><input id="from" name="from" type="date" required defaultValue={monthStart} className="input" /></div>
              <div><label className="label" htmlFor="to">To</label><input id="to" name="to" type="date" required defaultValue={today} className="input" /></div>
            </div>
            <p className="hint">Voided entries are left out. The report flags anything unusual, such as overspending or missing receipts.</p>
            <div className="mt-auto"><SubmitButton pending="Building the report...">Generate report</SubmitButton></div>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Reports</h2>
        {reports.length === 0 ? <Empty size="sm">No reports yet.</Empty> : (
          <ul className="space-y-2">{reports.map((r) => (
            <li key={r.id}><Link href={`/dashboard/reports/${r.id}`} className="card flex flex-wrap items-center justify-between gap-2 py-3 card-link">
              <span className="min-w-0"><b className="font-semibold">{r.title}</b><br /><span className="text-xs text-slate-500">{r.period}</span></span><Badge className={DOC_STATUS[r.status].className}>{DOC_STATUS[r.status].label}</Badge></Link></li>
          ))}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Recent ledger</h2>
        <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="py-3 pl-5 pr-2">Date</th><th className="pr-2">Description</th><th className="pr-2">Project</th><th className="pr-5 text-right">Amount</th>{isTreasurer && <th className="pr-5"><span className="sr-only">Void</span></th>}</tr></thead>
            <tbody>
              {ledger.map((t) => (
                <tr key={t.id} className={`border-b border-slate-100 align-top ${t.voided_at ? "text-slate-400" : ""}`}>
                  <td className="whitespace-nowrap py-3 pl-5 pr-2">{fmtDate(t.tx_date, "short")}</td>
                  <td className="py-3 pr-2"><span className={t.voided_at ? "line-through" : ""}>{t.description}</span>{t.reference ? <span className="text-slate-400"> ({t.reference})</span> : null}{t.voided_at && <div className="text-xs">Voided: {t.void_reason}</div>}</td>
                  <td className="py-3 pr-2 text-slate-600">{t.project ?? ""}</td>
                  <td className={`whitespace-nowrap py-3 pr-5 text-right font-semibold tabular-nums ${t.voided_at ? "line-through" : t.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{t.kind === "income" ? "+" : "−"}{peso(t.amount)}</td>
                  {isTreasurer && <td className="py-2 pr-5 text-right">{!t.voided_at && (
                    <details className="group relative inline-block text-left">
                      <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-flag-red [&::-webkit-details-marker]:hidden">Void</summary>
                      <form action={voidTransaction} className="absolute right-0 z-10 mt-1 flex w-72 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"><input type="hidden" name="id" value={t.id} />
                        <input name="reason" required placeholder="Why void this entry?" aria-label="Reason to void" className="input py-1.5 text-xs" /><SubmitButton className="btn-red btn-sm" pending="...">Void</SubmitButton></form>
                    </details>)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
