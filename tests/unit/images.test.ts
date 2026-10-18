/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { cleanJpeg, cleanPng, decodeImage, MAX_DIMENSION, sniffType } from "@/lib/images";

const seg = (marker: number, payload: number[]) => {
  const len = payload.length + 2;
  return [0xff, marker, len >> 8, len & 0xff, ...payload];
};
const sof = (w: number, h: number) => seg(0xc0, [8, h >> 8, h & 0xff, w >> 8, w & 0xff, 1, 1, 0x11, 0]);

/** A structurally valid (if tiny) JPEG: SOI, JFIF, optional EXIF with a fake GPS tag, size, scan, EOI. */
function jpeg(opts: { exif?: boolean; w?: number; h?: number; end?: boolean } = {}): Buffer {
  const exif = opts.exif ? seg(0xe1, [...Buffer.from("Exif\0\0GPS 14.1,121.9")]) : [];
  const bytes = [
    0xff, 0xd8,
    ...seg(0xe0, [...Buffer.from("JFIF\0"), 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...exif,
    ...seg(0xfe, [...Buffer.from("taken by a phone")]),
    ...sof(opts.w ?? 100, opts.h ?? 80),
    ...seg(0xda, [1, 1, 0, 0, 0x3f, 0]),
    0x12, 0x34, 0x56,
    ...(opts.end === false ? [] : [0xff, 0xd9]),
  ];
  return Buffer.from(bytes);
}

const chunk = (type: string, data: number[]) => {
  const len = data.length;
  return [len >>> 24, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff, ...Buffer.from(type), ...data, 0, 0, 0, 0];
};
function png(opts: { text?: boolean; w?: number; end?: boolean } = {}): Buffer {
  const w = opts.w ?? 10;
  const ihdr = [w >>> 24, (w >> 16) & 0xff, (w >> 8) & 0xff, w & 0xff, 0, 0, 0, 10, 8, 2, 0, 0, 0];
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", ihdr),
    ...(opts.text ? chunk("tEXt", [...Buffer.from("Author\0someone")]) : []),
    ...chunk("IDAT", [1, 2, 3]),
    ...(opts.end === false ? [] : chunk("IEND", [])),
  ]);
}
const dataUrl = (type: string, b: Buffer) => `data:${type};base64,${b.toString("base64")}`;

describe("sniffType", () => {
  it("decides by content, not by label", () => {
    expect(sniffType(jpeg())).toBe("image/jpeg");
    expect(sniffType(png())).toBe("image/png");
    expect(sniffType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("cleanJpeg", () => {
  it("removes EXIF (with GPS) and comments but keeps the image", () => {
    const original = jpeg({ exif: true });
    const cleaned = cleanJpeg(original)!;
    expect(cleaned).not.toBeNull();
    expect(cleaned.includes(Buffer.from("GPS"))).toBe(false);
    expect(cleaned.includes(Buffer.from("taken by a phone"))).toBe(false);
    expect(cleaned.includes(Buffer.from("JFIF"))).toBe(true);
    expect(cleaned.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
    expect(cleaned.length).toBeLessThan(original.length);
  });
  it("rejects a file cut off before its end", () => {
    expect(cleanJpeg(jpeg({ end: false }))).toBeNull();
  });
  it("rejects absurd dimensions", () => {
    expect(cleanJpeg(jpeg({ w: MAX_DIMENSION + 1 }))).toBeNull();
    expect(cleanJpeg(jpeg({ w: 0 }))).toBeNull();
  });
});

describe("cleanPng", () => {
  it("removes text chunks and keeps the image", () => {
    const cleaned = cleanPng(png({ text: true }))!;
    expect(cleaned).not.toBeNull();
    expect(cleaned.includes(Buffer.from("someone"))).toBe(false);
    expect(cleaned.includes(Buffer.from("IDAT"))).toBe(true);
  });
  it("rejects a PNG with no end chunk or a huge size", () => {
    expect(cleanPng(png({ end: false }))).toBeNull();
    expect(cleanPng(png({ w: MAX_DIMENSION + 1 }))).toBeNull();
  });
});

describe("decodeImage", () => {
  it("accepts a sound photo within the size limit", () => {
    const out = decodeImage(dataUrl("image/jpeg", jpeg({ exif: true })), 10_000);
    expect(out?.type).toBe("image/jpeg");
    expect(out?.bytes.includes(Buffer.from("GPS"))).toBe(false);
  });
  it("rejects a file whose label does not match its content", () => {
    expect(decodeImage(dataUrl("image/png", jpeg()), 10_000)).toBeNull();
  });
  it("rejects files over the limit, non-images and other formats", () => {
    expect(decodeImage(dataUrl("image/jpeg", jpeg()), 10)).toBeNull();
    expect(decodeImage(dataUrl("image/jpeg", Buffer.from("not an image at all")), 10_000)).toBeNull();
    expect(decodeImage(`data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`, 10_000)).toBeNull();
    expect(decodeImage("https://example.com/photo.jpg", 10_000)).toBeNull();
  });
});
