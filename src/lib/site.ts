/**
 * Facts about this deployment that pages share.
 *
 * SINAG_STAGE says what kind of site this is, and the banner at the top of every page says
 * it plainly to visitors:
 *   pilot (default) - a council is trying Sinag out; the paper records are still the official ones
 *   live            - the council has adopted Sinag (for example by resolution); no banner
 *   demo            - made-up data for trying every screen; demo logins are shown on the login page
 */
export type Stage = "pilot" | "live" | "demo";

export function siteStage(): Stage {
  const v = (process.env.SINAG_STAGE || "").trim().toLowerCase();
  return v === "live" || v === "demo" ? v : "pilot";
}

/** The public source code. AGPL-3.0 asks that people using the site can get the code; this is where. */
export const SOURCE_URL = (process.env.NEXT_PUBLIC_SOURCE_URL || "").trim() || "https://github.com/diadonquixote/sinag";

/** PDYN Technologies' public contact address. */
export const PDYN_EMAIL = "pdyntechnology@gmail.com";
