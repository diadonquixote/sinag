// Creates the first account on a fresh database, or gives an existing account a role.
//
//   npm run db:admin    the site admin, who creates the SK Chairperson's account
//   npm run db:chair    the SK Chairperson, for a council that runs without a separate admin
//
// There is no sign-up: the admin creates the Chairperson's account, and the Chairperson adds
// the rest of the council. A brand-new database has nobody to start that chain, and this is
// that first step. Run it once, then log in.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
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
if (!url) {
  console.error("DATABASE_URL is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

/** Thrown when the person answers "no": not an error, just a clean way out of the prompts. */
class Cancelled extends Error {}

const ROLE = process.argv.includes("--admin") ? "admin" : "chairperson";
const LABEL = ROLE === "admin" ? "site admin" : "SK Chairperson";

const rl = createInterface({ input: stdin, output: stdout });
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  console.log("");
  console.log(`  Set up the ${LABEL} account.`);
  console.log("  The password is shown as you type it, so nobody should be looking over your shoulder.");
  console.log("");

  const email = (await rl.question("  Email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That is not a valid email address.");

  const [existing] = await sql`select id, name, role, status from users where lower(email) = ${email}`;

  if (existing) {
    console.log(`\n  That email already belongs to ${existing.name} (${existing.role}, ${existing.status}).`);
    const answer = (await rl.question(`  Make this account the ${LABEL}? (yes/no): `)).trim().toLowerCase();
    if (answer !== "yes" && answer !== "y") throw new Cancelled();
    const newPassword = (await rl.question("  New password (leave blank to keep the current one): ")).trim();
    if (newPassword && newPassword.length < 8) throw new Error("The password needs at least 8 characters.");

    if (newPassword) {
      await sql`update users set role = ${ROLE}, status = 'active', password_hash = crypt(${newPassword}, gen_salt('bf', 10)) where id = ${existing.id}`;
    } else {
      await sql`update users set role = ${ROLE}, status = 'active' where id = ${existing.id}`;
    }
    console.log(`\n  Done. ${existing.name} is now the ${LABEL}.`);
  } else {
    const name = (await rl.question("  Full name: ")).trim();
    if (name.length < 2) throw new Error("Please enter a full name.");
    const password = (await rl.question("  Password (at least 8 characters): ")).trim();
    if (password.length < 8) throw new Error("The password needs at least 8 characters.");

    const [created] = await sql`
      insert into users (name, email, password_hash, role, status)
      values (${name.slice(0, 120)}, ${email}, crypt(${password}, gen_salt('bf', 10)), ${ROLE}, 'active')
      returning id, name
    `;
    console.log(`\n  Done. ${created.name} can now log in as the ${LABEL}.`);
  }

  if (ROLE === "chairperson") {
    const [{ count }] = await sql`select count(*)::int as count from users where role = 'chairperson' and status = 'active'`;
    if (count > 1) console.log(`\n  Note: there are now ${count} chairperson accounts. Usually there should be one.`);
  }
  console.log(ROLE === "admin"
    ? "  Log in, then create the SK Chairperson's account from the Accounts page.\n"
    : "  Log in, then add your secretary, treasurer and kagawads from the Team page.\n");
} catch (err) {
  if (err instanceof Cancelled) {
    console.log("\n  Nothing changed.\n");
  } else {
    console.error("\n  Failed: " + err.message + "\n");
    process.exitCode = 1;
  }
} finally {
  rl.close();
  await sql.end();
}
