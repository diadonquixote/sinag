/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { initials } from "@/lib/format";

const SIZE = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-11 w-11 text-sm",
  xl: "h-24 w-24 text-2xl",
} as const;

/**
 * A round profile picture, or the person's initials when there is no photo
 * (or when the photo should not be shown in this place).
 */
export default function Avatar({
  id,
  name,
  v,
  size = "md",
  tone = "blue",
  className = "",
}: {
  id: number;
  name: string;
  /** photo version from the database; leave empty to show initials */
  v?: string | null;
  size?: keyof typeof SIZE;
  tone?: "blue" | "light";
  className?: string;
}) {
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${SIZE[size]} ${className}`;
  if (v) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/avatar/${id}?v=${v}`} alt="" width={96} height={96} loading="lazy" className={`${base} bg-slate-100 object-cover`} />;
  }
  return (
    <span aria-hidden="true" className={`${base} ${tone === "blue" ? "bg-flag-blue text-white" : "bg-mist text-flag-blue ring-1 ring-inset ring-slate-200"}`}>
      {initials(name)}
    </span>
  );
}
