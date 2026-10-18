/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * Money is handled in whole centavos.
 *
 * The database stores amounts as numeric(12,2), which is exact. JavaScript numbers are not:
 * 0.1 + 0.2 is 0.30000000000000004. Adding a ledger up in pesos can therefore drift by a
 * fraction of a centavo, and a check like "is the fund overcommitted?" can flip on a
 * rounding error. So amounts are read from the database as text, turned into integer
 * centavos, added up as integers (exact well beyond any SK budget), and only turned back
 * into pesos for display.
 */

/** The largest amount the database column numeric(12,2) can hold, in centavos. */
export const MAX_CENTAVOS = 999_999_999_999;

/**
 * Exact centavos from a database value or a number.
 * Database numerics should be selected as ::text and passed here as strings.
 */
export function toCentavos(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
  }
  const m = value.trim().match(/^(-)?(\d+)(?:\.(\d{0,2})\d*)?$/);
  if (!m) return 0;
  const whole = Number(m[2]);
  const cents = Number((m[3] ?? "").padEnd(2, "0"));
  const total = whole * 100 + cents;
  return m[1] ? -total : total;
}

/** Centavos back to pesos, for display and for passing to the database. */
export function toPesos(centavos: number): number {
  return Math.round(centavos) / 100;
}

/** Adds amounts exactly. */
export function sumCentavos(values: Iterable<number>): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/**
 * Reads an amount someone typed: "1500", "1,500.50", "₱ 1,500". Returns centavos,
 * or null when it is not a positive amount with at most two decimal places.
 * Strict on purpose: "1.505" is refused rather than silently rounded.
 */
export function parsePesoInput(input: unknown, maxPesos: number, opts: { allowZero?: boolean } = {}): number | null {
  const text = String(input ?? "").replace(/[₱,\s]/g, "").replace(/^PHP/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const centavos = toCentavos(text);
  if (centavos < 0 || (centavos === 0 && !opts.allowZero)) return null;
  if (centavos > Math.round(maxPesos * 100) || centavos > MAX_CENTAVOS) return null;
  return centavos;
}

/** The amount as a fixed two-decimal string, the safest form to hand to a numeric column. */
export function centavosToNumeric(centavos: number): string {
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(Math.round(centavos));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
