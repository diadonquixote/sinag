import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { register } from "@/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Join as kabataan" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/dashboard");
  return (
    <AuthShell
      title="Join as kabataan"
      intro="Suggest projects, vote in polls and volunteer. It is free."
      points={["Send in project ideas for your barangay", "Vote on which ideas get funded", "See every peso the SK spends"]}
    >
      <Flash sp={sp} />
      <form action={register} className="space-y-5">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="barangay">Barangay <span className="font-normal text-slate-400">(optional)</span></label><input id="barangay" name="barangay" className="input" /></div>
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
          <p className="hint">At least 8 characters.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-flag-blue has-[:checked]:bg-mist"><input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 accent-flag-blue" required /> I am a youth member of this barangay (ages 15 to 30).</label>
        <SubmitButton className="btn-primary w-full py-3" pending="Creating account...">Create my account</SubmitButton>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-flag-blue hover:underline">Log in</Link></p>
    </AuthShell>
  );
}
