/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { Suspense } from "react";
import { changePassword } from "@/actions/auth";
import PasswordInput from "./PasswordInput";
import SubmitButton from "./SubmitButton";
import UrlFlash from "./UrlFlash";

/**
 * Shown instead of the desk until someone given a temporary password (by the site admin or
 * their Chairperson) chooses their own. The temporary one travelled by message, so it is
 * treated as known to others.
 */
export default function FirstPassword() {
  return (
    <div className="mx-auto max-w-lg">
      <Suspense fallback={null}><UrlFlash /></Suspense>
      <form action={changePassword} className="card space-y-5 sm:p-6">
        <div>
          <p className="eyebrow">Welcome to Sinag</p>
          <h1 className="mt-2 text-2xl font-bold">Choose your own password</h1>
          <p className="hint mt-1">Your account was made with a temporary password. Replace it before you start: the temporary one was sent to you in a message, so treat it as known to others.</p>
        </div>
        <div><label className="label" htmlFor="current">Temporary password</label><PasswordInput id="current" name="current" required autoComplete="current-password" /></div>
        <div><label className="label" htmlFor="next">New password</label><PasswordInput id="next" name="next" required minLength={8} autoComplete="new-password" /><p className="hint">At least 8 characters. Do not reuse a password from another site.</p></div>
        <SubmitButton className="btn-primary w-full py-3" pending="Saving...">Save my password</SubmitButton>
      </form>
    </div>
  );
}
