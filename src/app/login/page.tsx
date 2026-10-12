import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { login } from "@/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/dashboard");
  return (
    <AuthShell
      title="Welcome back"
      intro="SK officials and kabataan log in here."
      points={["Vote in polls and suggest projects", "Volunteer for scheduled events", "Officials: open your desk to approve, record and report"]}
    >
      <Flash sp={sp} />
      <form action={login} className="space-y-5">
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" name="password" required autoComplete="current-password" /></div>
        <SubmitButton className="btn-primary w-full py-3" pending="Logging in...">Log in</SubmitButton>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">New here? <Link href="/register" className="font-semibold text-flag-blue hover:underline">Join as kabataan</Link>. SK officials: your Chairperson creates your account.</p>
    </AuthShell>
  );
}
