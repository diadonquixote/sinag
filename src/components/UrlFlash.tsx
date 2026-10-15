"use client";

import { useSearchParams } from "next/navigation";
import { Flash } from "./ui";

/** The same message banner as Flash, for places that cannot read the page's search params. */
export default function UrlFlash() {
  const sp = useSearchParams();
  return <Flash sp={{ ok: sp.get("ok") ?? undefined, err: sp.get("err") ?? undefined }} />;
}
