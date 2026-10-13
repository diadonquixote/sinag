import { headers } from "next/headers";
import { sql, type Row } from "./db";

/**
 * Slows down password guessing on the login form.
 *
 * Failed attempts are counted in the database rather than in memory, because the app runs on
 * serverless instances that start and stop: anything held in memory would be forgotten, and a
 * guesser would simply keep going. Counting per email stops one account being hammered;
 * counting per address stops someone trying one password against many accounts.
 *
 * A successful login clears that person's attempts, so an ordinary typo costs nothing.
 */

const WINDOW_MINUTES = 15;
const MAX_PER_EMAIL = 8;
const MAX_PER_ADDRESS = 30;

/** The visitor's address, as far as the host tells us. Empty when running locally. */
export async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  // The first entry is the original client; the rest are proxies.
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "";
  return ip.slice(0, 60);
}

function minutesLeft(oldest: Date): number {
  const elapsed = (Date.now() - oldest.getTime()) / 60000;
  return Math.max(1, Math.ceil(WINDOW_MINUTES - elapsed));
}

/**
 * Returns how many minutes the person must wait when they have been locked out, or null to let
 * them try. Called before the password is checked, so a locked account costs no work.
 */
export async function loginBlockedMinutes(email: string, address: string): Promise<number | null> {
  const scopes = [`email:${email}`, address ? `ip:${address}` : ""].filter(Boolean);
  if (!scopes.length) return null;

  const rows = await sql<Row[]>`
    select scope, count(*)::int as tries, min(created_at) as oldest
    from login_attempts
    where scope = any(${scopes}) and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
    group by scope
  `;

  for (const row of rows) {
    const scope = row.scope as string;
    const limit = scope.startsWith("email:") ? MAX_PER_EMAIL : MAX_PER_ADDRESS;
    if (Number(row.tries) >= limit) {
      return minutesLeft(new Date(row.oldest as string | Date));
    }
  }
  return null;
}

/** Records one failed attempt, and tidies away attempts old enough to no longer matter. */
export async function recordFailedLogin(email: string, address: string): Promise<void> {
  const scopes = [`email:${email}`, address ? `ip:${address}` : ""].filter(Boolean);
  try {
    await sql`insert into login_attempts (scope) select unnest(${scopes}::text[])`;
    await sql`delete from login_attempts where created_at < now() - interval '1 day'`;
  } catch (err) {
    // Never let bookkeeping stop someone logging in.
    console.error("login_attempts write failed:", err instanceof Error ? err.message : err);
  }
}

/** Clears the count after a correct password, so one bad day does not lock someone out later. */
export async function clearLoginAttempts(email: string, address: string): Promise<void> {
  const scopes = [`email:${email}`, address ? `ip:${address}` : ""].filter(Boolean);
  try {
    await sql`delete from login_attempts where scope = any(${scopes})`;
  } catch {
    // Not worth failing a successful login over.
  }
}

/**
 * Account requests, counted per connection in the same table, so the request form
 * cannot be used to flood the admin's approval list.
 */
const MAX_REQUESTS_PER_HOUR = 5;

export async function tooManyRequests(address: string): Promise<boolean> {
  if (!address) return false;
  const [row] = await sql<Row[]>`
    select count(*)::int as n from login_attempts
    where scope = ${`request:${address}`} and created_at > now() - interval '1 hour'`;
  return Number(row?.n ?? 0) >= MAX_REQUESTS_PER_HOUR;
}

export async function noteRequest(address: string): Promise<void> {
  if (!address) return;
  try {
    await sql`insert into login_attempts (scope) values (${`request:${address}`})`;
  } catch {
    // Bookkeeping only.
  }
}
