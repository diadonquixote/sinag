import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { sql, type Row } from "./db";
import type { Role } from "./roles";

const COOKIE = "sinag_session";
const WEEK = 60 * 60 * 24 * 7;

export type SessionUser = { id: number; name: string; role: Role; /** set when the user has a profile photo; changes when the photo changes */ avatarV?: string | null };

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (use 16+ random characters). See .env.example.");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Cheap check from the signed cookie. Good for showing the right header, not for permissions. */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return { id, name: String(payload.name ?? ""), role: payload.role as Role };
  } catch {
    return null;
  }
}

/**
 * Authoritative check: reads the user from the database so a changed role or
 * a removed account takes effect immediately. Use this for every protected page and action.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await sql<Row[]>`select id, name, role, extract(epoch from avatar_updated_at)::bigint::text as avatar_v from users where id = ${session.id}`;
  const user = rows[0];
  if (!user) redirect("/login");

  if (roles.length > 0 && !roles.includes(user.role as Role)) redirect("/dashboard");
  return { id: user.id as number, name: user.name as string, role: user.role as Role, avatarV: (user.avatar_v as string | null) ?? null };
}

/** Like requireRole but returns null instead of redirecting. For pages that adapt to who is looking. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const rows = await sql<Row[]>`select id, name, role, extract(epoch from avatar_updated_at)::bigint::text as avatar_v from users where id = ${session.id}`;
  const user = rows[0];
  if (!user) return null;
  return { id: user.id as number, name: user.name as string, role: user.role as Role, avatarV: (user.avatar_v as string | null) ?? null };
}
