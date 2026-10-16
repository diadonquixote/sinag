"use server";

import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { fundSummary } from "@/lib/funds";
import { narrateReport } from "@/lib/ai";
import { fmtDate, peso, todayManila } from "@/lib/format";
import type { ReportData, ReportLine } from "@/lib/types";
import { decodeImage } from "@/lib/images";
import { encryptPhoto } from "@/lib/crypto";
import { centavosToNumeric, parsePesoInput, sumCentavos, toCentavos, toPesos } from "@/lib/money";

const MAX_RECEIPTS = 3;
const MAX_RECEIPT_BYTES = 1_000_000; // 1 MB hard limit. The browser squeezes photos to about 250 KB first (client-image.ts)

/** Receipt photos sent with a form. Returns null if any of them is not a usable image. */
function receiptPhotos(fd: FormData) {
  const raw = fd.getAll("receipts").map(String).filter(Boolean);
  if (raw.length > MAX_RECEIPTS) return null;
  const decoded = raw.map((d) => decodeImage(d, MAX_RECEIPT_BYTES));
  return decoded.every(Boolean) ? (decoded as NonNullable<(typeof decoded)[number]>[]) : null;
}

async function saveReceipts(txId: number, photos: { bytes: Buffer; type: string }[], isPublic: boolean, userId: number) {
  for (const p of photos) {
    await sql`insert into transaction_receipts (transaction_id, data, type, is_public, created_by) values (${txId}, ${encryptPhoto(p.bytes)}, ${p.type}, ${isPublic}, ${userId})`;
  }
}

const DESK = "/dashboard/treasurer";


export async function setFund(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer", "chairperson");
  const centavos = parsePesoInput(fd.get("total_fund"), 1_000_000_000, { allowZero: true });
  if (centavos === null) back(DESK, "err", "Enter the total SK fund in pesos, with at most two decimal places.");
  const total = toPesos(centavos);
  await sql`
    insert into settings (key, value) values ('total_fund', ${centavosToNumeric(centavos)})
    on conflict (key) do update set value = excluded.value
  `;
  await audit(user.id, "set total fund", "settings", null, peso(total));
  back(DESK, "ok", "Total fund updated.");
}

export async function addTransaction(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const kind = fd.get("kind") === "income" ? "income" : "expense";
  const amountCentavos = parsePesoInput(fd.get("amount"), 1_000_000_000);
  const description = String(fd.get("description") ?? "").trim();
  const category = String(fd.get("category") ?? "").trim().slice(0, 60) || null;
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 60) || null;
  const date = String(fd.get("tx_date") ?? "") || todayManila();
  const projectRaw = String(fd.get("project_id") ?? "");
  const projectId = projectRaw ? Number(projectRaw) : null;

  if (amountCentavos === null) back(DESK, "err", "Enter an amount greater than zero, with at most two decimal places.");
  const amount = toPesos(amountCentavos);
  if (description.length < 3) back(DESK, "err", "Describe what this entry is for.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(DESK, "err", "Pick the date of the transaction.");
  const receipts = receiptPhotos(fd);
  if (receipts === null) back(DESK, "err", `A receipt photo could not be used. Add up to ${MAX_RECEIPTS} JPG or PNG photos.`);

  if (projectId !== null) {
    const [project] = await sql<Row[]>`select status from projects where id = ${projectId}`;
    if (!project) back(DESK, "err", "That project does not exist.");
    if (kind === "expense" && !["approved", "scheduled", "ongoing", "completed"].includes(project.status as string)) {
      back(DESK, "err", "That project has not been funded yet, so spending cannot be charged to it.");
    }
  }

  const [row] = await sql<Row[]>`
    insert into transactions (project_id, kind, amount, description, category, tx_date, reference, created_by)
    values (${projectId}, ${kind}, ${centavosToNumeric(amountCentavos)}, ${description.slice(0, 200)}, ${category}, ${date}::date, ${reference}, ${user.id})
    returning id
  `;
  await saveReceipts(row.id as number, receipts, fd.get("receipts_public") === "1", user.id);
  await audit(user.id, `recorded ${kind}`, "transaction", row.id as number, `${peso(amount)} ${description}${receipts.length ? " (with receipt)" : ""}`);
  back(DESK, "ok", `${kind === "income" ? "Income" : "Expense"} recorded${receipts.length ? " with the receipt" : ""}.`);
}

/** Adds receipt photos to an entry that was recorded without one. */
export async function addReceipts(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) back(DESK, "err", "Entry not found.");
  const receipts = receiptPhotos(fd);
  if (receipts === null || receipts.length === 0) back(DESK, "err", `Choose up to ${MAX_RECEIPTS} receipt photos (JPG or PNG).`);

  const [tx] = await sql<Row[]>`
    select t.description, (select count(*)::int from transaction_receipts r where r.transaction_id = t.id) as n
    from transactions t where t.id = ${id}`;
  if (!tx) back(DESK, "err", "Entry not found.");
  if (Number(tx.n) + receipts.length > MAX_RECEIPTS * 2) back(DESK, "err", "This entry already has the most receipt photos allowed.");

  await saveReceipts(id, receipts, fd.get("receipts_public") === "1", user.id);
  await audit(user.id, "added receipt", "transaction", id, tx.description as string);
  back(DESK, "ok", "Receipt added to the entry.");
}

/** Removes a wrong receipt photo. Kept in the audit log so removals are visible. */
export async function removeReceipt(fd: FormData): Promise<void> {
  const user = await requireRole("treasurer");
  const id = Number(fd.get("receipt_id"));
  if (!Number.isInteger(id)) back(DESK, "err", "Receipt not found.");
  const rows = await sql<Row[]>`delete from transaction_receipts where id = ${id} returning transaction_id`;
  if (rows.length === 0) back(DESK, "err", "That receipt was already removed.");
  await audit(user.id, "removed receipt", "transaction", rows[0].transaction_id as number);
  back(DESK, "ok", "Receipt photo removed.");
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
           t.amount::text as amount, p.title as project,
           (select count(*)::int from transaction_receipts r where r.transaction_id = t.id) as receipts
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
    amount: toPesos(toCentavos(r.amount as string)),
    reference: (r.reference as string) ?? null,
    receipts: Number(r.receipts ?? 0),
  }));

  // Added up in whole centavos so the totals are exact (see money.ts).
  const income = toPesos(sumCentavos(lines.filter((l) => l.kind === "income").map((l) => toCentavos(l.amount))));
  const expense = toPesos(sumCentavos(lines.filter((l) => l.kind === "expense").map((l) => toCentavos(l.amount))));

  const catMap = new Map<string, number>();
  for (const l of lines) {
    if (l.kind !== "expense") continue;
    const key = l.category || "Uncategorized";
    catMap.set(key, (catMap.get(key) ?? 0) + toCentavos(l.amount));
  }
  const byCategory = [...catMap.entries()]
    .map(([category, centavos]) => ({ category, amount: toPesos(centavos) }))
    .sort((a, b) => b.amount - a.amount);

  const projectSpend = await sql<Row[]>`
    select p.title as project, p.budget::text as budget,
           coalesce(sum(t.amount) filter (where t.tx_date between ${from}::date and ${to}::date), 0)::text as spent_in_period,
           coalesce(sum(t.amount), 0)::text as spent_total
    from projects p
    join transactions t on t.project_id = p.id and t.kind = 'expense' and t.voided_at is null
    group by p.id
    having coalesce(sum(t.amount) filter (where t.tx_date between ${from}::date and ${to}::date), 0) > 0
    order by spent_in_period desc
  `;
  const byProject = projectSpend.map((r) => ({
    project: r.project as string,
    budget: toPesos(toCentavos(r.budget as string)),
    spent: toPesos(toCentavos(r.spent_in_period as string)),
  }));

  const funds = await fundSummary();
  const flags: string[] = [];
  if (lines.length === 0) flags.push("There are no recorded transactions in this period.");
  if (funds.available < 0) flags.push(`The fund is overcommitted by ${peso(Math.abs(funds.available))}.`);
  for (const r of projectSpend) {
    if (toCentavos(r.spent_total as string) > toCentavos(r.budget as string)) {
      flags.push(`${r.project} has spent ${peso(r.spent_total as string)}, which is more than its budget of ${peso(r.budget as string)}.`);
    }
  }
  const noRef = lines.filter((l) => l.kind === "expense" && !l.reference && !l.receipts).length;
  if (noRef > 0) flags.push(`${noRef} expense ${noRef === 1 ? "entry has" : "entries have"} no receipt photo or reference number.`);

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
