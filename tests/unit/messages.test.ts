/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { en, fil, format, pickLang, translate } from "@/lib/messages";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("translations", () => {
  it("has every English text in Filipino, and nothing extra", () => {
    expect(Object.keys(fil).sort()).toEqual(Object.keys(en).sort());
  });
  it("has no empty texts", () => {
    for (const [key, value] of [...Object.entries(en), ...Object.entries(fil)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });
  it("uses the same {placeholders} in both languages", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(fil[key]), key).toEqual(placeholders(en[key]));
    }
  });
});

describe("format and translate", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(format("Hello {name}", { name: "Ana" })).toBe("Hello Ana");
    expect(format("Hello {name}", {})).toBe("Hello {name}");
  });
  it("translates", () => {
    expect(translate("fil", "nav.projects")).toBe("Mga Proyekto");
    expect(translate("en", "projects.count", { n: 3 })).toBe("3 projects");
  });
});

describe("pickLang", () => {
  it("prefers the saved choice", () => {
    expect(pickLang("fil", "en-US")).toBe("fil");
    expect(pickLang("en", "fil-PH")).toBe("en");
  });
  it("otherwise follows the browser's first language", () => {
    expect(pickLang(undefined, "fil-PH,en;q=0.8")).toBe("fil");
    expect(pickLang(undefined, "tl,en")).toBe("fil");
    expect(pickLang(undefined, "en-PH,fil;q=0.9")).toBe("en");
    expect(pickLang(undefined, null)).toBe("en");
  });
  it("ignores anything else in the cookie", () => {
    expect(pickLang("<script>", "en")).toBe("en");
  });
});
