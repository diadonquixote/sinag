"use server";

import bcrypt from "bcryptjs";
import { sql, type Row } from "@/lib/db";
import { requireRole, revokeSessions } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { ASSIGNABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";

/**
 * The site admin's account desk. Nobody signs up: the admin creates the Chairperson's account
 * (and any other the council needs), and the Chairperson adds the rest of the council from the
 * Team page. The admin decides who gets in and with which role, and nothing else: it cannot
 * publish, approve budgets or appear on the council page.
 */

const PATH = "/dashboard/admin";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function idFrom(fd: FormData): number {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) back(PATH, "err", "That account was not found.");
  return id;
}

function roleFrom(fd: FormData): Role {
  const role = String(fd.get("role") ?? "") as Role;
  if (!ASSIGNABLE_ROLES.includes(role)) back(PATH, "err", "Choose a position.");
  return role;
}

/** A gentle warning when the chart would show more than one Chairperson. */
async function chairNote(): Promise<string> {
  const [{ n }] = await sql<Row[]>`select count(*)::int as n from users where role = 'chairperson' and status = 'active'`;
  return Number(n) > 1 ? ` Note: there are now ${n} active Chairpersons. Usually there is one.` : "";
}

export async function approveAccount(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const role = roleFrom(fd);
  const [u] = await sql<Row[]>`
    update users set status = 'active', role = ${role}, reviewed_by = ${admin.id}, reviewed_at = now()
    where id = ${id} and status = 'pending'
    returning name`;
  if (!u) back(PATH, "err", "That request was already handled.");
  await audit(admin.id, "approved account", "user", id, `${u.name} (${role})`);
  back(PATH, "ok", `${u.name} can now log in as ${ROLE_LABEL[role]}.${await chairNote()}`);
}

/** A turned-down request is deleted, so the person can ask again with the right details. */
export async function rejectAccount(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const [u] = await sql<Row[]>`delete from users where id = ${id} and status = 'pending' returning name, role`;
  if (!u) back(PATH, "err", "That request was already handled.");
  await audit(admin.id, "turned down account request", "user", null, `${u.name} (${u.role})`);
  back(PATH, "ok", `Request from ${u.name} turned down and removed.`);
}

export async function changeRole(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const role = roleFrom(fd);
  if (id === admin.id) back(PATH, "err", "You cannot change your own role. Ask another admin, or use npm run db:admin.");
  const [u] = await sql<Row[]>`update users set role = ${role} where id = ${id} and status in ('active', 'disabled') returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  await audit(admin.id, "changed account role", "user", id, `${u.name} (${role})`);
  back(PATH, "ok", `${u.name} is now ${ROLE_LABEL[role]}.${await chairNote()}`);
}

/** Turning an account off logs the person out at once; their published records stay as they are. */
export async function setAccountActive(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const on = fd.get("on") === "1";
  if (id === admin.id) back(PATH, "err", "You cannot turn off your own account.");
  const [u] = await sql<Row[]>`
    update users set status = ${on ? "active" : "disabled"}
    where id = ${id} and status in ('active', 'disabled', 'former')
    returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  if (!on) await revokeSessions(id);
  await audit(admin.id, on ? "turned account back on" : "turned account off", "user", id, u.name as string);
  back(PATH, "ok", on ? `${u.name} can log in again.` : `${u.name} is logged out and can no longer log in. Everything they published stays on the record.`);
}

export async function resetPassword(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) back(PATH, "err", "The temporary password needs at least 8 characters.");
  const hash = await bcrypt.hash(password, 10);
  const [u] = await sql<Row[]>`update users set password_hash = ${hash}, must_change_password = true where id = ${id} and status <> 'removed' returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  await revokeSessions(id); // whoever was logged in with the old password is logged out
  await audit(admin.id, "reset password", "user", id, u.name as string);
  back(PATH, "ok", `New temporary password set for ${u.name}, and every device they were logged in on has been logged out. Share the password privately; they will be asked to choose a new one when they log in.`);
}

/** For someone the admin already knows, without waiting for them to fill in the request form. */
export async function createAccount(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = roleFrom(fd);
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) back(PATH, "err", "Enter the person's name.");
  if (!EMAIL.test(email)) back(PATH, "err", "Enter a valid email address.");
  if (password.length < 8) back(PATH, "err", "The temporary password needs at least 8 characters.");

  const existing = await sql<Row[]>`select 1 as x from users where lower(email) = ${email}`;
  if (existing.length > 0) back(PATH, "err", "That email already has an account.");

  const hash = await bcrypt.hash(password, 10);
  const [created] = await sql<Row[]>`
    insert into users (name, email, password_hash, role, status, reviewed_by, reviewed_at, must_change_password)
    values (${name.slice(0, 120)}, ${email}, ${hash}, ${role}, 'active', ${admin.id}, now(), true)
    returning id`;
  await audit(admin.id, "created account", "user", created.id as number, `${name} (${role})`);
  back(PATH, "ok", `Account created for ${name}. Send them the temporary password privately; they will be asked to choose their own the first time they log in.${await chairNote()}`);
}

/**
 * Turnover: an official's term has ended. They can no longer log in, and the public council
 * page lists them under former officials, so the record of who did what stays readable.
 * If they are re-elected, "Turn account back on" restores them.
 */
export async function markTermEnded(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  if (id === admin.id) back(PATH, "err", "Hand the admin role to someone else first; they can then mark your term as ended.");
  const [u] = await sql<Row[]>`
    update users set status = 'former'
    where id = ${id} and status in ('active', 'disabled') and role in ('chairperson', 'secretary', 'treasurer', 'kagawad')
    returning name`;
  if (!u) back(PATH, "err", "Only an elected official's account can be marked as term ended.");
  await revokeSessions(id);
  await audit(admin.id, "marked term ended", "user", id, u.name as string);
  back(PATH, "ok", `${u.name} is now listed as a former official and can no longer log in. Everything they published stays on the record.`);
}

/**
 * Removes an account's personal details.
 *
 * If the person never published or recorded anything, the account is deleted outright.
 * If they did, the account is kept but emptied: email, password, phone, photo, bio and the
 * rest are erased, and only the name stays, because it is attached to minutes, reports and
 * ledger entries that are part of the public record of their time in office.
 */
export async function removeAccount(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  if (id === admin.id) back(PATH, "err", "You cannot remove your own account.");
  if (fd.get("confirm") !== "REMOVE") back(PATH, "err", "Type REMOVE to confirm. This cannot be undone.");

  const [u] = await sql<Row[]>`select name, status from users where id = ${id}`;
  if (!u || u.status === "pending" || u.status === "removed") back(PATH, "err", "That account was not found.");
  if (u.status === "active") back(PATH, "err", "Turn the account off first, then remove it.");

  // Anything this person did in office keeps their name attached. Only someone who never
  // recorded or published anything is deleted outright.
  const [{ has_records }] = await sql<Row[]>`
    select (
      exists (select 1 from minutes where author_id = ${id} or published_by = ${id})
      or exists (select 1 from reports where author_id = ${id} or published_by = ${id})
      or exists (select 1 from transactions where created_by = ${id})
      or exists (select 1 from transaction_receipts where created_by = ${id})
      or exists (select 1 from project_updates where author_id = ${id})
      or exists (select 1 from projects where lead_id = ${id})
      or exists (select 1 from audit_log where user_id = ${id} and action not in
        ('requested an account', 'accepted privacy notice', 'updated profile', 'changed password', 'logged out everywhere'))
    ) as has_records`;
  const deleted = !has_records;
  if (deleted) await sql`delete from users where id = ${id}`;

  if (!deleted) {
    await sql`
      update users set
        status = 'removed',
        email = ${`removed-${id}@removed.invalid`},
        password_hash = ${"!removed"},
        phone = null, bio = null, purok = null, barangay = null, skills = null,
        avatar = null, avatar_type = null, avatar_updated_at = null,
        credentials = null, contributions = null, committee = null, term = null,
        request_note = null, privacy_accepted_at = null, privacy_version = null,
        session_version = session_version + 1
      where id = ${id}`;
  }
  await audit(admin.id, deleted ? "deleted account" : "removed account details", "user", deleted ? null : id, u.name as string);
  back(PATH, "ok", deleted
    ? `${u.name}'s account has been deleted.`
    : `${u.name}'s personal details have been erased. Their name stays on what they published while in office.`);
}
