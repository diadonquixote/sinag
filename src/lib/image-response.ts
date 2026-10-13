/**
 * How stored photos are sent back to the browser.
 *
 * Even a photo that passed every upload check is served as if it might be hostile: the
 * browser is told exactly what type it is and not to guess (nosniff), and a sandbox policy
 * means that if anything other than a picture were ever stored, it still could not run
 * script or load anything.
 */
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
