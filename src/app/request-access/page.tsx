/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { ADMIN_EMAIL } from "@/lib/site";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("request.title") };
}

/**
 * There is no sign-up form: accounts are created by the site admin (the Chairperson's) and by
 * the Chairperson (the rest of the council). This page explains that to anyone who looks.
 */
export default async function RequestAccessPage() {
  const { t } = await getT();
  if (await currentUser()) redirect("/dashboard");
  const [before, after] = t("request.chairBody").split("{email}");
  return (
    <AuthShell title={t("request.title")} intro={t("request.intro")} points={[t("request.p1"), t("request.p2"), t("request.p3")]} brand={t("auth.brand")}>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-bold text-ink">{t("request.official")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{t("request.officialBody")}</p>
        </section>
        <section className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-bold text-ink">{t("request.chair")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {before}<a href={`mailto:${ADMIN_EMAIL}`} className="font-semibold text-flag-blue underline">{ADMIN_EMAIL}</a>{after}
          </p>
        </section>
      </div>
      <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">{t("request.already")} <Link href="/login" className="font-semibold text-flag-blue hover:underline">{t("nav.login")}</Link></p>
    </AuthShell>
  );
}
