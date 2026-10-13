import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { login } from "@/actions/auth";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  // currentUser, not the cookie alone: a turned-off account must see this page, not loop back to the desk.
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthShell
      title="Welcome back"
      intro="For SK officials. Everything the public needs is already open, with no account."
      points={["Record projects, budgets and schedules", "Write minutes and financial reports", "Publish them for everyone to read"]}
    >
      <Flash sp={sp} />
      <form action={login} className="space-y-5">
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" name="password" required autoComplete="current-password" /></div>
        <SubmitButton className="btn-primary w-full py-3" pending="Logging in...">Log in</SubmitButton>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">Elected SK official without an account? <Link href="/request-access" className="font-semibold text-flag-blue hover:underline">Request one</Link></p>
    </AuthShell>
  );
}
