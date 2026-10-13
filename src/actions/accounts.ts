"use server";

import bcrypt from "bcryptjs";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { ASSIGNABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";

/**
 * The site admin's account desk. The admin decides who gets in and with which role,
 * and nothing else: it cannot publish, approve budgets or appear on the council page.
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
  const [u] = await sql<Row[]>`update users set role = ${role} where id = ${id} and status <> 'pending' returning name`;
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
    where id = ${id} and status in ('active', 'disabled')
    returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  await audit(admin.id, on ? "turned account back on" : "turned account off", "user", id, u.name as string);
  back(PATH, "ok", on ? `${u.name} can log in again.` : `${u.name} is logged out and can no longer log in. Everything they published stays on the record.`);
}

export async function resetPassword(fd: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = idFrom(fd);
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) back(PATH, "err", "The temporary password needs at least 8 characters.");
  const hash = await bcrypt.hash(password, 10);
  const [u] = await sql<Row[]>`update users set password_hash = ${hash} where id = ${id} returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  await audit(admin.id, "reset password", "user", id, u.name as string);
  back(PATH, "ok", `New temporary password set for ${u.name}. Share it privately; they can change it under Profile.`);
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
    insert into users (name, email, password_hash, role, status, reviewed_by, reviewed_at)
    values (${name.slice(0, 120)}, ${email}, ${hash}, ${role}, 'active', ${admin.id}, now())
    returning id`;
  await audit(admin.id, "created account", "user", created.id as number, `${name} (${role})`);
  back(PATH, "ok", `Account created for ${name}. Share the temporary password with them privately.${await chairNote()}`);
}
