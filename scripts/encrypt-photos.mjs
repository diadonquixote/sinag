// Encrypts photos that were stored before photo encryption was added.
//   npm run db:encrypt-photos
// Needs DATABASE_URL and PHOTO_ENCRYPTION_KEY (the same key the site uses; see .env.example).
// Safe to run again: photos that are already encrypted are skipped. Nothing is deleted, and each
// photo is checked by decrypting it again before it is written back.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnv(".env.local");
loadEnv(".env");

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set."); process.exit(1); }
const text = (process.env.PHOTO_ENCRYPTION_KEY || "").trim();
const key = /^[0-9a-fA-F]{64}$/.test(text) ? Buffer.from(text, "hex") : Buffer.from(text, "base64");
if (key.length !== 32) { console.error("PHOTO_ENCRYPTION_KEY must be 32 random bytes: openssl rand -base64 32"); process.exit(1); }

// The same layout as src/lib/crypto.ts: "SNG1" | iv (12) | tag (16) | ciphertext
const MAGIC = Buffer.from("SNG1", "ascii");
function encrypt(plain) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}
function decrypt(stored) {
  const d = createDecipheriv("aes-256-gcm", key, stored.subarray(4, 16));
  d.setAuthTag(stored.subarray(16, 32));
  return Buffer.concat([d.update(stored.subarray(32)), d.final()]);
}

// table, column holding the photo
const TARGETS = [
  ["users", "avatar"],
  ["minutes_photos", "data"],
  ["transaction_receipts", "data"],
];

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  for (const [table, column] of TARGETS) {
    const ids = await sql.unsafe(
      `select id from ${table} where ${column} is not null and substring(${column} from 1 for 4) <> '\\x534e4731'::bytea order by id`,
    );
    let done = 0;
    for (const { id } of ids) {
      const [row] = await sql.unsafe(`select ${column} as photo from ${table} where id = $1`, [id]);
      const plain = Buffer.from(row.photo);
      const stored = encrypt(plain);
      if (!decrypt(stored).equals(plain)) throw new Error(`Check failed for ${table} ${id}; nothing was changed for it.`);
      await sql.unsafe(`update ${table} set ${column} = $1 where id = $2 and substring(${column} from 1 for 4) <> '\\x534e4731'::bytea`, [stored, id]);
      done++;
    }
    console.log(`${table}: ${done} photo${done === 1 ? "" : "s"} encrypted, ${ids.length - done} skipped.`);
  }
  console.log("Done. Keep a copy of PHOTO_ENCRYPTION_KEY somewhere safe: without it these photos cannot be read.");
} finally {
  await sql.end();
}
