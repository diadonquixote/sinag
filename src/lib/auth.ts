/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { sql, type Row } from "./db";
import type { Role } from "./roles";

/**
 * Login sessions.
 *
 * The cookie holds a signed token with the account id and a session number. The token alone
 * is never trusted for permissions: every protected page and action reads the account from
 * the database (requireRole), so a changed role, a turned-off account, or a password change
 * takes effect on the very next click.
 *
 * Revoking: users.session_version goes up when a password changes, when the admin resets or
 * turns off an account, or when someone presses "Log out everywhere". A cookie issued with an
 * older number stops working on every device at once.
 *
 * Cookie flags: HttpOnly (page scripts cannot read it), Secure in production (HTTPS only),
 * SameSite=Lax (not sent on cross-site form posts), and in production the __Host- prefix,
 * which makes the browser refuse it unless it is Secure, for this exact host, and path "/".
 */

const PRODUCTION = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = PRODUCTION ? "__Host-sinag_session" : "sinag_session";
const WEEK = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: number;
  name: string;
  role: Role;
  /** set when the user has a profile photo; changes when the photo changes */
  avatarV?: string | null;
};

type Claims = { id: number; name: string; role: Role; sv: number | null };

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (use 32 or more random characters). See .env.example.");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser & { sessionVersion: number }): Promise<void> {
  const token = await new SignJWT({ role: user.role, name: user.name, sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: PRODUCTION,
    path: "/",
    maxAge: WEEK,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

async function readClaims(): Promise<Claims | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const sv = typeof payload.sv === "number" ? payload.sv : null;
    return { id, name: String(payload.name ?? ""), role: payload.role as Role, sv };
  } catch {
    return null;
  }
}

/** Cheap check from the signed cookie. Good for showing the right header, not for permissions. */
export async function getSession(): Promise<SessionUser | null> {
  const claims = await readClaims();
  return claims ? { id: claims.id, name: claims.name, role: claims.role } : null;
}

/** The account behind the cookie, if it is active and the cookie has not been revoked. */
async function liveUser(): Promise<SessionUser | null> {
  const claims = await readClaims();
  if (!claims || claims.sv === null) return null;
  const rows = await sql<Row[]>`
    select id, name, role, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users
    where id = ${claims.id} and status = 'active' and session_version = ${claims.sv}`;
  const user = rows[0];
  if (!user) return null;
  return { id: user.id as number, name: user.name as string, role: user.role as Role, avatarV: (user.avatar_v as string | null) ?? null };
}

/**
 * Authoritative check: reads the user from the database so a changed role, a turned-off
 * account, a revoked session or a removed account takes effect immediately.
 * Use this for every protected page and action.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await liveUser();
  // A removed, turned-off, not-yet-approved or logged-out-everywhere account is treated as logged out.
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** Like requireRole but returns null instead of redirecting. For pages that adapt to who is looking. */
export async function currentUser(): Promise<SessionUser | null> {
  return liveUser();
}

/**
 * Makes every existing login cookie for this account stop working.
 * Returns the new number, so the caller can issue a fresh cookie for the person who is still here.
 */
export async function revokeSessions(userId: number): Promise<number> {
  const [row] = await sql<Row[]>`
    update users set session_version = session_version + 1 where id = ${userId} returning session_version`;
  return Number(row?.session_version ?? 0);
}
