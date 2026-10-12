import { sql, type Row } from "./db";

export type FundSummary = {
  /** Annual SK fund set by the treasurer. */
  total: number;
  /** Other money received (donations, sponsors). */
  income: number;
  /** Everything actually spent so far. */
  expense: number;
  /** Budgets of funded projects that have not been spent yet. */
  committed: number;
  /** What is still free to commit to a new project. */
  available: number;
};

export async function fundSummary(): Promise<FundSummary> {
  const [setting] = await sql<Row[]>`select value from settings where key = 'total_fund'`;
  const total = Number(setting?.value ?? 0) || 0;

  const [ledger] = await sql<Row[]>`
    select
      coalesce(sum(amount) filter (where kind = 'income'), 0)::float8 as income,
      coalesce(sum(amount) filter (where kind = 'expense'), 0)::float8 as expense
    from transactions
    where voided_at is null
  `;

  const [commit] = await sql<Row[]>`
    select coalesce(sum(greatest(p.budget - coalesce(e.spent, 0), 0)), 0)::float8 as committed
    from projects p
    left join (
      select project_id, sum(amount) as spent
      from transactions where kind = 'expense' and voided_at is null group by project_id
    ) e on e.project_id = p.id
    where p.status in ('approved', 'scheduled', 'ongoing')
  `;

  const income = Number(ledger.income);
  const expense = Number(ledger.expense);
  const committed = Number(commit.committed);
  return { total, income, expense, committed, available: total + income - expense - committed };
}
