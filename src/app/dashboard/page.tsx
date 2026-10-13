import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

/** Everyone who can log in is an official, so this just sends them to their own desk. */
export default async function Dashboard() {
  const user = await requireRole();
  // ROLE_HOME sends a kabataan account to "/", so this can never loop back here.
  redirect(ROLE_HOME[user.role]);
}
