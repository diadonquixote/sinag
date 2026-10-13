import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isOfficial } from "@/lib/roles";
import { transcribeImage } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await currentUser(); // the database, not just the cookie: a turned-off account is refused
  if (!session || !isOfficial(session.role)) return NextResponse.json({ error: "Officials only." }, { status: 401 });
  let image = "";
  try {
    image = String((await req.json()).image ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const result = await transcribeImage(image);
  if (!result.text) return NextResponse.json({ error: result.error ?? "Could not read the photo." }, { status: 422 });
  return NextResponse.json({ text: result.text });
}
