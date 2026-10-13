import { imageResponse } from "@/lib/image-response";
import { sql, type Row } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/** A photo of handwritten meeting notes. Only the minutes' author and the Chairperson can see it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const viewer = await currentUser(); // checks the role in the database, not just the login cookie
  if (!viewer || !Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const [row] = await sql<Row[]>`
    select p.data, p.type, m.author_id from minutes_photos p join minutes m on m.id = p.minutes_id where p.id = ${id}`;
  if (!row || (viewer.role !== "chairperson" && row.author_id !== viewer.id)) return new Response("Not found", { status: 404 });

  return imageResponse(row.data as Buffer, row.type as string, "private, max-age=86400");
}
