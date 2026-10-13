import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { login } from "@/actions/auth";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { siteStage } from "@/lib/site";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("login.title") };
}

/** Demo sites show their made-up logins, so anyone can try every desk. Never on a pilot or live site. */
const DEMO_LOGINS: [string, string][] = [
  ["Site admin", "admin@sinag.demo"],
  ["SK Chairperson", "chair@sinag.demo"],
  ["SK Secretary", "secretary@sinag.demo"],
  ["SK Treasurer", "treasurer@sinag.demo"],
  ["SK Kagawad", "kagawad@sinag.demo"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { t }] = await Promise.all([searchParams, getT()]);
  // currentUser, not the cookie alone: a turned-off account must see this page, not loop back to the desk.
  if (await currentUser()) redirect("/dashboard");
  const demo = siteStage() === "demo" && process.env.DEMO_PASSWORD;
  return (
    <AuthShell title={t("login.heading")} intro={t("login.intro")} points={[t("login.p1"), t("login.p2"), t("login.p3")]} brand={t("auth.brand")}>
      <Flash sp={sp} />
      <form action={login} className="space-y-5">
        <div><label className="label" htmlFor="email">{t("login.email")}</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">{t("login.password")}</label><PasswordInput id="password" name="password" required autoComplete="current-password" /></div>
        <SubmitButton className="btn-primary w-full py-3" pending={t("login.busy")}>{t("login.submit")}</SubmitButton>
      </form>
      {demo && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-flag-red ring-1 ring-inset ring-red-200">
          <p className="font-semibold">{t("login.demo", { password: process.env.DEMO_PASSWORD as string })}</p>
          <ul className="mt-2 space-y-1 text-red-900">
            {DEMO_LOGINS.map(([role, email]) => <li key={email}><span className="font-mono">{email}</span> · {role}</li>)}
          </ul>
        </div>
      )}
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">{t("login.noAccount")} <Link href="/request-access" className="font-semibold text-flag-blue hover:underline">{t("login.request")}</Link></p>
    </AuthShell>
  );
}
