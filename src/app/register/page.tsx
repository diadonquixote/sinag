import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { register } from "@/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Join as kabataan" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/dashboard");
  return (
    <div className="container-x flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Join as kabataan</h1>
        <p className="mt-1 text-slate-600">Suggest projects, vote in polls and volunteer. Free.</p>
        <div className="mt-6"><Flash sp={sp} /></div>
        <form action={register} className="card space-y-4">
          <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="barangay">Barangay</label><input id="barangay" name="barangay" className="input" placeholder="Optional" /></div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
            <p className="hint">At least 8 characters.</p>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" className="mt-1" required /> I am a youth member of this barangay (ages 15 to 30).</label>
          <SubmitButton pending="Creating account...">Create my account</SubmitButton>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-flag-blue">Log in</Link></p>
      </div>
    </div>
  );
}
