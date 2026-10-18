/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * How stored photos are sent back to the browser.
 *
 * Even a photo that passed every upload check is served as if it might be hostile: the
 * browser is told exactly what type it is and not to guess (nosniff), and a sandbox policy
 * means that if anything other than a picture were ever stored, it still could not run
 * script or load anything.
 */
import { decryptPhoto } from "./crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function imageResponse(data: Buffer | Uint8Array, storedType: string | null | undefined, cacheControl: string): Response {
  const type = storedType && ALLOWED.has(storedType) ? storedType : null;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type ?? "application/octet-stream",
      "Content-Disposition": type ? "inline" : "attachment",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

/**
 * A stored photo, decrypted for this one response (see crypto.ts). If it cannot be decrypted
 * (the key changed, or the stored bytes were altered) nothing is served and the problem is
 * logged, rather than sending broken or tampered data to the browser.
 */
export function servePhoto(stored: Buffer | Uint8Array, storedType: string | null | undefined, cacheControl: string): Response {
  try {
    return imageResponse(decryptPhoto(stored), storedType, cacheControl);
  } catch (err) {
    console.error("A stored photo could not be decrypted:", err instanceof Error ? err.message : err);
    return new Response("Photo unavailable", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
