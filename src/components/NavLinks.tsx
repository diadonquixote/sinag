/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/** Main site links. Marks the page you are on. */
export function NavLinks({ links, variant }: { links: NavItem[]; variant: "bar" | "menu" }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return variant === "bar" ? (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              active ? "text-flag-blue" : "text-slate-600 hover:bg-mist hover:text-ink"
            }`}
          >
            {l.label}
            {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-flag-blue" />}
          </Link>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold ${
              active ? "bg-mist text-flag-blue" : "text-ink hover:bg-mist"
            }`}
          >
            {l.label}
            {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-flag-blue" />}
          </Link>
        );
      })}
    </>
  );
}

/** Tabs for an official's desk. */
export function DeskTabs({ links }: { links: (NavItem & { exact?: boolean; also?: string })[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Desk" className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none]">
      {links.map((l) => {
        const active = isActive(pathname, l.href, l.exact) || (!!l.also && isActive(pathname, l.also));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-3 pt-1 text-sm font-semibold transition-colors ${
              active ? "border-flag-blue text-flag-blue" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
