import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { changePassword } from "@/actions/auth";

export const metadata = { title: "Account" };

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole();
  const sp = await searchParams;
  return (
    <div className="max-w-md space-y-6">
      <Flash sp={sp} />
      <h1 className="text-2xl font-bold">Account</h1>
      <p className="text-slate-600">{user.name} · {ROLE_LABEL[user.role]}</p>
      <form action={changePassword} className="card space-y-3">
        <h2 className="text-lg font-bold">Change password</h2>
        <div><label className="label" htmlFor="current">Current password</label><input id="current" name="current" type="password" required autoComplete="current-password" className="input" /></div>
        <div><label className="label" htmlFor="next">New password</label><input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" /></div>
        <SubmitButton pending="Saving...">Change password</SubmitButton>
      </form>
    </div>
  );
}
