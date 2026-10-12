"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A slim reminder to finish the profile. Hidden on the profile page itself. */
export default function ProfileNudge({ missing }: { missing: string[] }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/profile")) return null;
  const list = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0];
  return (
    <div className="border-b border-yellow-200 bg-yellow-50">
      <div className="container-x flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 text-sm text-yellow-900">
        <p>Finish your profile: add {list}.</p>
        <Link href="/dashboard/profile" className="font-semibold underline-offset-4 hover:underline">Open profile →</Link>
      </div>
    </div>
  );
}
