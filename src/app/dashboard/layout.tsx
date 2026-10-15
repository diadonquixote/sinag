import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { acceptPrivacy } from "@/actions/auth";
import { PRIVACY_VERSION } from "@/lib/privacy";
import { sql, type Row } from "@/lib/db";
import { isOfficial, ROLE_LABEL, type Role } from "@/lib/roles";
import Avatar from "@/components/Avatar";
import ProfileNudge from "@/components/ProfileNudge";
import { DeskTabs, type NavItem } from "@/components/NavLinks";
import FirstPassword from "@/components/FirstPassword";

const NAV: Record<Role, (NavItem & { exact?: boolean })[]> = {
  chairperson: [
    { href: "/dashboard/chair", label: "Approvals & projects" },
    { href: "/dashboard/secretary", label: "Minutes" },
    { href: "/dashboard/treasurer", label: "Finance" },
    { href: "/dashboard/team", label: "Team" },
  ],
  secretary: [{ href: "/dashboard/secretary", label: "Minutes assistant" }],
  treasurer: [{ href: "/dashboard/treasurer", label: "Finance assistant" }],
  kagawad: [{ href: "/dashboard/kagawad", label: "My projects" }],
  kabataan: [],   // v1 has no kabataan desk
  admin: [{ href: "/dashboard/admin", label: "Accounts" }],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole();
  const [me] = await sql<Row[]>`select committee, bio, purok, privacy_version, must_change_password from users where id = ${user.id}`;
  const tabs = [...NAV[user.role], { href: "/dashboard/profile", label: "Profile" }];
  // Minutes and report pages belong to the Minutes / Finance tabs.
  const withDocs = tabs.map((t) =>
    t.href === "/dashboard/secretary" ? { ...t, also: "/dashboard/minutes" } : t.href === "/dashboard/treasurer" ? { ...t, also: "/dashboard/reports" } : t,
  );
  const missing = user.role === "admin" ? [] : [!user.avatarV && "a photo", !me?.bio && "a short bio", !me?.purok && "your purok"].filter(Boolean) as string[];
  return (
    <>
      <div className="border-b border-slate-200 bg-gradient-to-b from-mist to-white">
        <div className="container-x pt-6">
          <div className="flex items-center gap-3">
            <Avatar id={user.id} name={user.name} v={user.avatarV} size="lg" className="ring-4 ring-white" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs font-medium text-slate-500">
                {ROLE_LABEL[user.role]}{isOfficial(user.role) && me?.committee ? ` · ${me.committee}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <DeskTabs links={withDocs} />
          </div>
        </div>
      </div>
      {me?.privacy_version !== PRIVACY_VERSION && (
        <div className="border-b border-yellow-200 bg-yellow-50">
          <form action={acceptPrivacy} className="container-x flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-yellow-900">
            <p>Please read the <Link href="/privacy" className="font-semibold underline">privacy notice</Link>. It explains what Sinag publishes about you as an official and what it keeps private.</p>
            <button className="btn-outline bg-white py-1.5 text-sm">I have read it</button>
          </form>
        </div>
      )}
      {missing.length > 0 && !me?.must_change_password && <ProfileNudge missing={missing} />}
      <div className="container-x py-8 sm:py-10">{me?.must_change_password ? <FirstPassword /> : children}</div>
    </>
  );
}
