/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { redirect } from "next/navigation";

/** The account page moved into the profile page. */
export default function Account() {
  redirect("/dashboard/profile");
}
