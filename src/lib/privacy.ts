/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * Privacy settings that the notice and the forms share.
 *
 * Bump PRIVACY_VERSION whenever the privacy notice changes in substance. Officials who agreed
 * to an older version are asked to read it again on their next visit to their desk.
 */
export const PRIVACY_VERSION = "2026-10-15";

/**
 * Who answers privacy questions for this council: the Data Protection Officer, or the barangay
 * Compliance Officer for Privacy the municipality designated. Set PRIVACY_CONTACT_NAME and
 * PRIVACY_CONTACT_EMAIL when the council names them (see docs/PRIVACY.md).
 */
export function privacyContact(): { name: string | null; email: string | null } {
  const name = (process.env.PRIVACY_CONTACT_NAME || "").trim() || null;
  const email = (process.env.PRIVACY_CONTACT_EMAIL || "").trim() || null;
  return { name, email };
}

/** How long a request for an account waits for approval before it is deleted unanswered. */
export const PENDING_REQUEST_DAYS = 30;
