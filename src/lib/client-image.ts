/**
 * Browser-only helper: shrinks a photo so it uploads quickly, stays readable, and takes little
 * room in the database. Returns a JPEG data URL. Transparent areas become white.
 *
 * It does not use one fixed setting. It tries the starting size and quality, and if the result
 * is still larger than `targetBytes` it lowers the quality and then the size, step by step,
 * until it fits (or it reaches the smallest setting that is still readable).
 */

/** What a receipt or notes photo is squeezed towards. A readable 1600 px receipt is usually 100-250 KB. */
export const TARGET_BYTES = 250_000;

export type Attempt = { side: number; quality: number };

/** The settings to try, in order, from best to smallest. Pure, so it can be tested. */
export function compressionSteps(maxSide = 1600, quality = 0.78): Attempt[] {
  const steps: Attempt[] = [];
  for (let side = maxSide; side >= 900; side = Math.round(side * 0.85)) {
    for (let q = quality; q >= 0.45; q -= 0.11) steps.push({ side, quality: Math.round(q * 100) / 100 });
  }
  return steps;
}

/** The size of a data URL's picture in bytes (base64 is 4 characters per 3 bytes). */
export function dataUrlBytes(url: string): number {
  const comma = url.indexOf(",");
  const b64 = comma === -1 ? url : url.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
}

export async function shrinkImage(file: File, maxSide = 1600, quality = 0.78, targetBytes = TARGET_BYTES): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  let best = "";
  for (const step of compressionSteps(maxSide, quality)) {
    const scale = Math.min(1, step.side / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    best = canvas.toDataURL("image/jpeg", step.quality);
    if (dataUrlBytes(best) <= targetBytes) break;
  }
  return best;
}
