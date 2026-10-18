/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { Badge, Empty, Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ACCOUNT_STATUS, ASSIGNABLE_ROLES, isOfficial, ROLE_LABEL, type Role } from "@/lib/roles";
import { timeAgo } from "@/lib/format";
import { approveAccount, changeRole, createAccount, markTermEnded, rejectAccount, removeAccount, resetPassword, setAccountActive } from "@/actions/accounts";
import { PENDING_REQUEST_DAYS } from "@/lib/privacy";

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
  // Requests nobody answered are not kept forever (see the privacy notice).
  await sql`delete from users where status = 'pending' and created_at < now() - make_interval(days => ${PENDING_REQUEST_DAYS})`;
  const [pending, accounts] = await Promise.all([
    sql<Row[]>`select id, name, email, role, request_note, created_at from users where status = 'pending' order by created_at`,
    sql<Row[]>`
      select id, name, email, role, status from users
      where status in ('active', 'disabled', 'former') and role <> 'kabataan'
      order by case status when 'active' then 0 when 'disabled' then 1 else 2 end, case role when 'admin' then 0 when 'chairperson' then 1 when 'secretary' then 2 when 'treasurer' then 3 else 4 end, name`,
  ]);

  const hasChair = accounts.some((a) => a.role === "chairperson" && a.status === "active");
  const adminCount = accounts.filter((a) => a.role === "admin" && a.status === "active").length;

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      {!hasChair && (
        <div role="alert" className="max-w-2xl rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          <b>There is no active Chairperson.</b> Nothing can be approved or published, and nobody can add the council, until you create the next Chairperson below. Everything already published stays online.
        </div>
      )}
      {adminCount < 2 && (
        <div role="note" className="max-w-2xl rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          <b>You are the only site admin.</b> If you lose your password or leave, nobody can create accounts here. Name a second admin now (see docs/TURNOVER.md); until then, <code>npm run db:admin</code> can create one from the server.
        </div>
      )}
      <PageHeader eyebrow="Site admin" title="Accounts" size="md" action={<Link href="/council" className="btn-outline">View the public council page</Link>}>
        Nobody can sign up on their own. You create the SK Chairperson&apos;s account below, after checking them against the official list of elected officials. The Chairperson then adds the secretary, treasurer and kagawads from their Team page. You can still create or fix any account here.
      </PageHeader>

      <form action={createAccount} className="card max-w-xl space-y-3">
        <h2 className="text-lg font-bold">Create an account</h2>
        <p className="hint mt-0">Start with the Chairperson. Send the temporary password privately; they will be asked to choose their own the first time they log in. Their name and position appear on the public council page.</p>
        <div><label className="label" htmlFor="new-name">Name</label><input id="new-name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="new-email">Email</label><input id="new-email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="new-role">Position</label><RoleSelect id="new-role" value="chairperson" /></div>
        <div><label className="label" htmlFor="new-password">Temporary password</label><input id="new-password" name="password" type="text" required minLength={8} autoComplete="off" className="input" /></div>
        <SubmitButton pending="Creating...">Create account</SubmitButton>
      </form>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Old account requests</h2>
          <p className="hint mb-4 mt-0">From before sign-up was closed. Approve only someone you have checked against the official list; unanswered requests are deleted after {PENDING_REQUEST_DAYS} days.</p>
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
        </section>
      )}

      <section>
        <h2 className="mb-1 text-xl font-bold">Accounts</h2>
        <p className="hint mb-4 mt-0">Active accounts first, then turned-off accounts, then former officials whose term has ended.</p>
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
                    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                      {u.status !== "former" && isOfficial(u.role) && (
                        <form action={markTermEnded} className="space-y-1">
                          <input type="hidden" name="id" value={u.id} />
                          <SubmitButton className="btn-outline" pending="Saving...">Term ended</SubmitButton>
                          <p className="hint">They are logged out and listed as a former official. Their records stay.</p>
                        </form>
                      )}
                      {u.status !== "active" && (
                        <form action={removeAccount} className="space-y-1">
                          <input type="hidden" name="id" value={u.id} />
                          <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-1"><label className="label text-xs" htmlFor={`rm-${u.id}`}>Type REMOVE to erase their personal details</label><input id={`rm-${u.id}`} name="confirm" required autoComplete="off" className="input py-2 text-sm" /></div>
                            <SubmitButton className="btn-outline text-flag-red" pending="Removing...">Remove</SubmitButton>
                          </div>
                          <p className="hint">Email, password, phone, photo and profile are erased. Their name stays on what they published in office.</p>
                        </form>
                      )}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card max-w-2xl space-y-2 sm:p-6">
        <h2 className="text-lg font-bold">When the term ends</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Mark each outgoing official <b>Term ended</b>. They are logged out and listed as former officials; everything they published stays.</li>
          <li>Create the new Chairperson&apos;s account above, after checking the official list. They add the rest of their council from their Team page.</li>
          <li>If you are handing the admin role over too: create the new admin above, let them log in, and have them turn off your account. You cannot turn off your own, so the site always has an admin. Full checklist: docs/TURNOVER.md.</li>
          <li>Hand over the hosting, database and code accounts as well. The checklist is in docs/OPERATIONS.md.</li>
        </ol>
      </section>

    </div>
  );
}
