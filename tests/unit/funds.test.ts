/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { summarizeFund } from "@/lib/funds";
import { toCentavos } from "@/lib/money";

/** Amounts in whole centavos, written as pesos so the cases read like a ledger. */
const c = (pesos: string) => toCentavos(pesos);

describe("summarizeFund", () => {
  it("is annual fund + other income - spent - committed", () => {
    const s = summarizeFund({ total: c("100000"), income: c("5000.50"), expense: c("1200.25"), committed: c("17000") });
    expect(s).toEqual({ total: 100000, income: 5000.5, expense: 1200.25, committed: 17000, available: 86800.25 });
  });

  it("is exact where plain decimals drift", () => {
    // 0.1 + 0.2 - 0.3 is 5.55e-17 in floating point. In centavos it is exactly zero.
    const s = summarizeFund({ total: c("0.10"), income: c("0.20"), expense: c("0.30"), committed: 0 });
    expect(s.available).toBe(0);
  });

  it("goes negative when more is committed than the fund holds, so a new project can be refused", () => {
    const s = summarizeFund({ total: c("10000"), income: 0, expense: c("2500"), committed: c("9000") });
    expect(s.available).toBe(-1500);
  });

  it("handles an empty fund", () => {
    expect(summarizeFund({ total: 0, income: 0, expense: 0, committed: 0 })).toEqual({ total: 0, income: 0, expense: 0, committed: 0, available: 0 });
  });

  it("keeps centavos through a thousand small entries", () => {
    const expense = Array.from({ length: 1000 }, () => c("0.10")).reduce((a, b) => a + b, 0);
    expect(summarizeFund({ total: c("1000"), income: 0, expense, committed: 0 }).available).toBe(900);
  });
});
