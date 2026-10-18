/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use server";

import bcrypt from "bcryptjs";
import { sql, type Row } from "@/lib/db";
import { requireRole, revokeSessions } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { ROLE_LABEL, TEAM_LIMITS, TEAM_ROLES, type Role } from "@/lib/roles";

/**
 * The Chairperson adds the rest of the council. Nobody can sign up on their own, so there
 * is no request queue to flood: the site admin creates the Chairperson's account, and the
 * Chairperson, who knows who was elected and appointed, creates the others.
 */

const PATH = "/dashboard/team";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addOfficial(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "") as Role;
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) back(PATH, "err", "Enter the official's full name.");
  if (!EMAIL.test(email)) back(PATH, "err", "Enter a valid email address.");
  if (!TEAM_ROLES.includes(role)) back(PATH, "err", "Choose a position: secretary, treasurer or kagawad.");
  if (password.length < 8) back(PATH, "err", "The temporary password needs at least 8 characters.");

  const limit = TEAM_LIMITS[role] ?? 0;
  const [{ n }] = await sql<Row[]>`select count(*)::int as n from users where role = ${role} and status = 'active'`;
  if (Number(n) >= limit) {
    back(PATH, "err", `The council already has ${limit === 1 ? "an" : limit} active ${ROLE_LABEL[role]}${limit === 1 ? "" : "s"}. If someone has left, mark their term as ended on this page first.`);
  }

  const existing = await sql<Row[]>`select 1 as x from users where lower(email) = ${email}`;
  if (existing.length > 0) back(PATH, "err", "That email already has an account.");

  const hash = await bcrypt.hash(password, 10);
  const [created] = await sql<Row[]>`
    insert into users (name, email, password_hash, role, status, reviewed_by, reviewed_at, must_change_password)
    values (${name.slice(0, 120)}, ${email}, ${hash}, ${role}, 'active', ${chair.id}, now(), true)
    returning id`;
  await audit(chair.id, "added official", "user", created.id as number, `${name} (${role})`);
  back(PATH, "ok", `${name} can now log in as ${ROLE_LABEL[role]}. Send them the temporary password privately; they will choose their own the first time they log in.`);
}

/** For an official on the Chairperson's team who forgot their password. */
export async function resetTeamPassword(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = Number(fd.get("id"));
  const password = String(fd.get("password") ?? "");
  if (!Number.isInteger(id) || id <= 0 || id === chair.id) back(PATH, "err", "That account was not found.");
  if (password.length < 8) back(PATH, "err", "The temporary password needs at least 8 characters.");
  const hash = await bcrypt.hash(password, 10);
  const [u] = await sql<Row[]>`
    update users set password_hash = ${hash}, must_change_password = true
    where id = ${id} and status = 'active' and role = any(${TEAM_ROLES as string[]})
    returning name`;
  if (!u) back(PATH, "err", "That account was not found.");
  await revokeSessions(id);
  await audit(chair.id, "reset password", "user", id, u.name as string);
  back(PATH, "ok", `New temporary password set for ${u.name}. Send it to them privately; they will choose their own when they log in.`);
}

/**
 * Turnover: someone on the Chairperson's team has left or their term has ended. They can no
 * longer log in, their seat is free for the next person, and the public council page lists
 * them as a former official, so what they published stays attributed to them.
 * The Chairperson's own term is ended by the site admin, who then creates the next Chairperson.
 */
export async function endTeamTerm(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0 || id === chair.id) back(PATH, "err", "That account was not found.");
  const [u] = await sql<Row[]>`
    update users set status = 'former'
    where id = ${id} and status = 'active' and role = any(${TEAM_ROLES as string[]})
    returning name, role`;
  if (!u) back(PATH, "err", "That account was not found.");
  await revokeSessions(id);
  await audit(chair.id, "marked term ended", "user", id, `${u.name} (${u.role})`);
  back(PATH, "ok", `${u.name} is now listed as a former official and can no longer log in. Everything they published stays on the record, and their seat is free for the next person.`);
}
