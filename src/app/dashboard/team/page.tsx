import Link from "next/link";
import { Flash, PageHeader } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, TEAM_LIMITS, TEAM_ROLES, type Role } from "@/lib/roles";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { addOfficial, endTeamTerm, resetTeamPassword } from "@/actions/team";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("chairperson");
  const sp = await searchParams;
  const team = await sql<Row[]>`
    select id, name, email, role, committee, phone, must_change_password, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users where role in ('chairperson','secretary','treasurer','kagawad') and status = 'active'
    order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`;
  return (
    <div className="space-y-8">
      <Flash sp={sp} />
      <PageHeader eyebrow="Chairperson desk" title="SK team" size="md" action={<Link href="/council" className="btn-outline">View the public council page</Link>}>Everyone who can log in to an official desk. Nobody can sign up on their own: you add your secretary, treasurer and kagawads here, and the site admin handles your own account. When someone leaves, mark their term as ended and add their replacement.</PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((u) => (
          <li key={u.id} className="card space-y-3 py-4">
            <div className="flex items-center gap-3">
              <Avatar id={u.id} name={u.name} v={u.avatar_v} size="md" tone="light" />
              <span className="min-w-0">
                <Link href={`/council/${u.id}`} className="block truncate font-semibold text-ink hover:text-flag-blue">{u.name}</Link>
                <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[u.role as Role]}{u.committee ? ` · ${u.committee}` : ""}</span>
                <span className="block truncate text-xs text-slate-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</span>
                {u.must_change_password && <span className="mt-1 inline-block rounded bg-yellow-50 px-1.5 py-0.5 text-[11px] font-semibold text-yellow-900">Has not logged in yet</span>}
              </span>
            </div>
            {TEAM_ROLES.includes(u.role as Role) && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-flag-blue">Forgot their password?</summary>
                <form action={resetTeamPassword} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="min-w-0 flex-1"><label className="label text-xs" htmlFor={`reset-${u.id}`}>New temporary password</label><input id={`reset-${u.id}`} name="password" type="text" required minLength={8} autoComplete="off" className="input py-2 text-sm" /></div>
                  <SubmitButton className="btn-outline btn-sm" pending="Saving...">Set</SubmitButton>
                </form>
              </details>
            )}
            {TEAM_ROLES.includes(u.role as Role) && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-flag-blue">Term ended or left the council?</summary>
                <form action={endTeamTerm} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={u.id} />
                  <p className="hint mt-0">They can no longer log in and are listed as a former official. What they published stays on the record. Their seat becomes free for the next person.</p>
                  <SubmitButton className="btn-outline btn-sm text-flag-red" pending="Saving...">Term ended</SubmitButton>
                </form>
              </details>
            )}
          </li>
        ))}
      </ul>

      <form action={addOfficial} className="card max-w-xl space-y-3">
        <h2 className="text-lg font-bold">Add an official</h2>
        <p className="hint mt-0">
          For your appointed secretary and treasurer and your elected kagawads ({Object.entries(TEAM_LIMITS).map(([r, n]) => `${n} ${ROLE_LABEL[r as Role].replace("SK ", "").toLowerCase()}${n === 1 ? "" : "s"}`).join(", ")} at most).
          Their name and position appear on the public council page. Send them the temporary password privately, for example in a private message; they choose their own password the first time they log in.
        </p>
        <div><label className="label" htmlFor="new-name">Full name</label><input id="new-name" name="name" required maxLength={120} className="input" /></div>
        <div><label className="label" htmlFor="new-email">Email</label><input id="new-email" name="email" type="email" required className="input" /></div>
        <div>
          <label className="label" htmlFor="new-role">Position</label>
          <select id="new-role" name="role" required defaultValue="kagawad" className="input">
            {TEAM_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="new-password">Temporary password</label><input id="new-password" name="password" type="text" required minLength={8} autoComplete="off" className="input" /><p className="hint">At least 8 characters. They will replace it when they first log in.</p></div>
        <SubmitButton pending="Adding...">Add official</SubmitButton>
      </form>
    </div>
  );
}
