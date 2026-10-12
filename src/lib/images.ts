/** Shared checks for photos sent from the browser as data URLs. Server-side only. */

export type DecodedImage = { bytes: Buffer; type: "image/jpeg" | "image/png" | "image/webp" };

/** Turns "data:image/jpeg;base64,..." into bytes, or null if it is not a real JPEG, PNG or WebP within the size limit. */
export function decodeImage(dataUrl: string, maxBytes: number): DecodedImage | null {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0 || bytes.length > maxBytes || !looksLikeImage(bytes)) return null;
  return { bytes, type: m[1] as DecodedImage["type"] };
}

/** Checks the first bytes so only real JPEG, PNG or WebP images are stored. */
export function looksLikeImage(b: Buffer): boolean {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}
