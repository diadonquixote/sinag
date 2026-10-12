import Link from "next/link";
import Logo from "./Logo";
import PdynLogo from "./PdynLogo";
import MobileMenu from "./MobileMenu";
import { NavLinks, type NavItem } from "./NavLinks";
import { currentUser } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { logout } from "@/actions/auth";
import Avatar from "./Avatar";

const LINKS: NavItem[] = [
  { href: "/feed", label: "Bulletin" },
  { href: "/projects", label: "Projects" },
  { href: "/calendar", label: "Calendar" },
  { href: "/ideas", label: "Ideas & Polls" },
  { href: "/funds", label: "Funds" },
  { href: "/council", label: "Council" },
];

export default async function Header() {
  // Read from the database (not just the login cookie) so a new name or photo shows right away.
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red" />
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <PdynLogo className="hidden sm:inline-flex" />
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          <NavLinks links={LINKS} variant="bar" />
        </nav>

        <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href={ROLE_HOME[user.role]} className="group flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3.5 text-sm font-semibold text-ink transition hover:border-flag-blue hover:text-flag-blue">
                <Avatar id={user.id} name={user.name} v={user.avatarV} size="sm" />
                My desk
              </Link>
              <form action={logout}>
                <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-flag-red">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-flag-blue">Log in</Link>
              <Link href="/register" className="btn-primary btn-sm">Join as kabataan</Link>
            </>
          )}
        </div>

        {/* Below the large breakpoint the page links move into the menu; account buttons stay visible from md up. */}
        <div className="flex items-center gap-2 lg:hidden">
          <MobileMenu>
            <nav aria-label="Main" className="flex flex-col gap-0.5">
              <NavLinks links={LINKS} variant="menu" />
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3 md:hidden">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href={ROLE_HOME[user.role]} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mist">
                    <Avatar id={user.id} name={user.name} v={user.avatarV} size="md" />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{user.name}</span>
                      <span className="block text-xs text-slate-500">{ROLE_LABEL[user.role]} · open my desk</span>
                    </span>
                  </Link>
                  <form action={logout}>
                    <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-flag-red hover:bg-red-50">Log out</button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="btn-outline">Log in</Link>
                  <Link href="/register" className="btn-primary">Join as kabataan</Link>
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
