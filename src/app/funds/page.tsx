import Link from "next/link";
import { PageHeader, SectionHeader, Stat, Empty, ProgressBar } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { fundSummary } from "@/lib/funds";
import { fmtDate, peso, pct } from "@/lib/format";

export const metadata = { title: "Fund transparency" };

export default async function FundsPage() {
  const [f, projects, ledger] = await Promise.all([
    fundSummary(),
    sql<Row[]>`
      select p.id, p.title, p.status, p.budget::float8 as budget,
             coalesce((select sum(t.amount) from transactions t where t.project_id = p.id and t.kind = 'expense' and t.voided_at is null), 0)::float8 as spent
      from projects p where p.status in ('approved','scheduled','ongoing','completed') order by p.id desc`,
    sql<Row[]>`
      select t.id, t.tx_date::text as tx_date, t.kind, t.description, t.reference, t.amount::float8 as amount,
             t.voided_at, t.void_reason, p.title as project
      from transactions t left join projects p on p.id = t.project_id
      order by t.tx_date desc, t.id desc limit 80`,
  ]);
  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="Fund transparency" title="Where the money is">
        The SK fund, what is set aside for funded projects, what has been spent, and every ledger entry.
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total SK fund" value={peso(f.total)} />
        <Stat label="Other income" value={peso(f.income)} />
        <Stat label="Spent so far" value={peso(f.expense)} />
        <Stat label="Set aside for projects" value={peso(f.committed)} />
        <Stat label="Still available" tone={f.available < 0 ? "red" : "green"} value={peso(f.available)} />
      </div>

      <div className="mt-14"><SectionHeader as="h3" title="Budget versus spending">How much of each funded project's budget has been used.</SectionHeader></div>
      {projects.length === 0 ? <Empty>No funded projects yet.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block card-link">
              <h3 className="font-display text-lg font-bold leading-snug">{p.title}</h3>
              <div className="mt-3"><ProgressBar value={pct(p.spent, p.budget)} label={`${peso(p.spent)} of ${peso(p.budget)}`} /></div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14"><SectionHeader as="h3" title="Ledger">Entries are never erased. A mistake is voided and stays visible with its reason.</SectionHeader></div>
      <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[620px] text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="py-3 pl-5 pr-2">Date</th><th className="pr-2">Description</th><th className="pr-2">Project</th><th className="pr-2">Ref</th><th className="pr-5 text-right">Amount</th></tr></thead>
          <tbody>
            {ledger.map((t) => (
              <tr key={t.id} className={`border-b border-slate-100 last:border-0 ${t.voided_at ? "text-slate-400" : ""}`}>
                <td className="whitespace-nowrap py-3 pl-5 pr-2">{fmtDate(t.tx_date, "short")}</td>
                <td className="py-3 pr-2"><span className={t.voided_at ? "line-through" : ""}>{t.description}</span>{t.voided_at && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">Voided: {t.void_reason}</span>}</td>
                <td className="py-3 pr-2 text-slate-600">{t.project ?? ""}</td>
                <td className="py-3 pr-2 font-mono text-xs text-slate-500">{t.reference ?? ""}</td>
                <td className={`whitespace-nowrap py-3 pr-5 text-right font-semibold tabular-nums ${t.voided_at ? "line-through" : t.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{t.kind === "income" ? "+" : "−"}{peso(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
