import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { readReceipt } from "@/lib/ai";

export const maxDuration = 60;

/** Treasurer only: reads amount, date and OR number from a receipt photo as suggestions. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "treasurer") return NextResponse.json({ error: "Treasurer only." }, { status: 401 });
  let image = "";
  try {
    image = String((await req.json()).image ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const result = await readReceipt(image);
  if (!result.reading) return NextResponse.json({ error: result.error ?? "Could not read the receipt." }, { status: 422 });
  return NextResponse.json(result.reading);
}
