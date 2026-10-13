"use server";

import { sql, type Row } from "@/lib/db";
import { createSession, requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { isOfficial } from "@/lib/roles";
import { normalizePhone } from "@/lib/format";
import { decodeImage } from "@/lib/images";

const PAGE = "/dashboard/profile";
const MAX_PHOTO_BYTES = 300 * 1024; // the browser shrinks photos to about 30–60 KB before sending

const text = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Saves the signed-in person's own profile. */
export async function updateProfile(fd: FormData): Promise<void> {
  const user = await requireRole();
  const name = text(fd, "name", 120);
  const bio = String(fd.get("bio") ?? "").trim().slice(0, 300);
  const barangay = text(fd, "barangay", 120);
  const purok = text(fd, "purok", 60);
  const skills = text(fd, "skills", 200);
  const committee = isOfficial(user.role) ? text(fd, "committee", 80) : "";
  const phoneRaw = text(fd, "phone", 30);
  // Officials' public profile: one item per line, blank lines dropped.
  const lines = (key: string, maxLines: number) =>
    isOfficial(user.role)
      ? String(fd.get(key) ?? "").split(/\r?\n/).map((l) => l.trim().replace(/^[-•*]\s*/, "").slice(0, 160)).filter(Boolean).slice(0, maxLines).join("\n")
      : "";
  const credentials = lines("credentials", 12);
  const contributions = lines("contributions", 15);
  const term = isOfficial(user.role) ? text(fd, "term", 40) : "";

  if (name.length < 2) back(PAGE, "err", "Please enter your full name.");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  if (phoneRaw && !phone) back(PAGE, "err", "Enter a Philippine mobile number, for example 0917 123 4567.");

  await sql`
    update users set
      name = ${name}, bio = ${bio || null}, barangay = ${barangay || null}, purok = ${purok || null},
      skills = ${skills || null}, phone = ${phone || null},
      committee = ${isOfficial(user.role) ? committee || null : null},
      term = ${term || null}, credentials = ${credentials || null}, contributions = ${contributions || null}
    where id = ${user.id}
  `;

  // The header reads the name from the login cookie, so refresh it when the name changes.
  if (name !== user.name) {
    // The name is also in the login cookie (for the header), so issue a fresh one with the same session number.
    const [row] = await sql<Row[]>`select session_version from users where id = ${user.id}`;
    await createSession({ id: user.id, name, role: user.role, sessionVersion: Number(row.session_version) });
  }
  await audit(user.id, "updated profile", "user", user.id);
  back(PAGE, "ok", "Profile saved.");
}

/** Replaces or removes the profile photo. The browser crops and shrinks it first (see AvatarInput). */
export async function updatePhoto(fd: FormData): Promise<void> {
  const user = await requireRole();

  if (fd.get("remove") === "1") {
    await sql`update users set avatar = null, avatar_type = null, avatar_updated_at = null where id = ${user.id}`;
    back(PAGE, "ok", "Photo removed.");
  }

  const data = String(fd.get("photo") ?? "");
  if (!data) back(PAGE, "err", "Choose a photo first (JPG, PNG or WebP).");
  const img = decodeImage(data, MAX_PHOTO_BYTES);
  if (!img) back(PAGE, "err", "That file does not look like a photo, or it is too large. Try a different one.");

  await sql`update users set avatar = ${img.bytes}, avatar_type = ${img.type}, avatar_updated_at = now() where id = ${user.id}`;
  await audit(user.id, "changed profile photo", "user", user.id);
  back(PAGE, "ok", "Photo updated.");
}
