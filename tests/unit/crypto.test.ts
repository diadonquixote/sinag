/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptPhoto, encryptPhoto, isEncrypted, parseKey } from "@/lib/crypto";

const key = randomBytes(32);
const photo = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), randomBytes(500)]);

describe("photo encryption", () => {
  it("round-trips a photo", () => {
    const stored = encryptPhoto(photo, key);
    expect(decryptPhoto(stored, key).equals(photo)).toBe(true);
  });

  it("does not leave the picture readable in what is stored", () => {
    const stored = encryptPhoto(photo, key);
    expect(isEncrypted(stored)).toBe(true);
    expect(stored.includes(photo.subarray(4, 40))).toBe(false);
    expect(stored.subarray(0, 4).toString("ascii")).toBe("SNG1");
  });

  it("uses a fresh iv, so the same photo never looks the same twice", () => {
    expect(encryptPhoto(photo, key).equals(encryptPhoto(photo, key))).toBe(false);
  });

  it("refuses a photo that was changed, or the wrong key", () => {
    const stored = encryptPhoto(photo, key);
    const tampered = Buffer.from(stored);
    tampered[tampered.length - 1] ^= 1;
    expect(() => decryptPhoto(tampered, key)).toThrow();
    expect(() => decryptPhoto(stored, randomBytes(32))).toThrow();
  });

  it("still serves photos stored before encryption existed", () => {
    expect(isEncrypted(photo)).toBe(false);
    expect(decryptPhoto(photo, key).equals(photo)).toBe(true);
  });

  it("does not encrypt twice", () => {
    const once = encryptPhoto(photo, key);
    expect(encryptPhoto(once, key).equals(once)).toBe(true);
  });
});

describe("parseKey", () => {
  it("accepts base64 and hex for 32 bytes", () => {
    const raw = randomBytes(32);
    expect(parseKey(raw.toString("base64")).equals(raw)).toBe(true);
    expect(parseKey(raw.toString("hex")).equals(raw)).toBe(true);
  });
  it("rejects a missing or short key", () => {
    expect(() => parseKey(undefined)).toThrow(/not set/);
    expect(() => parseKey("tooshort")).toThrow(/32 random bytes/);
  });
});
