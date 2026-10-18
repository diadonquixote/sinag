/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import Link from "next/link";
import { Suspense } from "react";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import LanguageSwitch from "./LanguageSwitch";
import { NavLinks, type NavItem } from "./NavLinks";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { ORG_NAME } from "@/lib/org";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { logout } from "@/actions/auth";
import Avatar from "./Avatar";

export default async function Header() {
  // Read from the database (not just the login cookie) so a new name or photo shows right away.
  const [user, { t, lang }] = await Promise.all([currentUser(), getT()]);
  const links: NavItem[] = [
    { href: "/feed", label: t("nav.bulletin") },
    { href: "/projects", label: t("nav.projects") },
    { href: "/calendar", label: t("nav.calendar") },
    { href: "/funds", label: t("nav.funds") },
    { href: "/council", label: t("nav.council") },
  ];
  const other = lang === "fil" ? "en" : "fil";
  const switcher = (className = "") => (
    <Suspense fallback={null}>
      <LanguageSwitch to={other} label={t("lang.other")} title={t("lang.switch")} className={className} />
    </Suspense>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red" />
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          {/* Whose records these are, always in view. */}
          <span className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <span className="hidden truncate text-sm font-semibold text-slate-600 sm:block">{ORG_NAME}</span>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("nav.main")}>
          <NavLinks links={links} variant="bar" />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {switcher()}
            {user ? (
              <>
                <Link href={ROLE_HOME[user.role]} className="group flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3.5 text-sm font-semibold text-ink transition hover:border-flag-blue hover:text-flag-blue">
                  <Avatar id={user.id} name={user.name} v={user.avatarV} size="sm" />
                  {t("nav.myDesk")}
                </Link>
                <form action={logout}>
                  <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-flag-red">{t("nav.logout")}</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-flag-blue">{t("nav.login")}</Link>
            )}
          </div>

          {/* Below the large breakpoint the page links move into the menu; account buttons stay visible from md up. */}
          <div className="flex items-center gap-2 lg:hidden">
            <MobileMenu openLabel={t("nav.menuOpen")} closeLabel={t("nav.menuClose")}>
              <nav aria-label={t("nav.main")} className="flex flex-col gap-0.5">
                <NavLinks links={links} variant="menu" />
              </nav>
              <div className="mt-3 border-t border-slate-100 pt-3 md:hidden">
                <div className="mb-3">{switcher()}</div>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link href={ROLE_HOME[user.role]} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mist">
                      <Avatar id={user.id} name={user.name} v={user.avatarV} size="md" />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{user.name}</span>
                        <span className="block text-xs text-slate-500">{ROLE_LABEL[user.role]} · {t("nav.openDesk")}</span>
                      </span>
                    </Link>
                    <form action={logout}>
                      <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-flag-red hover:bg-red-50">{t("nav.logout")}</button>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" className="btn-outline">{t("nav.login")}</Link>
                  </div>
                )}
              </div>
            </MobileMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
