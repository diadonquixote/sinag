/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";

/**
 * Switches the language and goes back to the page the visitor was on.
 *   /lang?to=fil&next=/funds
 * Works without JavaScript. `next` must be a path on this site, so the link cannot be used
 * to send people somewhere else.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") === "fil" ? "fil" : "en";
  const next = url.searchParams.get("next") ?? "/";
  const safe = /^\/(?![/\\])/.test(next) ? next : "/";
  const res = NextResponse.redirect(new URL(safe, url), 303);
  res.cookies.set(LANG_COOKIE, to, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return res;
}
