import Link from "next/link";
import Avatar from "@/components/Avatar";
import { Empty, PageHeader } from "@/components/ui";
import { sql, type Row } from "@/lib/db";
import { ROLE_LABEL, type Role } from "@/lib/roles";

export const metadata = { title: "SK council" };

/** Public page: who the SK officials are, what they handle, and which projects they lead. */
export default async function CouncilPage() {
  const [officials, leads] = await Promise.all([
    sql<Row[]>`
      select id, name, role, committee, bio, extract(epoch from avatar_updated_at)::bigint::text as avatar_v
      from users where role <> 'kabataan'
      order by case role when 'chairperson' then 0 when 'secretary' then 1 when 'treasurer' then 2 else 3 end, name`,
    sql<Row[]>`
      select id, title, lead_id from projects
      where lead_id is not null and status in ('scheduled', 'ongoing', 'completed')
      order by start_date desc nulls last`,
  ]);
  const led = (id: number) => leads.filter((p) => p.lead_id === id);
  const [chair, ...rest] = officials;

  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="SK council" title="The people you elected">
        Your Sangguniang Kabataan officials, what each one handles, and the projects they are responsible for.
      </PageHeader>

      {!chair ? <Empty>The council has not been set up yet.</Empty> : (
        <>
          {chair.role === "chairperson" && (
            <article id={`official-${chair.id}`} className="card mb-6 flex scroll-mt-24 flex-col gap-6 sm:flex-row sm:items-center sm:p-8">
              <Avatar id={chair.id} name={chair.name} v={chair.avatar_v} size="xl" className="ring-4 ring-mist" />
              <div className="min-w-0">
                <p className="eyebrow">{ROLE_LABEL.chairperson}</p>
                <h2 className="mt-1 text-3xl font-bold leading-tight">{chair.name}</h2>
                {chair.committee && <p className="mt-1 text-sm font-medium text-slate-500">{chair.committee}</p>}
                {chair.bio && <p className="mt-3 max-w-2xl leading-relaxed text-slate-700">{chair.bio}</p>}
                <Projects items={led(chair.id)} />
              </div>
            </article>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(chair.role === "chairperson" ? rest : officials).map((o) => (
              <article key={o.id} id={`official-${o.id}`} className="card flex scroll-mt-24 flex-col">
                <div className="flex items-center gap-4">
                  <Avatar id={o.id} name={o.name} v={o.avatar_v} size="lg" className="!h-16 !w-16 text-lg ring-4 ring-mist" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight">{o.name}</h3>
                    <p className="text-sm text-slate-500">{ROLE_LABEL[o.role as Role]}</p>
                  </div>
                </div>
                {o.committee && <p className="mt-4 inline-flex w-fit rounded-full bg-mist px-3 py-1 text-xs font-semibold text-flag-blue ring-1 ring-inset ring-slate-200">{o.committee}</p>}
                {o.bio && <p className="mt-3 text-sm leading-relaxed text-slate-600">{o.bio}</p>}
                <Projects items={led(o.id)} />
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Projects({ items }: { items: Row[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Point person for</p>
      <ul className="mt-1.5 space-y-1 text-sm">
        {items.map((p) => (
          <li key={p.id}><Link href={`/projects/${p.id}`} className="font-semibold text-flag-blue hover:underline">{p.title}</Link></li>
        ))}
      </ul>
    </div>
  );
}
