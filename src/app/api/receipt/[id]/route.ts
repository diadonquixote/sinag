import { sql, type Row } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isOfficial } from "@/lib/roles";

/** A receipt photo. Public receipts are open to everyone; hidden ones only to SK officials. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const [row] = await sql<Row[]>`select data, type, is_public from transaction_receipts where id = ${id}`;
  if (!row) return new Response("Not found", { status: 404 });
  if (!row.is_public) {
    const viewer = await currentUser();
    if (!viewer || !isOfficial(viewer.role)) return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(row.data as Buffer), {
    headers: {
      "Content-Type": (row.type as string) || "image/jpeg",
      "Cache-Control": row.is_public ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
