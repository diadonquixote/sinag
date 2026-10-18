/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use client";

import { usePathname, useSearchParams } from "next/navigation";

/** A plain link to /lang, so it works even before the page's scripts load. */
export default function LanguageSwitch({ to, label, title, className = "" }: { to: "en" | "fil"; label: string; title: string; className?: string }) {
  const pathname = usePathname() || "/";
  const search = useSearchParams()?.toString();
  const next = search ? `${pathname}?${search}` : pathname;
  return (
    <a
      href={`/lang?to=${to}&next=${encodeURIComponent(next)}`}
      lang={to === "fil" ? "fil" : "en"}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:text-flag-blue hover:ring-flag-blue ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="7.5" /><path d="M2.5 10h15M10 2.5c2.2 2.4 2.2 12.6 0 15M10 2.5c-2.2 2.4-2.2 12.6 0 15" /></svg>
      {label}
    </a>
  );
}
