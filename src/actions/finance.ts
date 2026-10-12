"use server";

import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { fundSummary } from "@/lib/funds";
import { narrateReport } from "@/lib/ai";
import { fmtDate, peso, todayManila } from "@/lib/format";
import type { ReportData, ReportLine } from "@/lib/types";

const DESK = "/dashboard/treasurer";

function money(value: FormDataEntryValue | null): number {
  return Number(String(value ?? "0").replace(/[^\d.]/g, ""));
}

export async function setFund(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer", "chairperson");
  const total = money(fd.get("total_fund"));
  if (!Number.isFinite(total) || total < 0 || total > 1_000_000_000) back(DESK, "err", "Enter the total SK fund in pesos.");
  await sql`
    insert into settings (key, value) values ('total_fund', ${String(total)})
    on conflict (key) do update set value = excluded.value
  `;
  await audit(user.id, "set total fund", "settings", null, peso(total));
  back(DESK, "ok", "Total fund updated.");
}

export async function addTransaction(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const kind = fd.get("kind") === "income" ? "income" : "expense";
  const amount = money(fd.get("amount"));
  const description = String(fd.get("description") ?? "").trim();
  const category = String(fd.get("category") ?? "").trim().slice(0, 60) || null;
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 60) || null;
  const date = String(fd.get("tx_date") ?? "") || todayManila();
  const projectRaw = String(fd.get("project_id") ?? "");
  const projectId = projectRaw ? Number(projectRaw) : null;

  if (!(amount > 0) || amount > 1_000_000_000) back(DESK, "err", "Enter an amount greater than zero.");
  if (description.length < 3) back(DESK, "err", "Describe what this entry is for.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(DESK, "err", "Pick the date of the transaction.");

  if (projectId !== null) {
    const [project] = await sql<Row[]>`select status from projects where id = ${projectId}`;
    if (!project) back(DESK, "err", "That project does not exist.");
    if (kind === "expense" && !["approved", "scheduled", "ongoing", "completed"].includes(project.status as string)) {
      back(DESK, "err", "That project has not been funded yet, so spending cannot be charged to it.");
    }
  }

  const [row] = await sql<Row[]>`
    insert into transactions (project_id, kind, amount, description, category, tx_date, reference, created_by)
    values (${projectId}, ${kind}, ${amount}, ${description.slice(0, 200)}, ${category}, ${date}::date, ${reference}, ${user.id})
    returning id
  `;
  await audit(user.id, `recorded ${kind}`, "transaction", row.id as number, `${peso(amount)} ${description}`);
  back(DESK, "ok", `${kind === "income" ? "Income" : "Expense"} recorded.`);
}

/** Mistakes are voided, not deleted. The entry stays visible with its reason. */
export async function voidTransaction(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const id = Number(fd.get("id"));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 200);
  if (!Number.isInteger(id)) back(DESK, "err", "Entry not found.");
  if (reason.length < 4) back(DESK, "err", "Please write a short reason for voiding this entry.");

  const rows = await sql<Row[]>`
    update transactions set voided_at = now(), void_reason = ${reason}
    where id = ${id} and voided_at is null returning description
  `;
  if (rows.length === 0) back(DESK, "err", "That entry is already voided.");
  await audit(user.id, "voided entry", "transaction", id, reason);
  back(DESK, "ok", "Entry voided. It stays on the record, marked with your reason.");
}

/** Builds a report from the ledger. Every number is computed here; the AI only writes the summary words. */
export async function createReport(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const title = String(fd.get("title") ?? "").trim();
  const from = String(fd.get("from") ?? "");
  const to = String(fd.get("to") ?? "");
  if (title.length < 4) back(DESK, "err", "Give the report a title, for example 'Financial report, September'.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) back(DESK, "err", "Pick the start and end dates.");
  if (from > to) back(DESK, "err", "The start date must be before the end date.");

  const rows = await sql<Row[]>`
    select t.tx_date::text as date, t.kind, t.description, t.category, t.reference,
           t.amount::float8 as amount, p.title as project
    from transactions t
    left join projects p on p.id = t.project_id
    where t.voided_at is null and t.tx_date between ${from}::date and ${to}::date
    order by t.tx_date, t.id
  `;
  const lines: ReportLine[] = rows.map((r) => ({
    date: r.date as string,
    kind: r.kind as "income" | "expense",
    description: r.description as string,
    category: (r.category as string) ?? null,
    project: (r.project as string) ?? null,
    amount: Number(r.amount),
    reference: (r.reference as string) ?? null,
  }));

  const income = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
  const expense = lines.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount, 0);

  const catMap = new Map<string, number>();
  for (const l of lines) {
    if (l.kind !== "expense") continue;
    const key = l.category || "Uncategorized";
    catMap.set(key, (catMap.get(key) ?? 0) + l.amount);
  }
  const byCategory = [...catMap.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

  const projectSpend = await sql<Row[]>`
    select p.title as project, p.budget::float8 as budget,
           coalesce(sum(t.amount) filter (where t.tx_date between ${from}::date and ${to}::date), 0)::float8 as spent_in_period,
           coalesce(sum(t.amount), 0)::float8 as spent_total
    from projects p
    join transactions t on t.project_id = p.id and t.kind = 'expense' and t.voided_at is null
    group by p.id
    having coalesce(sum(t.amount) filter (where t.tx_date between ${from}::date and ${to}::date), 0) > 0
    order by spent_in_period desc
  `;
  const byProject = projectSpend.map((r) => ({
    project: r.project as string,
    budget: Number(r.budget),
    spent: Number(r.spent_in_period),
  }));

  const funds = await fundSummary();
  const flags: string[] = [];
  if (lines.length === 0) flags.push("There are no recorded transactions in this period.");
  if (funds.available < 0) flags.push(`The fund is overcommitted by ${peso(Math.abs(funds.available))}.`);
  for (const r of projectSpend) {
    if (Number(r.spent_total) > Number(r.budget)) {
      flags.push(`${r.project} has spent ${peso(Number(r.spent_total))}, which is more than its budget of ${peso(Number(r.budget))}.`);
    }
  }
  const noRef = lines.filter((l) => l.kind === "expense" && !l.reference).length;
  if (noRef > 0) flags.push(`${noRef} expense ${noRef === 1 ? "entry has" : "entries have"} no receipt or reference number.`);

  const data: ReportData = {
    period: { from, to },
    income,
    expense,
    net: income - expense,
    fund: { total: funds.total, committed: funds.committed, available: funds.available },
    byCategory,
    byProject,
    lines,
    flags,
  };

  const { text, usedAI } = await narrateReport({
    period: { from: fmtDate(from), to: fmtDate(to) },
    income: data.income,
    expense: data.expense,
    net: data.net,
    fund: data.fund,
    byCategory: data.byCategory,
    byProject: data.byProject,
    flags: data.flags,
  });
  data.used_ai = usedAI;

  const [row] = await sql<Row[]>`
    insert into reports (title, period, content, data, author_id)
    values (${title.slice(0, 160)}, ${`${fmtDate(from)} to ${fmtDate(to)}`}, ${text}, ${sql.json(data as never)}, ${user.id})
    returning id
  `;
  await audit(user.id, "drafted report", "report", row.id as number, title);
  back(
    `/dashboard/reports/${row.id}`,
    "ok",
    usedAI
      ? "Report drafted from the ledger. Check the summary, then submit it for approval."
      : "Report drafted from the ledger with a simple summary (AI was not available). Check it, then submit it for approval.",
  );
}
