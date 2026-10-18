/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
// Creates the Sinag tables, and optionally loads demo data.
//   npm run db:setup          -> create tables (safe to re-run)
//   npm run db:seed           -> create tables + load demo accounts and sample data
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Tiny .env loader so you don't need extra packages or Node flags.
function loadEnv(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnv(".env.local");
loadEnv(".env");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

const wantSeed = process.argv.includes("--seed");
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  console.log("Creating tables...");
  await sql.unsafe(readFileSync(resolve(root, "db/schema.sql"), "utf8"));
  console.log("Tables are ready.");

  if (wantSeed) {
    const password = process.env.SEED_PASSWORD || "sinag2026";
    if (/[{}]/.test(password)) throw new Error("SEED_PASSWORD must not contain { or }.");
    const seed = readFileSync(resolve(root, "db/seed.sql"), "utf8").replaceAll(
      "{{SEED_PASSWORD}}",
      password.replaceAll("'", "''"),
    );
    console.log("Loading demo data...");
    await sql.unsafe(seed);
    console.log("");
    console.log("Demo accounts (password: " + password + ")");
    for (const [role, email] of [
      ["Site admin", "admin@sinag.demo"],
      ["SK Chairperson", "chair@sinag.demo"],
      ["SK Secretary", "secretary@sinag.demo"],
      ["SK Treasurer", "treasurer@sinag.demo"],
      ["SK Kagawad", "kagawad@sinag.demo"],
      ["Kabataan", "youth1@sinag.demo"],
    ]) {
      console.log("  " + role.padEnd(16) + email);
    }
    console.log("");
    console.log("These are demo accounts. Do not leave them on a real deployment.");
  }
} catch (err) {
  console.error("Setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
