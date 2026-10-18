/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { Badge, Empty, Flash, PageHeader, Stat } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fundSummary } from "@/lib/funds";
import { DOC_STATUS } from "@/lib/roles";
import { fmtDate, peso, todayManila } from "@/lib/format";
import { addReceipts, addTransaction, createReport, removeReceipt, setFund, voidTransaction } from "@/actions/finance";
import ReceiptInput from "@/components/ReceiptInput";
import { visionConfigured } from "@/lib/ai";

export const metadata = { title: "Finance assistant" };
export const maxDuration = 60;

const CATS = ["Supplies", "Food", "Venue", "Printing", "Transportation", "Prizes", "Honoraria", "Equipment", "Other"];

export default async function TreasurerDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("treasurer", "chairperson");
  const sp = await searchParams;
  const isTreasurer = user.role === "treasurer";
  const canRead = visionConfigured();
  const today = todayManila();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [f, ledger, projects, reports] = await Promise.all([
    fundSummary(),
    sql<Row[]>`select t.id, t.tx_date::text as tx_date, t.kind, t.description, t.reference, t.amount::float8 as amount, t.voided_at, t.void_reason, p.title as project,
                 coalesce((select json_agg(json_build_object('id', r.id, 'public', r.is_public) order by r.id) from transaction_receipts r where r.transaction_id = t.id), '[]'::json) as receipts
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
            <div className="rounded-xl border border-slate-200 bg-mist/50 p-4">
              <ReceiptInput canRead={canRead} fill={{ amount: "amount", date: "tx_date", reference: "reference", description: "description" }} idPrefix="new" />
              <p className="hint">{canRead ? "Sinag reads the receipt and fills in empty fields. Check them before saving." : "The photo is kept with the entry as proof of payment."}</p>
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
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-bold">Recent ledger</h2>
          {(() => {
            const n = ledger.filter((t) => t.kind === "expense" && !t.voided_at && t.receipts.length === 0).length;
            return <p className={`text-xs font-medium ${n ? "text-yellow-700" : "text-emerald-700"}`}>{n ? `${n} expense${n === 1 ? "" : "s"} still need${n === 1 ? "s" : ""} a receipt photo` : "Every expense here has a receipt photo"}</p>;
          })()}
        </div>
        {ledger.length === 0 ? <Empty size="sm">No entries yet.</Empty> : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {ledger.map((t) => {
              const receipts = t.receipts as { id: number; public: boolean }[];
              const missing = t.kind === "expense" && !t.voided_at && receipts.length === 0;
              return (
                <li key={t.id} className={`px-4 py-3.5 sm:px-5 ${t.voided_at ? "bg-slate-50/60 text-slate-400" : ""}`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold text-slate-500">{fmtDate(t.tx_date, "short")}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${t.voided_at ? "line-through" : "text-ink"}`}>{t.description}</p>
                      <p className="text-xs text-slate-500">{[t.project, t.reference ? (/^or[\s.#-]/i.test(t.reference) ? t.reference : `OR ${t.reference}`) : ""].filter(Boolean).join(" · ") || (t.kind === "income" ? "Income" : "Expense")}</p>
                      {t.voided_at && <p className="mt-0.5 text-xs">Voided: {t.void_reason}</p>}
                      {receipts.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {receipts.map((r, i) => (
                            <li key={r.id}>
                              <a href={`/api/receipt/${r.id}`} target="_blank" rel="noreferrer" className="relative block h-12 w-10 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 transition hover:ring-2 hover:ring-flag-blue" title={r.public ? "Receipt (public)" : "Receipt (officials only)"}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/api/receipt/${r.id}`} alt={`Receipt ${i + 1} for ${t.description}`} loading="lazy" className="h-full w-full object-cover" />
                                {!r.public && <span className="absolute inset-x-0 bottom-0 bg-ink/80 text-center text-[8px] font-bold uppercase text-white">Hidden</span>}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {missing && <p className="mt-1 text-xs font-medium text-yellow-700">No receipt photo yet</p>}
                    </div>
                    <span className={`shrink-0 whitespace-nowrap font-semibold tabular-nums ${t.voided_at ? "line-through" : t.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{t.kind === "income" ? "+" : "−"}{peso(t.amount)}</span>
                  </div>

                  {isTreasurer && !t.voided_at && (
                    <details className="group mt-2 sm:ml-16">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-mist hover:text-flag-blue [&::-webkit-details-marker]:hidden">
                        {missing ? "Add receipt or void" : "Manage entry"} <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
                      </summary>
                      <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <form action={addReceipts}>
                            <input type="hidden" name="id" value={t.id} />
                            <ReceiptInput canRead={false} idPrefix={`tx${t.id}`} />
                            <SubmitButton className="btn-primary btn-sm mt-3" pending="Uploading...">Save receipt</SubmitButton>
                          </form>
                          {receipts.length > 0 && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              <p className="text-xs font-semibold text-slate-500">Uploaded the wrong photo?</p>
                              <div className="mt-1.5 flex flex-wrap gap-2">
                                {receipts.map((r, i) => (
                                  <form key={r.id} action={removeReceipt}>
                                    <input type="hidden" name="receipt_id" value={r.id} />
                                    <SubmitButton className="btn btn-sm border border-slate-200 bg-white text-slate-600 hover:border-flag-red hover:text-flag-red" pending="...">Remove receipt {i + 1}</SubmitButton>
                                  </form>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <form action={voidTransaction} className="rounded-xl border border-slate-200 p-3">
                          <input type="hidden" name="id" value={t.id} />
                          <label className="label" htmlFor={`void-${t.id}`}>Void this entry</label>
                          <div className="flex gap-2">
                            <input id={`void-${t.id}`} name="reason" required placeholder="Why? e.g. typed the wrong amount" className="input" />
                            <SubmitButton className="btn-red btn-sm" pending="...">Void</SubmitButton>
                          </div>
                          <p className="hint">The entry stays on the record, struck through, with your reason.</p>
                        </form>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
