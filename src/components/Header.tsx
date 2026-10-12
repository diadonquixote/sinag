import Link from "next/link";
import Logo from "./Logo";
import PdynLogo from "./PdynLogo";
import { getSession } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { logout } from "@/actions/auth";

const LINKS = [
  { href: "/feed", label: "Bulletin" },
  { href: "/projects", label: "Projects" },
  { href: "/calendar", label: "Calendar" },
  { href: "/ideas", label: "Ideas & Polls" },
  { href: "/funds", label: "Funds" },
];

export default async function Header() {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-blue to-flag-red" />
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <PdynLogo className="hidden sm:inline-flex" />
        </div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-mist hover:text-flag-blue">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-outline btn-sm">{ROLE_LABEL[user.role]} desk</Link>
              <form action={logout}><button className="btn-sm btn text-slate-600 hover:text-flag-red">Log out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline btn-sm">Log in</Link>
              <Link href="/register" className="btn-primary btn-sm">Join as kabataan</Link>
            </>
          )}
        </div>
        <details className="relative md:hidden">
          <summary className="btn-outline btn-sm cursor-pointer list-none">Menu</summary>
          <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-mist">{l.label}</Link>
            ))}
            <div className="my-1 border-t border-slate-100" />
            {user ? (
              <>
                <Link href={ROLE_HOME[user.role]} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-flag-blue hover:bg-mist">{ROLE_LABEL[user.role]} desk</Link>
                <form action={logout}><button className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-flag-red hover:bg-red-50">Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-mist">Log in</Link>
                <Link href="/register" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-flag-blue hover:bg-mist">Join as kabataan</Link>
              </>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
