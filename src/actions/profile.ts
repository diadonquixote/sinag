"use server";

import { sql } from "@/lib/db";
import { createSession, requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { isOfficial } from "@/lib/roles";
import { normalizePhone } from "@/lib/format";

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

  if (name.length < 2) back(PAGE, "err", "Please enter your full name.");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  if (phoneRaw && !phone) back(PAGE, "err", "Enter a Philippine mobile number, for example 0917 123 4567.");

  await sql`
    update users set
      name = ${name}, bio = ${bio || null}, barangay = ${barangay || null}, purok = ${purok || null},
      skills = ${skills || null}, phone = ${phone || null},
      committee = ${isOfficial(user.role) ? committee || null : null}
    where id = ${user.id}
  `;

  // The header reads the name from the login cookie, so refresh it when the name changes.
  if (name !== user.name) await createSession({ id: user.id, name, role: user.role });
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
  const m = data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) back(PAGE, "err", "Choose a photo first (JPG, PNG or WebP).");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) back(PAGE, "err", "That photo is too large. Try a different one.");
  if (!looksLikeImage(bytes)) back(PAGE, "err", "That file does not look like a photo.");

  await sql`update users set avatar = ${bytes}, avatar_type = ${m[1]}, avatar_updated_at = now() where id = ${user.id}`;
  await audit(user.id, "changed profile photo", "user", user.id);
  back(PAGE, "ok", "Photo updated.");
}

/** Checks the first bytes so only real JPEG, PNG or WebP images are stored. */
function looksLikeImage(b: Buffer): boolean {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}
