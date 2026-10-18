/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * The fund summary against a real database. Like schema.test.ts, it runs inside a transaction
 * that is rolled back, and is skipped without DATABASE_URL. It compares against the figures
 * before it adds anything, so existing rows in the database cannot break it.
 */
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { fundSummary } from "@/lib/funds";
import type { sql as appSql } from "@/lib/db";

const url = process.env.DATABASE_URL;
const sql = url ? postgres(url, { max: 1, prepare: false, onnotice: () => {} }) : null;
class Rollback extends Error {}

async function inTx(fn: (tx: postgres.TransactionSql) => Promise<void>) {
  try {
    await sql!.begin(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  }
}

const asDb = (tx: postgres.TransactionSql) => tx as unknown as typeof appSql;

describe.skipIf(!sql)("fundSummary", () => {
  afterAll(async () => { await sql?.end(); });

  it("adds up the ledger and the funded projects exactly, and ignores voided entries", async () => {
    await inTx(async (tx) => {
      await tx`insert into settings (key, value) values ('total_fund', '100000.00')
               on conflict (key) do update set value = excluded.value`;
      const before = await fundSummary(asDb(tx));
      expect(before.total).toBe(100000);

      await tx`insert into transactions (kind, amount, description) values ('income', 5000.50, 'Donation')`;
      await tx`insert into transactions (kind, amount, description) values ('expense', 1200.25, 'Snacks')`;
      // A voided entry is kept on the record but never counted.
      await tx`insert into transactions (kind, amount, description, voided_at, void_reason)
               values ('expense', 9999.99, 'Entered twice', now(), 'duplicate')`;

      const after = await fundSummary(asDb(tx));
      expect(after.income - before.income).toBe(5000.5);
      expect(after.expense - before.expense).toBe(1200.25);
      expect(Math.round((after.available - before.available) * 100)).toBe(Math.round((5000.5 - 1200.25) * 100));
    });
  });

  it("commits only what a funded project has not spent yet", async () => {
    await inTx(async (tx) => {
      await tx`insert into settings (key, value) values ('total_fund', '100000.00')
               on conflict (key) do update set value = excluded.value`;
      const before = await fundSummary(asDb(tx));

      const [open] = await tx`insert into projects (title, description, category, budget, status)
        values ('Reading program', 'x', 'Edukasyon', 20000, 'approved') returning id`;
      await tx`insert into transactions (project_id, kind, amount, description) values (${open.id}, 'expense', 3000, 'Books')`;

      // Overspent: spent more than its budget, so it commits nothing (never a negative number).
      const [over] = await tx`insert into projects (title, description, category, budget, status)
        values ('Clean-up drive', 'x', 'Kalikasan', 1000, 'ongoing') returning id`;
      await tx`insert into transactions (project_id, kind, amount, description) values (${over.id}, 'expense', 1500, 'Bags')`;

      // Finished and proposed projects hold no money.
      await tx`insert into projects (title, description, category, budget, status) values ('Done', 'x', 'Palakasan', 8000, 'completed')`;
      await tx`insert into projects (title, description, category, budget, status) values ('Idea', 'x', 'Iba pa', 8000, 'proposed')`;

      const after = await fundSummary(asDb(tx));
      expect(Math.round((after.committed - before.committed) * 100)).toBe(17000 * 100);
      // available drops by what was spent (3000 + 1500) plus what is still committed (17000)
      expect(Math.round((before.available - after.available) * 100)).toBe((3000 + 1500 + 17000) * 100);
    });
  });
});
