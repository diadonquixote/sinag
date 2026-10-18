/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import config, { csp, securityHeaders } from "../../next.config.mjs";

describe("security headers", () => {
  it("forbid framing the site (clickjacking)", () => {
    const xfo = securityHeaders.find((h) => h.key === "X-Frame-Options");
    expect(xfo?.value).toBe("DENY");
    expect(csp).toContain("frame-ancestors 'none'");
  });
  it("only allow the site's own scripts and no plugins", () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*https?:/);
  });
  it("send nosniff, a referrer policy and HSTS", () => {
    const keys = securityHeaders.map((h) => h.key);
    expect(keys).toEqual(expect.arrayContaining(["X-Content-Type-Options", "Referrer-Policy", "Strict-Transport-Security", "Permissions-Policy"]));
  });
});

describe("build-time settings check", () => {
  const withEnv = (env: Record<string, string | undefined>, fn: () => void) => {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
    try { fn(); } finally { process.env = saved; }
  };

  it("stops a build with no database or secret, and says what is missing", () => {
    withEnv({ DATABASE_URL: undefined, AUTH_SECRET: undefined, SKIP_ENV_CHECK: undefined }, () => {
      expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/DATABASE_URL is not set[\s\S]*AUTH_SECRET is not set/);
    });
  });
  it("rejects a secret that is too short", () => {
    withEnv({ DATABASE_URL: "postgres://u:p@h/db", AUTH_SECRET: "short", SKIP_ENV_CHECK: undefined }, () => {
      expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/AUTH_SECRET is too short/);
    });
  });
  it("stops a build with no photo key, or a key of the wrong size", () => {
    const ok = { DATABASE_URL: "postgres://u:p@h/db", AUTH_SECRET: "x".repeat(44), SKIP_ENV_CHECK: undefined };
    withEnv({ ...ok, PHOTO_ENCRYPTION_KEY: undefined }, () => {
      expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/PHOTO_ENCRYPTION_KEY is not set/);
    });
    withEnv({ ...ok, PHOTO_ENCRYPTION_KEY: "dG9vc2hvcnQ=" }, () => {
      expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/must be 32 random bytes/);
    });
  });
  it("passes with proper settings, and does not check outside builds", () => {
    withEnv({ DATABASE_URL: "postgresql://u:p@h/db", AUTH_SECRET: "x".repeat(44), PHOTO_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"), NEXT_PUBLIC_ORG_NAME: "SK ng Test" }, () => {
      expect(() => config(PHASE_PRODUCTION_BUILD)).not.toThrow();
    });
    withEnv({ DATABASE_URL: undefined, AUTH_SECRET: undefined }, () => {
      expect(() => config("phase-development-server")).not.toThrow();
    });
  });
});
