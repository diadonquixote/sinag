import { redirect } from "next/navigation";

/**
 * Redirects to `path` with a short success or error message in the URL.
 * Pages show it with <Flash />. `path` must not already contain a query string.
 * Never put anything private in the message.
 */
export function back(path: string, kind: "ok" | "err", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message.slice(0, 300))}`);
}
