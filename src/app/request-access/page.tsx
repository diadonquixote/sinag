import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { requestAccess } from "@/actions/auth";
import { currentUser } from "@/lib/auth";
import { OFFICIAL_ROLES, ROLE_LABEL } from "@/lib/roles";

export const metadata = { title: "Request an official account" };

/** Elected SK officials ask for an account here. The site admin approves it before it works. */
export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthShell
      title="Request an official account"
      intro="For elected SK officials only. Everyone else can read everything on Sinag without an account."
      points={["The site admin checks you against the list of elected officials", "You can log in as soon as they approve", "Once approved, your name and position appear on the public council page"]}
    >
      <Flash sp={sp} />
      <form action={requestAccess} className="space-y-5">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" maxLength={120} className="input" /><p className="hint">As it appears on the list of elected officials.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="role">Position</label>
            <select id="role" name="role" required defaultValue="" className="input">
              <option value="" disabled>Choose...</option>
              {OFFICIAL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="note">How can the admin confirm it is you?</label>
          <textarea id="note" name="note" required rows={3} maxLength={500} className="input" placeholder="e.g. Elected SK Kagawad, 2023. The admin can reach me on Facebook as ..." />
          <p className="hint">Only the site admin sees this.</p>
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
          <p className="hint">At least 8 characters. Do not reuse a password from another site.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-flag-blue has-[:checked]:bg-mist"><input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 accent-flag-blue" required /> I am an elected official of this SK, and I understand my name, position and what I publish here are public.</label>
        <SubmitButton className="btn-primary w-full py-3" pending="Sending...">Send request</SubmitButton>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">Already approved? <Link href="/login" className="font-semibold text-flag-blue hover:underline">Log in</Link></p>
    </AuthShell>
  );
}
