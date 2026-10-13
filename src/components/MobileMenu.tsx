"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Phone menu. Closes when you pick a page, tap outside, or press Escape. */
export default function MobileMenu({ children, openLabel = "Open menu", closeLabel = "Close menu" }: { children: React.ReactNode; openLabel?: string; closeLabel?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink hover:bg-mist"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 pb-5 pt-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
