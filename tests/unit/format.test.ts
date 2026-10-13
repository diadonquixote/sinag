import { describe, expect, it } from "vitest";
import { fmtDateRange, initials, normalizePhone, pct, peso } from "@/lib/format";

describe("format", () => {
  it("shows pesos the Philippine way", () => {
    expect(peso(1500)).toBe("₱1,500");
    expect(peso("1234.5")).toBe("₱1,234.5");
    expect(peso(null)).toBe("₱0");
  });
  it("keeps percentages between 0 and 100", () => {
    expect(pct(50, 200)).toBe(25);
    expect(pct(300, 200)).toBe(100);
    expect(pct(5, 0)).toBe(0);
  });
  it("normalizes Philippine mobile numbers", () => {
    expect(normalizePhone("09171234567")).toBe("+63 917 123 4567");
    expect(normalizePhone("+63 917 123 4567")).toBe("+63 917 123 4567");
    expect(normalizePhone("12345")).toBe("");
  });
  it("makes initials", () => {
    expect(initials("Maria Reyes")).toBe("MR");
    expect(initials("  ")).toBe("?");
  });
  it("writes date ranges compactly", () => {
    expect(fmtDateRange("2026-10-11", "2026-10-18")).toBe("Oct 11–18, 2026");
    expect(fmtDateRange(null, null)).toBe("Date to be announced");
  });
});
