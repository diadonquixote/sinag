import Link from "next/link";
import Logo from "./Logo";
import PdynLogo from "./PdynLogo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-mist">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            Sinag means a ray of light. Everything the Sangguniang Kabataan decides, spends and does, in the open.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">Explore</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/feed" className="hover:text-flag-blue">Public bulletin</Link></li>
            <li><Link href="/projects" className="hover:text-flag-blue">Projects</Link></li>
            <li><Link href="/calendar" className="hover:text-flag-blue">Calendar</Link></li>
            <li><Link href="/funds" className="hover:text-flag-blue">Fund transparency</Link></li>
            <li><Link href="/council" className="hover:text-flag-blue">SK council</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">Take part</p>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/register" className="hover:text-flag-blue">Join as kabataan</Link></li>
            <li><Link href="/ideas/new" className="hover:text-flag-blue">Suggest a project</Link></li>
            <li><Link href="/login" className="hover:text-flag-blue">SK officials log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-5 text-sm text-slate-600 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Sinag. Everything in the open.</p>
          <PdynLogo />
          <a href="mailto:pdyntechnology@gmail.com" className="hover:text-flag-blue">pdyntechnology@gmail.com</a>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red" />
    </footer>
  );
}
