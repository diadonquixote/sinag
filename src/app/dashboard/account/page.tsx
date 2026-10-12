import { Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
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
      <PageHeader eyebrow="Account" title="Your account" size="md">{user.name} · {ROLE_LABEL[user.role]}</PageHeader>
      <form action={changePassword} className="card space-y-3">
        <h2 className="text-lg font-bold">Change password</h2>
        <div><label className="label" htmlFor="current">Current password</label><PasswordInput id="current" name="current" required autoComplete="current-password" /></div>
        <div><label className="label" htmlFor="next">New password</label><PasswordInput id="next" name="next" required minLength={8} autoComplete="new-password" /></div>
        <SubmitButton pending="Saving...">Change password</SubmitButton>
      </form>
    </div>
  );
}
