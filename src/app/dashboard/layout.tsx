import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { initials } from "@/lib/format";
import { DeskTabs, type NavItem } from "@/components/NavLinks";

const NAV: Record<Role, (NavItem & { exact?: boolean })[]> = {
  chairperson: [
    { href: "/dashboard/chair", label: "Approvals & polls" },
    { href: "/dashboard/secretary", label: "Minutes" },
    { href: "/dashboard/treasurer", label: "Finance" },
    { href: "/dashboard/team", label: "Team" },
  ],
  secretary: [{ href: "/dashboard/secretary", label: "Minutes assistant" }],
  treasurer: [{ href: "/dashboard/treasurer", label: "Finance assistant" }],
  kagawad: [{ href: "/dashboard/kagawad", label: "My projects" }],
  kabataan: [{ href: "/dashboard", label: "My activity", exact: true }],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole();
  const tabs = [...NAV[user.role], { href: "/dashboard/account", label: "Account" }];
  // Minutes and report pages belong to the Minutes / Finance tabs.
  const withDocs = tabs.map((t) =>
    t.href === "/dashboard/secretary" ? { ...t, also: "/dashboard/minutes" } : t.href === "/dashboard/treasurer" ? { ...t, also: "/dashboard/reports" } : t,
  );
  return (
    <>
      <div className="border-b border-slate-200 bg-gradient-to-b from-mist to-white">
        <div className="container-x pt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flag-blue font-bold text-white ring-4 ring-white">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="text-xs font-medium text-slate-500">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <div className="mt-5">
            <DeskTabs links={withDocs} />
          </div>
        </div>
      </div>
      <div className="container-x py-8 sm:py-10">{children}</div>
    </>
  );
}
