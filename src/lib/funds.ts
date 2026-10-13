import { sql, type Row } from "./db";
import { toCentavos, toPesos } from "./money";

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

/**
 * Every figure is read from the database as exact text and added up in whole centavos
 * (see money.ts), so "available" is never off by a rounding error.
 */
export async function fundSummary(): Promise<FundSummary> {
  const [setting] = await sql<Row[]>`select value from settings where key = 'total_fund'`;
  const total = toCentavos(String(setting?.value ?? "0"));

  const [ledger] = await sql<Row[]>`
    select
      coalesce(sum(amount) filter (where kind = 'income'), 0)::text as income,
      coalesce(sum(amount) filter (where kind = 'expense'), 0)::text as expense
    from transactions
    where voided_at is null
  `;

  const [commit] = await sql<Row[]>`
    select coalesce(sum(greatest(p.budget - coalesce(e.spent, 0), 0)), 0)::text as committed
    from projects p
    left join (
      select project_id, sum(amount) as spent
      from transactions where kind = 'expense' and voided_at is null group by project_id
    ) e on e.project_id = p.id
    where p.status in ('approved', 'scheduled', 'ongoing')
  `;

  const income = toCentavos(ledger.income as string);
  const expense = toCentavos(ledger.expense as string);
  const committed = toCentavos(commit.committed as string);
  const available = total + income - expense - committed;
  return {
    total: toPesos(total),
    income: toPesos(income),
    expense: toPesos(expense),
    committed: toPesos(committed),
    available: toPesos(available),
  };
}
