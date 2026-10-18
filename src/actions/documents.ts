/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use server";

import { redirect } from "next/navigation";
import { sql, type Row } from "@/lib/db";
import { requireRole, type SessionUser } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { generateMinutes, renderMinutesText } from "@/lib/ai";
import { fundSummary } from "@/lib/funds";
import { todayManila } from "@/lib/format";
import type { MinutesData } from "@/lib/types";
import type { Role } from "@/lib/roles";
import { decodeImage } from "@/lib/images";
import { encryptPhoto } from "@/lib/crypto";

const MAX_NOTE_PHOTOS = 6;
const MAX_NOTE_PHOTO_BYTES = 1_000_000; // 1 MB hard limit. The browser squeezes photos to about 250 KB first (client-image.ts)

/**
 * Minutes and financial reports share one workflow:
 *   draft  ->  submitted for approval ("pending")  ->  published by the chairperson.
 * Nothing reaches the public feed without the chairperson's approval.
 */
type Kind = "minutes" | "report";
const TABLE: Record<Kind, string> = { minutes: "minutes", report: "reports" };
const WRITER: Record<Kind, Role> = { minutes: "secretary", report: "treasurer" };
const LABEL: Record<Kind, string> = { minutes: "Minutes", report: "Report" };

function path(kind: Kind, id: number): string {
  return kind === "minutes" ? `/dashboard/minutes/${id}` : `/dashboard/reports/${id}`;
}

function kindOf(fd: FormData): Kind {
  return fd.get("kind") === "report" ? "report" : "minutes";
}

async function load(kind: Kind, fd: FormData): Promise<{ user: SessionUser; id: number; doc: Row }> {
  const user = await requireRole(WRITER[kind], "chairperson");
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) back("/dashboard", "err", "Document not found.");
  const rows = await sql<Row[]>`select id, title, author_id, status from ${sql(TABLE[kind])} where id = ${id}`;
  const doc = rows[0];
  if (!doc) back("/dashboard", "err", "Document not found.");
  // The author and the chairperson may act on a document. Other officials may not.
  if (user.role !== "chairperson" && doc.author_id !== user.id) back("/dashboard", "err", "You can only work on your own documents.");
  return { user, id, doc };
}

// ---------------------------------------------------------------- create minutes with AI

export async function createMinutes(fd: FormData): Promise<void> {
  const user = await requireRole("secretary", "chairperson");
  const title = String(fd.get("title") ?? "").trim();
  const date = String(fd.get("session_date") ?? "") || todayManila();
  const raw = String(fd.get("raw_notes") ?? "").trim();

  if (title.length < 4) back("/dashboard/secretary", "err", "Give the meeting a title, for example 'Regular Session'.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back("/dashboard/secretary", "err", "Pick the date of the meeting.");
  if (raw.length < 30) back("/dashboard/secretary", "err", "Type the raw notes first (at least a few lines), or add photos and let Sinag read them.");
  const photos = notePhotos(fd);
  if (photos === null) back("/dashboard/secretary", "err", `One of the photos could not be used. Add up to ${MAX_NOTE_PHOTOS} JPG or PNG photos.`);

  const { data, usedAI } = await generateMinutes(raw, { title, date });
  data.budget_check = await budgetCheck(data);
  const content = renderMinutesText(data, title);

  const [row] = await sql<Row[]>`
    insert into minutes (title, session_date, raw_notes, content, data, author_id)
    values (${title.slice(0, 160)}, ${date}::date, ${raw}, ${content}, ${sql.json(data as never)}, ${user.id})
    returning id
  `;
  await savePhotos(row.id as number, photos, 0);
  await audit(user.id, "drafted minutes", "minutes", row.id as number, photos.length ? `${title} (${photos.length} photo${photos.length === 1 ? "" : "s"})` : title);
  back(
    path("minutes", row.id as number),
    "ok",
    usedAI
      ? "Draft minutes are ready. Read them carefully, fix anything that is wrong, then submit for approval."
      : "AI was not available, so this is a simple draft built from your notes. Please review and edit it before submitting.",
  );
}

async function budgetCheck(data: MinutesData) {
  const total = data.budget_items.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const funds = await fundSummary();
  return { total, available: funds.available, over: total > funds.available };
}

/** Re-run the assistant after the raw notes were corrected. This replaces the current draft text. */
export async function regenerateMinutes(fd: FormData): Promise<void> {
  const { user, id, doc } = await load("minutes", fd);
  if (doc.status === "published") back(path("minutes", id), "err", "Published minutes cannot be changed. Return them to draft first.");
  const raw = String(fd.get("raw_notes") ?? "").trim();
  if (raw.length < 30) back(path("minutes", id), "err", "The raw notes are too short.");
  const photos = notePhotos(fd);
  if (photos === null) back(path("minutes", id), "err", `One of the photos could not be used. Add up to ${MAX_NOTE_PHOTOS} JPG or PNG photos.`);

  const [meta] = await sql<Row[]>`select title, session_date::text as date from minutes where id = ${id}`;
  const { data, usedAI } = await generateMinutes(raw, { title: meta.title as string, date: meta.date as string });
  data.budget_check = await budgetCheck(data);
  const content = renderMinutesText(data, meta.title as string);
  await sql`
    update minutes set raw_notes = ${raw}, content = ${content}, data = ${sql.json(data as never)}, status = 'draft'
    where id = ${id}
  `;
  const [{ pages }] = await sql<Row[]>`select coalesce(max(page), 0)::int as pages from minutes_photos where minutes_id = ${id}`;
  if (Number(pages) + photos.length > MAX_NOTE_PHOTOS * 2) back(path("minutes", id), "err", "These minutes already have the most photos allowed.");
  await savePhotos(id, photos, Number(pages));
  await audit(user.id, "regenerated minutes", "minutes", id);
  back(path("minutes", id), "ok", usedAI ? "Minutes regenerated from the updated notes." : "AI was not available, so a simple draft was built. Please review it.");
}

/** Photos of handwritten notes sent with the form. Returns null if any of them is not a usable image. */
function notePhotos(fd: FormData) {
  const raw = fd.getAll("photos").map(String).filter(Boolean);
  if (raw.length > MAX_NOTE_PHOTOS) return null;
  const decoded = raw.map((d) => decodeImage(d, MAX_NOTE_PHOTO_BYTES));
  return decoded.every(Boolean) ? (decoded as NonNullable<(typeof decoded)[number]>[]) : null;
}

async function savePhotos(minutesId: number, photos: { bytes: Buffer; type: string }[], startPage: number) {
  for (const [i, p] of photos.entries()) {
    await sql`insert into minutes_photos (minutes_id, page, data, type) values (${minutesId}, ${startPage + i + 1}, ${encryptPhoto(p.bytes)}, ${p.type})`;
  }
}

// ---------------------------------------------------------------- shared workflow

export async function saveDoc(fd: FormData): Promise<void> {
  const kind = kindOf(fd);
  const { user, id, doc } = await load(kind, fd);
  if (doc.status === "published") back(path(kind, id), "err", "Published documents cannot be edited. Return it to draft first.");

  const content = String(fd.get("content") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  if (content.length < 10) back(path(kind, id), "err", "The text cannot be empty.");
  if (title.length < 4) back(path(kind, id), "err", "The title is too short.");

  // Editing after submitting cancels the request, so the approver never signs off on text they have not seen.
  await sql`update ${sql(TABLE[kind])} set title = ${title.slice(0, 160)}, content = ${content}, status = 'draft' where id = ${id}`;
  await audit(user.id, "edited", kind, id, title);
  back(path(kind, id), "ok", "Saved. Submit it for approval when it is ready.");
}

export async function submitDoc(fd: FormData): Promise<void> {
  const kind = kindOf(fd);
  const { user, id, doc } = await load(kind, fd);
  if (doc.status !== "draft") back(path(kind, id), "err", "Only drafts can be submitted.");
  await sql`update ${sql(TABLE[kind])} set status = 'pending' where id = ${id}`;
  await audit(user.id, "submitted for approval", kind, id, doc.title as string);
  back(path(kind, id), "ok", "Submitted. The chairperson will review it before it goes public.");
}

export async function publishDoc(fd: FormData): Promise<void> {
  const kind = kindOf(fd);
  const chair = await requireRole("chairperson");
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) back("/dashboard/chair", "err", "Document not found.");

  const rows = await sql<Row[]>`
    update ${sql(TABLE[kind])}
    set status = 'published', published_by = ${chair.id}, published_at = now()
    where id = ${id} and status in ('draft', 'pending')
    returning title
  `;
  if (rows.length === 0) back(path(kind, id), "err", "This document is already published.");
  await audit(chair.id, "published", kind, id, rows[0].title as string);
  back(path(kind, id), "ok", `${LABEL[kind]} published. It is now visible to everyone on the public feed.`);
}

export async function returnDoc(fd: FormData): Promise<void> {
  const kind = kindOf(fd);
  const chair = await requireRole("chairperson");
  const id = Number(fd.get("id"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  if (!Number.isInteger(id)) back("/dashboard/chair", "err", "Document not found.");

  const rows = await sql<Row[]>`
    update ${sql(TABLE[kind])}
    set status = 'draft', published_by = null, published_at = null
    where id = ${id} and status in ('pending', 'published')
    returning title
  `;
  if (rows.length === 0) back(path(kind, id), "err", "Nothing to return.");
  await audit(chair.id, "returned to draft", kind, id, note || (rows[0].title as string));
  back(path(kind, id), "ok", "Returned to draft. It is no longer public.");
}

export async function deleteDraft(fd: FormData): Promise<void> {
  const kind = kindOf(fd);
  const { user, id, doc } = await load(kind, fd);
  if (doc.status !== "draft") back(path(kind, id), "err", "Only drafts can be deleted. Published records stay on the record.");
  await sql`delete from ${sql(TABLE[kind])} where id = ${id}`;
  await audit(user.id, "deleted draft", kind, id, doc.title as string);
  redirect(kind === "minutes" ? "/dashboard/secretary" : "/dashboard/treasurer");
}
