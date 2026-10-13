import Link from "next/link";
import { Badge, Empty, Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ACCOUNT_STATUS, ASSIGNABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";
import { timeAgo } from "@/lib/format";
import { approveAccount, changeRole, createAccount, rejectAccount, resetPassword, setAccountActive } from "@/actions/accounts";

export const metadata = { title: "Accounts" };

function RoleSelect({ id, value }: { id: string; value: string }) {
  return (
    <select id={id} name="role" defaultValue={value} className="input py-2 text-sm">
      {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
    </select>
  );
}

/** The site admin's desk: who may log in, and as what. */
export default async function AdminDesk({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireRole("admin");
  const sp = await searchParams;
  const [pending, accounts] = await Promise.all([
    sql<Row[]>`select id, name, email, role, request_note, created_at from users where status = 'pending' order by created_at`,
    sql<Row[]>`
      select id, name, email, role, status from users
      where status in ('active', 'disabled') and role <> 'kabataan'
      order by status, case role when 'admin' then 0 when 'chairperson' then 1 when 'secretary' then 2 when 'treasurer' then 3 else 4 end, name`,
  ]);

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <section>
        <PageHeader eyebrow="Site admin" title="Account requests" size="md" action={<Link href="/council" className="btn-outline">View the public council page</Link>}>
          Officials ask for an account at <b>/request-access</b>. Check each one against the official list of elected SK officials before you approve. Approving puts their name and position on the public council page.
        </PageHeader>
        {pending.length === 0 ? <Empty size="sm">No requests waiting.</Empty> : (
          <ul className="space-y-3">
            {pending.map((u) => (
              <li key={u.id} className="card space-y-3 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="min-w-0"><b className="font-semibold">{u.name}</b> <span className="text-sm text-slate-500">asks to be {ROLE_LABEL[u.role as Role]}</span></p>
                  <span className="text-xs text-slate-400">{timeAgo(u.created_at)}</span>
                </div>
                <p className="break-all text-sm text-slate-500">{u.email}</p>
                {u.request_note && <p className="whitespace-pre-line rounded-lg bg-mist px-3 py-2 text-sm text-slate-700">{u.request_note}</p>}
                <div className="flex flex-wrap items-end gap-2">
                  <form action={approveAccount} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <div><label className="label text-xs" htmlFor={`approve-role-${u.id}`}>Approve as</label><RoleSelect id={`approve-role-${u.id}`} value={u.role} /></div>
                    <SubmitButton pending="Approving...">Approve</SubmitButton>
                  </form>
                  <form action={rejectAccount}>
                    <input type="hidden" name="id" value={u.id} />
                    <SubmitButton className="btn-outline text-flag-red" pending="Removing...">Turn down</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Everyone who can log in</h2>
        <ul className="space-y-3">
          {accounts.map((u) => {
            const self = u.id === me.id;
            const status = ACCOUNT_STATUS[u.status as string];
            return (
              <li key={u.id} className="card space-y-3 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0">
                    <b className="font-semibold">{u.name}</b>{self && <span className="text-sm text-slate-500"> (you)</span>}
                    <span className="block break-all text-sm text-slate-500">{ROLE_LABEL[u.role as Role]} · {u.email}</span>
                  </p>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
                {!self && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold text-flag-blue">Manage</summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <form action={changeRole} className="flex items-end gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <div className="min-w-0 flex-1"><label className="label text-xs" htmlFor={`role-${u.id}`}>Role</label><RoleSelect id={`role-${u.id}`} value={u.role} /></div>
                        <SubmitButton className="btn-outline" pending="Saving...">Save</SubmitButton>
                      </form>
                      <form action={resetPassword} className="flex items-end gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <div className="min-w-0 flex-1"><label className="label text-xs" htmlFor={`pw-${u.id}`}>New temporary password</label><input id={`pw-${u.id}`} name="password" type="text" required minLength={8} autoComplete="off" className="input py-2 text-sm" /></div>
                        <SubmitButton className="btn-outline" pending="Saving...">Set</SubmitButton>
                      </form>
                      <form action={setAccountActive} className="flex items-end">
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="on" value={u.status === "active" ? "0" : "1"} />
                        <SubmitButton className={u.status === "active" ? "btn-outline text-flag-red" : "btn-outline"} pending="Saving...">
                          {u.status === "active" ? "Turn off account" : "Turn account back on"}
                        </SubmitButton>
                      </form>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <form action={createAccount} className="card max-w-xl space-y-3">
        <h2 className="text-lg font-bold">Add an account yourself</h2>
        <p className="hint mt-0">For someone you have already confirmed. Share the temporary password privately; they can change it under Profile.</p>
        <div><label className="label" htmlFor="new-name">Name</label><input id="new-name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="new-email">Email</label><input id="new-email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="new-role">Position</label><RoleSelect id="new-role" value="secretary" /></div>
        <div><label className="label" htmlFor="new-password">Temporary password</label><input id="new-password" name="password" type="text" required minLength={8} autoComplete="off" className="input" /></div>
        <SubmitButton pending="Creating...">Create account</SubmitButton>
      </form>
    </div>
  );
}
