// Sets the password of every @sinag.demo account to SEED_PASSWORD from .env.local.
//   npm run db:passwords
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const url = process.env.DATABASE_URL;
const password = process.env.SEED_PASSWORD;
if (!url) { console.error("DATABASE_URL is not set in .env.local."); process.exit(1); }
if (!password || password.length < 8) { console.error("Set SEED_PASSWORD (at least 8 characters) in .env.local first."); process.exit(1); }

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  const rows = await sql`
    update users set password_hash = crypt(${password}, gen_salt('bf', 10))
    where email like '%@sinag.demo' returning email
  `;
  console.log(`Updated ${rows.length} demo accounts. They now use the SEED_PASSWORD in .env.local.`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
