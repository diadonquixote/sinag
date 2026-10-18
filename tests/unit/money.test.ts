/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { centavosToNumeric, parsePesoInput, sumCentavos, toCentavos, toPesos } from "@/lib/money";

describe("toCentavos", () => {
  it("reads database numerics exactly", () => {
    expect(toCentavos("1234.56")).toBe(123456);
    expect(toCentavos("0.10")).toBe(10);
    expect(toCentavos("0.1")).toBe(10);
    expect(toCentavos("5")).toBe(500);
    expect(toCentavos("-20.05")).toBe(-2005);
    expect(toCentavos("9999999999.99")).toBe(999999999999);
  });
  it("treats empty or junk as zero", () => {
    expect(toCentavos(null)).toBe(0);
    expect(toCentavos("")).toBe(0);
    expect(toCentavos("abc")).toBe(0);
  });
  it("rounds numbers to the nearest centavo", () => {
    expect(toCentavos(0.1 + 0.2)).toBe(30);
    expect(toCentavos(19.99)).toBe(1999);
  });
});

describe("adding money", () => {
  it("has no floating-point drift", () => {
    // In pesos as floats this is 0.30000000000000004 and 3 x 0.1 never equals 0.3.
    expect(toPesos(sumCentavos([toCentavos("0.10"), toCentavos("0.20")]))).toBe(0.3);
    const tenCentavoEntries = Array.from({ length: 1000 }, () => toCentavos("0.10"));
    expect(sumCentavos(tenCentavoEntries)).toBe(10000);
  });
  it("detects overcommitment by exactly one centavo", () => {
    const available = toCentavos("100000.00") - toCentavos("99999.99") - toCentavos("0.02");
    expect(available).toBe(-1);
  });
});

describe("parsePesoInput", () => {
  it("accepts what people type", () => {
    expect(parsePesoInput("1500", 1e9)).toBe(150000);
    expect(parsePesoInput("1,500.50", 1e9)).toBe(150050);
    expect(parsePesoInput("₱ 2,000", 1e9)).toBe(200000);
    expect(parsePesoInput("PHP250.5", 1e9)).toBe(25050);
  });
  it("refuses amounts it would otherwise have to guess at", () => {
    expect(parsePesoInput("1.505", 1e9)).toBeNull();
    expect(parsePesoInput("1.2.3", 1e9)).toBeNull();
    expect(parsePesoInput("-50", 1e9)).toBeNull();
    expect(parsePesoInput("abc", 1e9)).toBeNull();
    expect(parsePesoInput("", 1e9)).toBeNull();
    expect(parsePesoInput("0", 1e9)).toBeNull();
  });
  it("allows zero only when asked", () => {
    expect(parsePesoInput("0", 1e9, { allowZero: true })).toBe(0);
  });
  it("enforces the maximum", () => {
    expect(parsePesoInput("100000000", 100_000_000)).toBe(10_000_000_000);
    expect(parsePesoInput("100000000.01", 100_000_000)).toBeNull();
  });
});

describe("centavosToNumeric", () => {
  it("writes a fixed two-decimal string for the database", () => {
    expect(centavosToNumeric(150050)).toBe("1500.50");
    expect(centavosToNumeric(5)).toBe("0.05");
    expect(centavosToNumeric(-2005)).toBe("-20.05");
  });
});
