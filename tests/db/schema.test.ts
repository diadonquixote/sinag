/**
 * Database tests. They run against DATABASE_URL after `npm run db:setup` (CI does this),
 * each inside a transaction that is rolled back, so they never leave anything behind.
 * Without DATABASE_URL they are skipped.
 */
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { toCentavos } from "@/lib/money";

const url = process.env.DATABASE_URL;
const sql = url ? postgres(url, { max: 1, prepare: false, onnotice: () => {} }) : null;
class Rollback extends Error {}

/** Runs fn in a transaction and always rolls it back. */
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

async function addUser(tx: postgres.TransactionSql, email: string, role: string, status = "active") {
  const [u] = await tx`
    insert into users (name, email, password_hash, role, status)
    values (${email.split("@")[0]}, ${email}, 'x', ${role}, ${status}) returning id, session_version, status`;
  return u;
}

describe.skipIf(!sql)("database rules", () => {
  afterAll(async () => { await sql?.end(); });

  it("accepts the site admin role and every account state, and nothing else", async () => {
    await inTx(async (tx) => {
      await addUser(tx, "admin@test.ph", "admin");
      for (const status of ["pending", "active", "disabled", "former", "removed"]) {
        await addUser(tx, `${status}@test.ph`, "kagawad", status);
      }
      await expect(addUser(tx, "bad@test.ph", "mayor")).rejects.toThrow(/users_role_check/);
    });
  });

  it("starts new accounts active with session number 1", async () => {
    await inTx(async (tx) => {
      const [u] = await tx`insert into users (name, email, password_hash, role) values ('A', 'a@test.ph', 'x', 'secretary') returning status, session_version`;
      expect(u.status).toBe("active");
      expect(u.session_version).toBe(1);
    });
  });

  it("refuses two accounts with the same email in different case", async () => {
    await inTx(async (tx) => {
      await addUser(tx, "same@test.ph", "kagawad");
      await expect(addUser(tx, "SAME@test.ph", "kagawad")).rejects.toThrow(/users_email_lower_idx/);
    });
  });

  it("keeps only active officials on the council listing", async () => {
    await inTx(async (tx) => {
      await addUser(tx, "chair@test.ph", "chairperson");
      await addUser(tx, "waiting@test.ph", "treasurer", "pending");
      await addUser(tx, "off@test.ph", "kagawad", "disabled");
      await addUser(tx, "past@test.ph", "kagawad", "former");
      await addUser(tx, "root@test.ph", "admin");
      const rows = await tx`
        select email from users where role in ('chairperson','secretary','treasurer','kagawad') and status = 'active'`;
      expect(rows.map((r) => r.email)).toEqual(["chair@test.ph"]);
    });
  });

  it("never lets an author of minutes be deleted out from under the record", async () => {
    await inTx(async (tx) => {
      const u = await addUser(tx, "author@test.ph", "secretary");
      await tx`insert into minutes (title, session_date, raw_notes, content, author_id) values ('Regular session', now()::date, 'notes', 'text', ${u.id})`;
      await expect(tx`delete from users where id = ${u.id}`).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("adds money exactly when read as text", async () => {
    await inTx(async (tx) => {
      const u = await addUser(tx, "treasurer@test.ph", "treasurer");
      for (let i = 0; i < 10; i++) {
        await tx`insert into transactions (kind, amount, description, tx_date, created_by) values ('expense', 0.10, 'ten centavos', now()::date, ${u.id})`;
      }
      const [row] = await tx`select sum(amount)::text as total from transactions where created_by = ${u.id}`;
      expect(toCentavos(row.total)).toBe(100);
    });
  });
});
