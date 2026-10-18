/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
// Empties a DEMO database and loads the demo data again.
//
//   SINAG_STAGE=demo npm run db:reset-demo
//
// Two locks so it can never wipe a real council's records:
//   1. it refuses unless SINAG_STAGE=demo, and
//   2. it refuses if any account in the database is not a @sinag.demo one.
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;

if (process.env.SINAG_STAGE !== "demo") {
  console.error("Refusing: SINAG_STAGE is not 'demo'. This command is only for demo databases.");
  process.exit(1);
}
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
let ok = false;
try {
  const [{ real }] = await sql`select count(*)::int as real from users where email not like '%@sinag.demo'`;
  if (real > 0) {
    throw new Error(`Refusing: this database has ${real} account(s) that are not demo accounts. It may be a real council's.`);
  }
  const tables = await sql`select tablename from pg_tables where schemaname = 'public'`;
  if (tables.length) {
    const list = tables.map((t) => `"${t.tablename}"`).join(", ");
    await sql.unsafe(`truncate table ${list} restart identity cascade`);
  }
  console.log(`Emptied ${tables.length} tables.`);
  ok = true;
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}

if (ok) {
  const run = spawnSync(process.execPath, [resolve(root, "scripts/db-setup.mjs"), "--seed"], { stdio: "inherit", env: process.env });
  process.exitCode = run.status ?? 1;
}
