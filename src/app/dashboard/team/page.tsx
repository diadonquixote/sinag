import Link from "next/link";
import { Flash, PageHeader } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import Avatar from "@/components/Avatar";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("chairperson");
  const sp = await searchParams;
  const team = await sql<Row[]>`
    select id, name, email, role, committee, phone, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users where role in ('chairperson','secretary','treasurer','kagawad') and status = 'active'
    order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`;
  return (
    <div className="space-y-8">
      <Flash sp={sp} />
      <PageHeader eyebrow="Chairperson desk" title="SK team" size="md" action={<Link href="/council" className="btn-outline">View the public council page</Link>}>Everyone who can log in to an official desk. New officials ask for an account at /request-access, and the site admin approves them after checking the list of elected officials.</PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((u) => (
          <li key={u.id} className="card flex items-center gap-3 py-4">
            <Avatar id={u.id} name={u.name} v={u.avatar_v} size="md" tone="light" />
            <span className="min-w-0">
              <Link href={`/council/${u.id}`} className="block truncate font-semibold text-ink hover:text-flag-blue">{u.name}</Link>
              <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[u.role as Role]}{u.committee ? ` · ${u.committee}` : ""}</span>
              <span className="block truncate text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
