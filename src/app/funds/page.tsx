import Link from "next/link";
import { PageHeader, SectionHeader, Stat, Empty, ProgressBar } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { fundSummary } from "@/lib/funds";
import { fmtDate, peso, pct } from "@/lib/format";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("funds.title") };
}

export default async function FundsPage() {
  const [f, projects, ledger, { t }] = await Promise.all([
    fundSummary(),
    sql<Row[]>`
      select p.id, p.title, p.status, p.budget::float8 as budget,
             coalesce((select sum(t.amount) from transactions t where t.project_id = p.id and t.kind = 'expense' and t.voided_at is null), 0)::float8 as spent
      from projects p where p.status in ('approved','scheduled','ongoing','completed') order by p.id desc`,
    sql<Row[]>`
      select t.id, t.tx_date::text as tx_date, t.kind, t.description, t.reference, t.amount::float8 as amount,
             t.voided_at, t.void_reason, p.title as project,
             coalesce((select array_agg(r.id order by r.id) from transaction_receipts r where r.transaction_id = t.id and r.is_public), '{}') as receipts
      from transactions t left join projects p on p.id = t.project_id
      order by t.tx_date desc, t.id desc limit 80`,
    getT(),
  ]);
  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow={t("funds.title")} title={t("funds.heading")}>{t("funds.lead")}</PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t("funds.total")} value={peso(f.total)} />
        <Stat label={t("funds.income")} value={peso(f.income)} />
        <Stat label={t("funds.spent")} value={peso(f.expense)} />
        <Stat label={t("funds.committed")} value={peso(f.committed)} />
        <Stat label={t("funds.available")} tone={f.available < 0 ? "red" : "green"} value={peso(f.available)} />
      </div>
      <p className="mt-3 text-xs text-slate-500">{t("funds.computed")}</p>

      <div className="mt-14"><SectionHeader as="h3" title={t("funds.budgetTitle")}>{t("funds.budgetLead")}</SectionHeader></div>
      {projects.length === 0 ? <Empty>{t("funds.noProjects")}</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block card-link">
              <h3 className="font-display text-lg font-bold leading-snug">{p.title}</h3>
              <div className="mt-3"><ProgressBar value={pct(p.spent, p.budget)} label={t("funds.of", { spent: peso(p.spent), budget: peso(p.budget) })} /></div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14"><SectionHeader as="h3" title={t("funds.ledger")}>{t("funds.ledgerLead")}</SectionHeader></div>
      {ledger.length === 0 ? <Empty>{t("funds.empty")}</Empty> : (
        <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="py-3 pl-5 pr-2">{t("funds.date")}</th><th className="pr-2">{t("funds.description")}</th><th className="pr-2">{t("funds.project")}</th><th className="pr-2">{t("funds.or")}</th><th className="pr-2">{t("funds.receipt")}</th><th className="pr-5 text-right">{t("funds.amount")}</th></tr></thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id} className={`border-b border-slate-100 last:border-0 ${row.voided_at ? "text-slate-400" : ""}`}>
                  <td className="whitespace-nowrap py-3 pl-5 pr-2">{fmtDate(row.tx_date, "short")}</td>
                  <td className="py-3 pr-2"><span className={row.voided_at ? "line-through" : ""}>{row.description}</span>{row.voided_at && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{t("funds.voided", { reason: row.void_reason ?? "" })}</span>}</td>
                  <td className="py-3 pr-2 text-slate-600">{row.project ?? ""}</td>
                  <td className="py-3 pr-2 font-mono text-xs text-slate-500">{row.reference ?? ""}</td>
                  <td className="py-3 pr-2">
                    {(row.receipts as number[]).length > 0 ? (
                      <span className="flex gap-1.5">
                        {(row.receipts as number[]).map((rid, i) => (
                          <a key={rid} href={`/api/receipt/${rid}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-mist px-2 py-0.5 text-xs font-semibold text-flag-blue ring-1 ring-inset ring-slate-200 hover:ring-flag-blue">
                            <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                            {t("funds.view")}{(row.receipts as number[]).length > 1 ? ` ${i + 1}` : ""}
                          </a>
                        ))}
                      </span>
                    ) : row.kind === "expense" && !row.voided_at ? <span className="text-xs text-slate-400">{t("funds.none")}</span> : null}
                  </td>
                  <td className={`whitespace-nowrap py-3 pr-5 text-right font-semibold tabular-nums ${row.voided_at ? "line-through" : row.kind === "income" ? "text-emerald-700" : "text-flag-red"}`}>{row.kind === "income" ? "+" : "−"}{peso(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
