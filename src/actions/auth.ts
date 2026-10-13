"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql, type Row } from "@/lib/db";
import { createSession, destroySession, requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { OFFICIAL_ROLES, type Role } from "@/lib/roles";
import { clearLoginAttempts, clientAddress, loginBlockedMessage, recordFailedLogin } from "@/lib/rate-limit";

let dummyHash: string | null = null;

export async function login(fd: FormData): Promise<void> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) back("/login", "err", "Enter your email and password.");

  // Stop password guessing before doing any work on the attempt.
  const address = await clientAddress();
  const blocked = await loginBlockedMessage(email, address);
  if (blocked) back("/login", "err", blocked);

  const rows = await sql<Row[]>`select id, name, role, password_hash from users where lower(email) = ${email}`;
  const user = rows[0];

  // Compare against a dummy hash when the email is unknown so timing does not reveal which emails exist.
  if (!user) dummyHash ??= bcrypt.hashSync("sinag-dummy-password", 10);
  const ok = await bcrypt.compare(password, user ? (user.password_hash as string) : (dummyHash as string));
  if (!user || !ok) {
    await recordFailedLogin(email, address);
    back("/login", "err", "Wrong email or password.");
  }

  await clearLoginAttempts(email, address);
  await createSession({ id: user.id as number, name: user.name as string, role: user.role as Role });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Chairperson creates accounts for the other officials. */
export async function createOfficial(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "") as Role;
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) back("/dashboard/team", "err", "Enter the official's name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("/dashboard/team", "err", "Enter a valid email address.");
  if (!OFFICIAL_ROLES.includes(role) || role === "chairperson") back("/dashboard/team", "err", "Choose a position.");
  if (password.length < 8) back("/dashboard/team", "err", "The temporary password needs at least 8 characters.");

  const existing = await sql<Row[]>`select 1 as x from users where lower(email) = ${email}`;
  if (existing.length > 0) back("/dashboard/team", "err", "That email already has an account.");

  const hash = await bcrypt.hash(password, 10);
  const [created] = await sql<Row[]>`
    insert into users (name, email, password_hash, role)
    values (${name.slice(0, 120)}, ${email}, ${hash}, ${role})
    returning id
  `;
  await audit(chair.id, "created official account", "user", created.id as number, `${name} (${role})`);
  back("/dashboard/team", "ok", `Account created for ${name}. Share the temporary password with them privately.`);
}

/** Officials can change their own password. */
export async function changePassword(fd: FormData): Promise<void> {
  const user = await requireRole();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) back("/dashboard/profile", "err", "Use a new password with at least 8 characters.");

  const [row] = await sql<Row[]>`select password_hash from users where id = ${user.id}`;
  if (!row || !(await bcrypt.compare(current, row.password_hash as string))) {
    back("/dashboard/profile", "err", "Your current password is not correct.");
  }
  const hash = await bcrypt.hash(next, 10);
  await sql`update users set password_hash = ${hash} where id = ${user.id}`;
  back("/dashboard/profile", "ok", "Password changed.");
}
