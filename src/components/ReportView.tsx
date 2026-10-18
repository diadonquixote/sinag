/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import type { ReportData } from "@/lib/types";
import { fmtDate, peso } from "@/lib/format";
import { Stat } from "./ui";

/** Plain-language summary plus the numbers behind it. The numbers come from the ledger, never from the AI. */
export default function ReportView({ content, data }: { content: string; data: ReportData | null }) {
  return (
    <div className="space-y-6">
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Money in" tone="green" value={peso(data.income)} />
          <Stat label="Money out" tone="red" value={peso(data.expense)} />
          <Stat label="Net change" tone={data.net < 0 ? "red" : "green"} value={`${data.net > 0 ? "+" : ""}${peso(data.net)}`} />
          <Stat label="Still available" tone="blue" value={peso(data.fund.available)} />
        </div>
      )}
      <div className="card">
        <h2 className="text-lg font-bold">In plain words</h2>
        <div className="mt-2 space-y-3 leading-relaxed text-slate-700">{content.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
      {data?.flags?.length ? (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5">
          <h2 className="font-bold text-yellow-900">Things to note</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-900">{data.flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
      ) : null}
      {data && data.byCategory.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold">Spending by category</h2>
          <ul className="mt-3 space-y-2">
            {data.byCategory.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-sm"><span>{c.category}</span><span className="font-semibold">{peso(c.amount)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-flag-red" style={{ width: `${data.expense ? Math.round((c.amount / data.expense) * 100) : 0}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data && data.lines.length > 0 && (
        <div className="card relative overflow-x-auto">
          <h2 className="text-lg font-bold">Every entry</h2>
          <table className="mt-3 w-full min-w-[620px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Date</th><th>Description</th><th>Project</th><th>OR no.</th><th>Receipt</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {data.lines.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(l.date, "short")}</td>
                  <td className="pr-2">{l.description}</td>
                  <td className="pr-2 text-slate-500">{l.project ?? ""}</td>
                  <td className="pr-2 text-slate-500">{l.reference ?? ""}</td>
                  <td className="pr-2 text-xs">{l.receipts ? <span className="font-semibold text-emerald-700">Photo ✓</span> : l.kind === "expense" && l.receipts === 0 ? <span className="text-slate-400">None</span> : null}</td>
                  <td className={`text-right font-semibold ${l.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{l.kind === "income" ? "+" : "−"}{peso(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <p className="text-xs text-slate-500">Period: {fmtDate(data.period.from)} to {fmtDate(data.period.to)}. Figures come straight from the SK ledger.{data.used_ai ? " The summary wording was drafted by AI and reviewed by the Treasurer." : ""}</p>}
    </div>
  );
}
