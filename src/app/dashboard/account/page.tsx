import { redirect } from "next/navigation";

/** The account page moved into the profile page. */
export default function Account() {
  redirect("/dashboard/profile");
}
