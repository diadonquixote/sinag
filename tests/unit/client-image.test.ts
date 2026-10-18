/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { compressionSteps, dataUrlBytes, TARGET_BYTES } from "@/lib/client-image";

describe("compressionSteps", () => {
  const steps = compressionSteps();
  it("starts at the requested size and quality, and only ever gets smaller", () => {
    expect(steps[0]).toEqual({ side: 1600, quality: 0.78 });
    for (let i = 1; i < steps.length; i++) {
      const a = steps[i - 1], b = steps[i];
      expect(b.side < a.side || (b.side === a.side && b.quality < a.quality)).toBe(true);
    }
  });
  it("stops at a size and quality that are still readable", () => {
    expect(Math.min(...steps.map((s) => s.side))).toBeGreaterThanOrEqual(900 * 0.85);
    expect(Math.min(...steps.map((s) => s.quality))).toBeGreaterThanOrEqual(0.45);
  });
});

describe("dataUrlBytes", () => {
  it("measures the picture, not the text around it", () => {
    expect(dataUrlBytes("data:image/jpeg;base64,AAAA")).toBe(3);
    expect(dataUrlBytes("data:image/jpeg;base64,AAA=")).toBe(2);
    expect(dataUrlBytes("data:image/jpeg;base64,AA==")).toBe(1);
  });
  it("targets well under the server's 1 MB limit", () => {
    expect(TARGET_BYTES).toBeLessThan(1_000_000);
  });
});
