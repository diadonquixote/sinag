/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * Server-side checks for photos sent from the browser as data URLs.
 *
 * The browser already shrinks photos before sending them, but nothing that arrives at the
 * server is trusted. Every photo is checked here before it is stored:
 *   - it must really be the type it claims (the first bytes decide, not the label),
 *   - it must be structurally whole (a JPEG must end, a PNG must have its end chunk),
 *   - its width and height must be sensible, so a tiny file cannot unpack into a huge image,
 *   - hidden metadata is removed: phone photos carry the GPS location where they were taken,
 *     the camera model and the time, and none of that belongs on a public receipt.
 */

export type ImageType = "image/jpeg" | "image/png" | "image/webp";
export type DecodedImage = { bytes: Buffer; type: ImageType };

/** Larger than any phone camera produces after the browser resizes it, far smaller than an attack needs. */
export const MAX_DIMENSION = 8000;

/** Turns "data:image/jpeg;base64,..." into clean bytes, or null if it is not a sound JPEG, PNG or WebP within the size limit. */
export function decodeImage(dataUrl: string, maxBytes: number): DecodedImage | null {
  if (typeof dataUrl !== "string" || dataUrl.length > maxBytes * 1.4 + 64) return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0 || bytes.length > maxBytes) return null;

  const actual = sniffType(bytes);
  if (!actual || actual !== m[1]) return null;

  const clean = actual === "image/jpeg" ? cleanJpeg(bytes) : actual === "image/png" ? cleanPng(bytes) : checkWebp(bytes);
  return clean ? { bytes: clean, type: actual } : null;
}

/** What the first bytes say the file is. */
export function sniffType(b: Buffer): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(PNG_SIGNATURE)) return "image/png";
  if (b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Kept for callers that only need a yes or no. */
export function looksLikeImage(b: Buffer): boolean {
  return sniffType(b) !== null;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Walks the JPEG segments up to the image data, dropping metadata (EXIF, XMP, comments,
 * maker notes) and checking the size. Returns null if the file is malformed.
 */
export function cleanJpeg(b: Buffer): Buffer | null {
  const out: Buffer[] = [b.subarray(0, 2)];
  let i = 2;
  let sawSize = false;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) { i += 1; continue; } // padding between segments
    if (marker === 0xd9) return null; // ended before any image data
    const len = b.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > b.length) return null;
    const segment = b.subarray(i, i + 2 + len);

    // Start-of-frame markers carry the height and width.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (len < 7) return null;
      const height = b.readUInt16BE(i + 5);
      const width = b.readUInt16BE(i + 7);
      if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      sawSize = true;
    }

    if (marker === 0xda) {
      // Start of scan: the rest is image data. It must end with the end-of-image marker.
      if (!sawSize) return null;
      const rest = b.subarray(i);
      let end = rest.length;
      while (end > 2 && rest[end - 1] === 0x00) end--; // some cameras pad with zeros
      if (rest[end - 2] !== 0xff || rest[end - 1] !== 0xd9) return null;
      out.push(rest.subarray(0, end));
      return Buffer.concat(out);
    }

    // APP1–APP15 hold EXIF (with GPS), XMP and maker notes; 0xFE is a free-text comment.
    // APP0 (JFIF) is harmless and kept. Everything else describes the image and is kept.
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) out.push(segment);
    i += 2 + len;
  }
  return null;
}

/** Text and time chunks can carry anything; they are removed. The image itself is untouched. */
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

/** Checks the PNG chunk layout and size, and removes text and EXIF chunks. Returns null if malformed. */
export function cleanPng(b: Buffer): Buffer | null {
  const out: Buffer[] = [PNG_SIGNATURE];
  let i = 8;
  let first = true;
  while (i + 12 <= b.length) {
    const len = b.readUInt32BE(i);
    const type = b.subarray(i + 4, i + 8).toString("latin1");
    const end = i + 12 + len;
    if (!/^[A-Za-z]{4}$/.test(type) || end > b.length) return null;

    if (first) {
      if (type !== "IHDR" || len !== 13) return null;
      const width = b.readUInt32BE(i + 8);
      const height = b.readUInt32BE(i + 12);
      if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      first = false;
    }

    if (!PNG_DROP.has(type)) out.push(b.subarray(i, end));
    if (type === "IEND") return Buffer.concat(out);
    i = end;
  }
  return null;
}

/** WebP: the container must state its own length correctly. */
export function checkWebp(b: Buffer): Buffer | null {
  if (b.length < 20) return null;
  const declared = b.readUInt32LE(4) + 8;
  return declared === b.length ? b : null;
}
