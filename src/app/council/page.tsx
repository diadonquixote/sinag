import OrgChart from "@/components/OrgChart";
import { Empty, PageHeader } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { ORG_NAME } from "@/lib/org";

export const metadata = { title: "SK council" };

/** Public page: the organization chart of the SK. Each person links to their profile. */
export default async function CouncilPage() {
  const people = await sql<Row[]>`
    select id, name, role, committee, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users where role in ('chairperson','secretary','treasurer','kagawad') and status = 'active'
    order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`;

  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="SK council" title="The people you elected">
        The {ORG_NAME} and who does what. Tap anyone in the chart to see their credentials, their contributions to the council, and the projects they lead.
      </PageHeader>
      {people.length === 0 ? <Empty>The council has not been set up yet.</Empty> : <OrgChart people={people} />}
    </div>
  );
}
