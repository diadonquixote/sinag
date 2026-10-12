import { sql, type Row } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isOfficial } from "@/lib/roles";

/**
 * Profile photos.
 * SK officials are public servants, so their photos are public.
 * Kabataan (some are minors) are only shown to themselves and to SK officials.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const [row] = await sql<Row[]>`select role, avatar, avatar_type from users where id = ${id} and avatar is not null`;
  if (!row) return new Response("Not found", { status: 404 });

  const publicPhoto = isOfficial(row.role as string);
  if (!publicPhoto) {
    const viewer = await getSession();
    if (!viewer || (viewer.id !== id && !isOfficial(viewer.role))) return new Response("Not found", { status: 404 });
  }

  // The URL carries ?v=<last change>, so the browser can keep the photo until it changes.
  return new Response(new Uint8Array(row.avatar as Buffer), {
    headers: {
      "Content-Type": (row.avatar_type as string) || "image/jpeg",
      "Cache-Control": `${publicPhoto ? "public" : "private"}, max-age=31536000, immutable`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
