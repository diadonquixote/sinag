import Link from "next/link";
import Logo from "./Logo";
import PdynLogo from "./PdynLogo";
import { ORG_NAME } from "@/lib/org";
import { getT } from "@/lib/i18n";
import { PDYN_EMAIL, SOURCE_URL } from "@/lib/site";

export default async function Footer() {
  const { t } = await getT();
  const link = "hover:text-flag-blue";
  return (
    <footer className="mt-12 border-t border-slate-200 bg-mist">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-600">{t("footer.tagline", { org: ORG_NAME })}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">{t("footer.explore")}</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/feed" className={link}>{t("footer.bulletin")}</Link></li>
            <li><Link href="/projects" className={link}>{t("footer.projects")}</Link></li>
            <li><Link href="/calendar" className={link}>{t("footer.calendar")}</Link></li>
            <li><Link href="/funds" className={link}>{t("footer.funds")}</Link></li>
            <li><Link href="/council" className={link}>{t("footer.council")}</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">{t("footer.aboutHead")}</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/about" className={link}>{t("footer.about")}</Link></li>
            <li><Link href="/privacy" className={link}>{t("footer.privacy")}</Link></li>
            <li><a href={SOURCE_URL} className={link} rel="noreferrer">{t("footer.source")}</a></li>
            <li><Link href="/about#pdyn" className={link}>{t("footer.pdyn")}</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">{t("footer.officials")}</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/login" className={link}>{t("footer.login")}</Link></li>
            <li><Link href="/request-access" className={link}>{t("footer.request")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-5 text-center text-sm text-slate-600 md:flex-row md:text-left">
          <p>&copy; {new Date().getFullYear()} Sinag. {t("footer.rights")}</p>
          <Link href="/about#pdyn" aria-label={t("footer.pdynLink")} title={t("footer.pdynLink")} className="rounded-lg transition hover:opacity-80">
            <PdynLogo />
          </Link>
          <a href={`mailto:${PDYN_EMAIL}`} className={link}>{PDYN_EMAIL}</a>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red" />
    </footer>
  );
}
