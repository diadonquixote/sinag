/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
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
export async function fundSummary(db: typeof sql = sql): Promise<FundSummary> {
  const [setting] = await db<Row[]>`select value from settings where key = 'total_fund'`;
  const total = toCentavos(String(setting?.value ?? "0"));

  const [ledger] = await db<Row[]>`
    select
      coalesce(sum(amount) filter (where kind = 'income'), 0)::text as income,
      coalesce(sum(amount) filter (where kind = 'expense'), 0)::text as expense
    from transactions
    where voided_at is null
  `;

  const [commit] = await db<Row[]>`
    select coalesce(sum(greatest(p.budget - coalesce(e.spent, 0), 0)), 0)::text as committed
    from projects p
    left join (
      select project_id, sum(amount) as spent
      from transactions where kind = 'expense' and voided_at is null group by project_id
    ) e on e.project_id = p.id
    where p.status in ('approved', 'scheduled', 'ongoing')
  `;

  return summarizeFund({
    total,
    income: toCentavos(ledger.income as string),
    expense: toCentavos(ledger.expense as string),
    committed: toCentavos(commit.committed as string),
  });
}

/**
 * The arithmetic on its own, in whole centavos, so it can be tested without a database:
 * available = annual fund + other income - spent - committed to funded projects.
 */
export function summarizeFund(c: { total: number; income: number; expense: number; committed: number }): FundSummary {
  const available = c.total + c.income - c.expense - c.committed;
  return {
    total: toPesos(c.total),
    income: toPesos(c.income),
    expense: toPesos(c.expense),
    committed: toPesos(c.committed),
    available: toPesos(available),
  };
}
