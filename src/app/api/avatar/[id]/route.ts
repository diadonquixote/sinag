import { imageResponse } from "@/lib/image-response";
import { sql, type Row } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isOfficial } from "@/lib/roles";

/**
 * Profile photos.
 * SK officials are public servants, so their photos are public.
 * Kabataan (some are minors) are only shown to themselves and to SK officials.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const [row] = await sql<Row[]>`select role, status, avatar, avatar_type from users where id = ${id} and avatar is not null`;
  if (!row) return new Response("Not found", { status: 404 });

  const publicPhoto = isOfficial(row.role as string) && (row.status === "active" || row.status === "former");
  if (!publicPhoto) {
    const viewer = await currentUser();
    if (!viewer || (viewer.id !== id && !isOfficial(viewer.role))) return new Response("Not found", { status: 404 });
  }

  // The URL carries ?v=<last change>, so the browser can keep the photo until it changes.
  return imageResponse(row.avatar as Buffer, row.avatar_type as string, `${publicPhoto ? "public" : "private"}, max-age=31536000, immutable`);
}
