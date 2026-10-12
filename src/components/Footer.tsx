import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-mist">
      <div className="container-x grid gap-8 py-10 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            Sinag means a ray of light. Everything the Sangguniang Kabataan decides, spends and does, in the open.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold text-ink">Explore</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            <li><Link href="/feed" className="hover:text-flag-blue">Public bulletin</Link></li>
            <li><Link href="/projects" className="hover:text-flag-blue">Projects</Link></li>
            <li><Link href="/calendar" className="hover:text-flag-blue">Calendar</Link></li>
            <li><Link href="/funds" className="hover:text-flag-blue">Fund transparency</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold text-ink">Take part</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            <li><Link href="/register" className="hover:text-flag-blue">Join as kabataan</Link></li>
            <li><Link href="/ideas/new" className="hover:text-flag-blue">Suggest a project</Link></li>
            <li><Link href="/login" className="hover:text-flag-blue">SK officials log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-x flex items-center py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pdyn-logo.png" alt="PDYN Technologies" width={36} height={36} className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-flag-blue via-flag-yellow to-flag-red" />
    </footer>
  );
}
