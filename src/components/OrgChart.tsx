import Link from "next/link";
import Avatar from "./Avatar";
import type { Row } from "@/lib/db";
import { ROLE_LABEL, type Role } from "@/lib/roles";

/**
 * The SK organization chart: Chairperson on top, the appointed Secretary and Treasurer,
 * then the Kagawad. Every person links to their public profile.
 * Wide screens get a connected tree; phones get the same groups stacked.
 */
export default function OrgChart({ people }: { people: Row[] }) {
  const chair = people.filter((p) => p.role === "chairperson");
  const officers = people.filter((p) => p.role === "secretary" || p.role === "treasurer");
  const members = people.filter((p) => p.role === "kagawad");

  return (
    <>
      {/* ---------------------------------------------------------------- wide screens: connected tree */}
      <div className="relative hidden overflow-x-auto rounded-3xl border border-slate-200 bg-gradient-to-b from-mist/70 to-white px-6 py-10 md:block">
        <div className="mx-auto flex min-w-max flex-col items-center">
          <Tier people={chair} size="lg" />
          {(officers.length > 0 || members.length > 0) && <Stem />}
          {officers.length > 0 && (
            <>
              <TierLabel>Appointed officers</TierLabel>
              <Stem short />
              <Tier people={officers} size="md" trunk={members.length > 0} />
              {members.length > 0 && <Stem />}
            </>
          )}
          {members.length > 0 && (
            <>
              <TierLabel>SK Kagawad</TierLabel>
              <Stem short />
              <Tier people={members} size={members.length > 5 ? "sm" : "md"} />
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- phones: stacked groups */}
      <div className="space-y-6 md:hidden">
        {[
          ["Chairperson", chair],
          ["Appointed officers", officers],
          ["SK Kagawad", members],
        ].map(([label, group]) =>
          (group as Row[]).length === 0 ? null : (
            <section key={label as string}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label as string}</p>
              <ul className="space-y-2 border-l-2 border-flag-blue/20 pl-4">
                {(group as Row[]).map((p) => (
                  <li key={p.id}>
                    <Link href={`/council/${p.id}`} className="card card-link flex items-center gap-3 py-3">
                      <Avatar id={p.id} name={p.name} v={p.avatar_v} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{p.name}</span>
                        <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[p.role as Role]}{p.committee ? ` · ${p.committee}` : ""}</span>
                      </span>
                      <span aria-hidden="true" className="ml-auto text-slate-300">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </>
  );
}

function Stem({ short = false }: { short?: boolean }) {
  return <span aria-hidden="true" className={`block w-px bg-slate-300 ${short ? "h-3" : "h-8"}`} />;
}

function TierLabel({ children }: { children: React.ReactNode }) {
  return <p className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-inset ring-slate-200">{children}</p>;
}

/** One row of the chart. Each person hangs from a shared horizontal line. */
function Tier({ people, size, trunk = false }: { people: Row[]; size: "lg" | "md" | "sm"; trunk?: boolean }) {
  return (
    <ul className="relative flex justify-center">
      {/* the Kagawad report to the Chairperson, so the main line runs straight past the appointed officers */}
      {trunk && <span aria-hidden="true" className="absolute bottom-0 left-1/2 top-0 w-px bg-slate-300" />}
      {people.map((p, i) => (
        <li key={p.id} className="relative flex flex-col items-center px-2 pt-6">
          {/* connector: half lines to the neighbours, and a drop to this card */}
          {people.length > 1 && (
            <>
              <span aria-hidden="true" className={`absolute left-0 top-0 h-px w-1/2 bg-slate-300 ${i === 0 ? "invisible" : ""}`} />
              <span aria-hidden="true" className={`absolute right-0 top-0 h-px w-1/2 bg-slate-300 ${i === people.length - 1 ? "invisible" : ""}`} />
            </>
          )}
          <span aria-hidden="true" className={`absolute left-1/2 top-0 h-6 w-px bg-slate-300 ${people.length > 1 ? "" : "invisible"}`} />
          <Node p={p} size={size} />
        </li>
      ))}
    </ul>
  );
}

function Node({ p, size }: { p: Row; size: "lg" | "md" | "sm" }) {
  const w = size === "lg" ? "w-60" : size === "md" ? "w-48" : "w-40";
  const pic = size === "lg" ? "!h-24 !w-24 text-2xl" : size === "md" ? "!h-16 !w-16 text-lg" : "!h-14 !w-14 text-base";
  return (
    <Link
      href={`/council/${p.id}`}
      title={`View ${p.name}'s profile`}
      className={`group relative z-[1] flex ${w} flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-flag-blue/40 hover:shadow-lg focus-visible:-translate-y-1 ${size === "lg" ? "ring-4 ring-flag-yellow/30" : ""}`}
    >
      <Avatar id={p.id} name={p.name} v={p.avatar_v} size="md" className={`${pic} ring-4 ring-mist transition group-hover:ring-flag-blue/20`} />
      <span className="mt-3 block font-display text-base font-bold leading-tight text-ink group-hover:text-flag-blue">{p.name}</span>
      <span className="mt-0.5 block text-xs font-semibold text-flag-red">{ROLE_LABEL[p.role as Role]}</span>
      {p.committee && <span className="mt-1 block text-[11px] leading-snug text-slate-500">{p.committee}</span>}
    </Link>
  );
}
