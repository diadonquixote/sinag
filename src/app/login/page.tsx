import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { login } from "@/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/dashboard");
  return (
    <div className="container-x flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-slate-600">SK officials and kabataan log in here.</p>
        <div className="mt-6"><Flash sp={sp} /></div>
        <form action={login} className="card space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          <SubmitButton pending="Logging in...">Log in</SubmitButton>
        </form>
        <p className="mt-4 text-sm text-slate-600">New here? <Link href="/register" className="font-semibold text-flag-blue">Join as kabataan</Link>. SK officials: your Chairperson creates your account.</p>
      </div>
    </div>
  );
}
