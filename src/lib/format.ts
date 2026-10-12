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

export function fmtDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return "Date to be announced";
  if (!end || end === start) return fmtDate(start);
  return `${fmtDate(start, "short")} – ${fmtDate(end)}`;
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
