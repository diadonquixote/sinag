import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import { requestAccess } from "@/actions/auth";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { OFFICIAL_ROLES, ROLE_LABEL } from "@/lib/roles";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("request.title") };
}

/** Elected SK officials ask for an account here. The site admin approves it before it works. */
export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { t }] = await Promise.all([searchParams, getT()]);
  if (await currentUser()) redirect("/dashboard");
  const [before, after] = t("request.privacy").split("{link}");
  return (
    <AuthShell title={t("request.title")} intro={t("request.intro")} points={[t("request.p1"), t("request.p2"), t("request.p3")]} brand={t("auth.brand")}>
      <Flash sp={sp} />
      <form action={requestAccess} className="space-y-5">
        <div><label className="label" htmlFor="name">{t("request.name")}</label><input id="name" name="name" required autoComplete="name" maxLength={120} className="input" /><p className="hint">{t("request.nameHint")}</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">{t("request.email")}</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="role">{t("request.position")}</label>
            <select id="role" name="role" required defaultValue="" className="input">
              <option value="" disabled>{t("request.choose")}</option>
              {OFFICIAL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="note">{t("request.note")}</label>
          <textarea id="note" name="note" required rows={3} maxLength={500} className="input" placeholder={t("request.notePlaceholder")} />
          <p className="hint">{t("request.noteHint")}</p>
        </div>
        <div>
          <label className="label" htmlFor="password">{t("request.password")}</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
          <p className="hint">{t("request.passwordHint")}</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-flag-blue has-[:checked]:bg-mist"><input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 accent-flag-blue" required /> {t("request.confirm")}</label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-flag-blue has-[:checked]:bg-mist">
          <input type="checkbox" name="privacy" className="mt-0.5 h-4 w-4 accent-flag-blue" required />
          <span>{before}<Link href="/privacy" target="_blank" className="font-semibold text-flag-blue underline">{t("request.privacyLink")}</Link>{after}</span>
        </label>
        <SubmitButton className="btn-primary w-full py-3" pending={t("request.busy")}>{t("request.submit")}</SubmitButton>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">{t("request.already")} <Link href="/login" className="font-semibold text-flag-blue hover:underline">{t("nav.login")}</Link></p>
    </AuthShell>
  );
}
