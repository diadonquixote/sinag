"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql, type Row } from "@/lib/db";
import { createSession, destroySession, requireRole, revokeSessions } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/lib/privacy";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { OFFICIAL_ROLES, ROLE_HOME, type Role } from "@/lib/roles";
import { clearLoginAttempts, clientAddress, loginBlockedMessage, noteRequest, recordFailedLogin, tooManyRequests } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let dummyHash: string | null = null;

export async function login(fd: FormData): Promise<void> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) back("/login", "err", "Enter your email and password.");

  // Stop password guessing before doing any work on the attempt.
  const address = await clientAddress();
  const blocked = await loginBlockedMessage(email, address);
  if (blocked) back("/login", "err", blocked);

  const rows = await sql<Row[]>`select id, name, role, status, session_version, password_hash from users where lower(email) = ${email}`;
  const user = rows[0];

  // Compare against a dummy hash when the email is unknown so timing does not reveal which emails exist.
  if (!user) dummyHash ??= bcrypt.hashSync("sinag-dummy-password", 10);
  const ok = await bcrypt.compare(password, user ? (user.password_hash as string) : (dummyHash as string));
  if (!user || !ok) {
    await recordFailedLogin(email, address);
    back("/login", "err", "Wrong email or password.");
  }

  await clearLoginAttempts(email, address);
  // Only said after the right password, so this never tells a stranger who has an account.
  if (user.status === "pending") back("/login", "err", "Your account is waiting for the site admin to approve it. You will be able to log in once they do.");
  if (user.status !== "active") back("/login", "err", "This account is not active. Please contact the site admin.");
  await createSession({ id: user.id as number, name: user.name as string, role: user.role as Role, sessionVersion: Number(user.session_version) });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/**
 * An elected official asks for an account. It is created as 'pending' and does nothing
 * until the site admin checks them against the list of elected officials and approves it.
 */
export async function requestAccess(fd: FormData): Promise<void> {
  const path = "/request-access";
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "") as Role;
  const note = String(fd.get("note") ?? "").trim();
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) back(path, "err", "Enter your full name as it appears on the list of elected officials.");
  if (!EMAIL.test(email)) back(path, "err", "Enter a valid email address.");
  if (!OFFICIAL_ROLES.includes(role)) back(path, "err", "Choose your position.");
  if (note.length < 5) back(path, "err", "Tell the admin how to confirm it is you.");
  if (password.length < 8) back(path, "err", "Use a password with at least 8 characters.");
  if (fd.get("confirm") !== "on") back(path, "err", "Please confirm that you are an elected SK official.");
  if (fd.get("privacy") !== "on") back(path, "err", "Please read and agree to the privacy notice before sending your request.");

  const address = await clientAddress();
  if (await tooManyRequests(address)) back(path, "err", "Too many requests from this connection. Please try again in an hour.");

  const existing = await sql<Row[]>`select 1 as x from users where lower(email) = ${email}`;
  if (existing.length > 0) back(path, "err", "That email already has an account or a request waiting. Log in, or contact the site admin.");

  const hash = await bcrypt.hash(password, 10);
  const [created] = await sql<Row[]>`
    insert into users (name, email, password_hash, role, status, request_note, privacy_accepted_at, privacy_version)
    values (${name.slice(0, 120)}, ${email}, ${hash}, ${role}, 'pending', ${note.slice(0, 500)}, now(), ${PRIVACY_VERSION})
    returning id
  `;
  await noteRequest(address);
  await audit(created.id as number, "requested an account", "user", created.id as number, `${name} (${role})`);
  back("/login", "ok", "Request sent. The site admin will check it against the list of elected officials. You can log in once it is approved.");
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
  // Anyone else logged in as this person, on any device, is logged out. This device stays in.
  const version = await revokeSessions(user.id);
  await createSession({ ...user, sessionVersion: version });
  await audit(user.id, "changed password", "user", user.id);
  back("/dashboard/profile", "ok", "Password changed. Any other device that was logged in as you has been logged out.");
}

/** For a lost phone or a shared computer: every login for this account stops working, including this one. */
export async function logoutEverywhere(): Promise<void> {
  const user = await requireRole();
  await revokeSessions(user.id);
  await audit(user.id, "logged out everywhere", "user", user.id);
  await destroySession();
  back("/login", "ok", "You have been logged out on every device. Log in again to continue.");
}

/** Records that an official has read the privacy notice (accounts the admin created never saw the request form). */
export async function acceptPrivacy(): Promise<void> {
  const user = await requireRole();
  await sql`update users set privacy_accepted_at = now(), privacy_version = ${PRIVACY_VERSION} where id = ${user.id}`;
  await audit(user.id, "accepted privacy notice", "user", user.id, PRIVACY_VERSION);
  back(ROLE_HOME[user.role], "ok", "Thank you. You can read the privacy notice again at any time from the footer.");
}
