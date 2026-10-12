import Link from "next/link";
import { PageHeader, Stat, Empty, ProgressBar } from "@/components/ui";
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
    <div className="container-x py-12">
      <PageHeader eyebrow="Fund transparency" title="Where the money is">
        The SK fund, what is set aside for funded projects, what has been spent, and every ledger entry.
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total SK fund" value={peso(f.total)} />
        <Stat label="Other income" value={peso(f.income)} />
        <Stat label="Spent so far" value={peso(f.expense)} />
        <Stat label="Set aside for projects" value={peso(f.committed)} />
        <Stat label="Still available" value={peso(f.available)} />
      </div>

      <h2 className="mt-12 text-2xl font-bold">Budget versus spending</h2>
      {projects.length === 0 ? <div className="mt-4"><Empty>No funded projects yet.</Empty></div> : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block hover:border-flag-blue/40">
              <h3 className="font-bold">{p.title}</h3>
              <div className="mt-3"><ProgressBar value={pct(p.spent, p.budget)} label={`${peso(p.spent)} of ${peso(p.budget)}`} /></div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-12 text-2xl font-bold">Ledger</h2>
      <p className="mt-1 text-sm text-slate-600">Entries are never erased. A mistake is voided and stays visible with its reason.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Date</th><th>Description</th><th>Project</th><th>Ref</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {ledger.map((t) => (
              <tr key={t.id} className={`border-b border-slate-100 ${t.voided_at ? "text-slate-400" : ""}`}>
                <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(t.tx_date, "short")}</td>
                <td className="pr-2"><span className={t.voided_at ? "line-through" : ""}>{t.description}</span>{t.voided_at && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">Voided: {t.void_reason}</span>}</td>
                <td className="pr-2">{t.project ?? ""}</td>
                <td className="pr-2">{t.reference ?? ""}</td>
                <td className={`text-right font-semibold ${t.voided_at ? "line-through" : t.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{t.kind === "income" ? "+" : "−"}{peso(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
