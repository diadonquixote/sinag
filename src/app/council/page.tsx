import Link from "next/link";
import OrgChart from "@/components/OrgChart";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { Empty, PageHeader } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { ORG_NAME } from "@/lib/org";

export const metadata = { title: "SK council" };

/** Public page: the organization chart of the SK. Each person links to their profile. */
export default async function CouncilPage() {
  const [people, former] = await Promise.all([
    sql<Row[]>`
      select id, name, role, committee, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
      from users where role in ('chairperson','secretary','treasurer','kagawad') and status = 'active'
      order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`,
    sql<Row[]>`
      select id, name, role, term from users
      where role in ('chairperson','secretary','treasurer','kagawad') and status = 'former'
      order by term desc nulls last, case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`,
  ]);

  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="SK council" title="The people you elected">
        The {ORG_NAME} and who does what. Tap anyone in the chart to see their credentials, their contributions to the council, and the projects they lead.
      </PageHeader>
      {people.length === 0 ? <Empty>The council has not been set up yet.</Empty> : <OrgChart people={people} />}
      {former.length > 0 && (
        <section className="mt-12" aria-labelledby="former-h">
          <h2 id="former-h" className="text-xl font-bold">Former officials</h2>
          <p className="mt-1 text-sm text-slate-500">Their terms have ended. What they published while in office stays on the record.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {former.map((f) => (
              <li key={f.id}>
                <Link href={`/council/${f.id}`} className="card card-link block py-3">
                  <b className="font-semibold">{f.name}</b>
                  <span className="block text-xs text-slate-500">{ROLE_LABEL[f.role as Role]}{f.term ? ` · ${f.term}` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
