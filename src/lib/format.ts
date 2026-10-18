/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
const TZ = "Asia/Manila";

/** Accepts a Date, a full ISO timestamp, or a plain "YYYY-MM-DD" date. */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+08:00`);
  return new Date(value);
}

function valid(d: Date) {
  return !Number.isNaN(d.getTime());
}

export function fmtDate(value: string | Date | null | undefined, style: "long" | "short" = "long"): string {
  if (!value) return "";
  const d = toDate(value);
  if (!valid(d)) return String(value);
  return new Intl.DateTimeFormat(
    "en-PH",
    style === "long"
      ? { year: "numeric", month: "long", day: "numeric", timeZone: TZ }
      : { month: "short", day: "numeric", timeZone: TZ },
  ).format(d);
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = toDate(value);
  if (!valid(d)) return String(value);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

/** "Oct 11–18, 2026", "Oct 19 – Nov 6, 2026", or "Dec 28, 2026 – Jan 3, 2027". */
export function fmtDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return "Date to be announced";
  if (!end || end === start) return fmtDate(start);
  const a = toDate(start), b = toDate(end);
  if (!valid(a) || !valid(b)) return `${fmtDate(start, "short")} – ${fmtDate(end)}`;
  const part = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-PH", { ...o, timeZone: TZ }).format(d);
  const [ya, yb] = [part(a, { year: "numeric" }), part(b, { year: "numeric" })];
  const [ma, mb] = [part(a, { month: "short" }), part(b, { month: "short" })];
  const [da, db] = [part(a, { day: "numeric" }), part(b, { day: "numeric" })];
  if (ya === yb && ma === mb) return `${ma} ${da}–${db}, ${ya}`;
  if (ya === yb) return `${ma} ${da} – ${mb} ${db}, ${ya}`;
  return `${ma} ${da}, ${ya} – ${mb} ${db}, ${yb}`;
}

/** Month and day parts for a calendar-style date tile. */
export function dateTile(value: string | null | undefined): { month: string; day: string } | null {
  if (!value) return null;
  const d = toDate(value);
  if (!valid(d)) return null;
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-PH", { ...o, timeZone: TZ }).format(d);
  return { month: f({ month: "short" }).toUpperCase(), day: f({ day: "numeric" }) };
}

export function peso(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Today's date in Manila as YYYY-MM-DD. */
export function todayManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function timeAgo(value: string | Date): string {
  const d = toDate(value);
  if (!valid(d)) return "";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(d);
}

export function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** "Maria Reyes" -> "MR". Used for avatar circles. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Accepts 09171234567, 0917 123 4567, +63 917 123 4567 or 639171234567. Returns "+63 917 123 4567", or "" if invalid. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let local = "";
  if (/^09\d{9}$/.test(digits)) local = digits.slice(1);
  else if (/^639\d{9}$/.test(digits)) local = digits.slice(2);
  else if (/^9\d{9}$/.test(digits)) local = digits;
  else return "";
  return `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
