import { Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { initials } from "@/lib/format";
import { createOfficial } from "@/actions/auth";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("chairperson");
  const sp = await searchParams;
  const team = await sql<Row[]>`select id, name, email, role from users where role <> 'kabataan' order by role, name`;
  return (
    <div className="space-y-8">
      <Flash sp={sp} />
      <PageHeader eyebrow="Chairperson desk" title="SK team" size="md">Everyone who can log in to an official desk. Add new officials below and share their temporary password privately.</PageHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((u) => (
          <li key={u.id} className="card flex items-center gap-3 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-bold text-flag-blue ring-1 ring-inset ring-slate-200">{initials(u.name as string)}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink">{u.name}</span>
              <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[u.role as Role]} · {u.email}</span>
            </span>
          </li>
        ))}
      </ul>
      <form action={createOfficial} className="card max-w-xl space-y-3">
        <h2 className="text-lg font-bold">Add an official</h2>
        <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="role">Position</label>
          <select id="role" name="role" required defaultValue="" className="input"><option value="" disabled>Choose...</option><option value="secretary">SK Secretary</option><option value="treasurer">SK Treasurer</option><option value="kagawad">SK Kagawad</option></select></div>
        <div><label className="label" htmlFor="password">Temporary password</label><input id="password" name="password" type="text" required minLength={8} autoComplete="off" className="input" /><p className="hint">Share it privately. They can change it under Account.</p></div>
        <SubmitButton pending="Creating...">Create account</SubmitButton>
      </form>
    </div>
  );
}
