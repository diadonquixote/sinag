import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/roles";

const NAV: Record<Role, [string, string][]> = {
  chairperson: [["/dashboard/chair", "Approvals & polls"], ["/dashboard/secretary", "Minutes"], ["/dashboard/treasurer", "Finance"], ["/dashboard/team", "Team"]],
  secretary: [["/dashboard/secretary", "Minutes assistant"]],
  treasurer: [["/dashboard/treasurer", "Finance assistant"]],
  kagawad: [["/dashboard/kagawad", "My projects"]],
  kabataan: [["/dashboard", "My activity"]],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole();
  return (
    <div className="container-x py-8">
      <div className="mb-8 rounded-2xl bg-mist p-4 ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">Signed in as <b className="text-ink">{user.name}</b> · {ROLE_LABEL[user.role]}</p>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Desk">
          {NAV[user.role].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-flag-blue ring-1 ring-inset ring-slate-300 hover:ring-flag-blue">{label}</Link>
          ))}
          <Link href="/dashboard/account" className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:text-flag-blue">Account</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
