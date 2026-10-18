/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { redirect } from "next/navigation";

/**
 * Redirects to `path` with a short success or error message in the URL.
 * Pages show it with <Flash />. `path` must not already contain a query string.
 * Never put anything private in the message.
 */
export function back(path: string, kind: "ok" | "err", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message.slice(0, 300))}`);
}
