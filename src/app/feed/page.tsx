import Link from "next/link";
import FeedItem from "@/components/FeedItem";
import { Empty, PageHeader } from "@/components/ui";
import { getFeed } from "@/lib/queries";
import { first } from "@/lib/format";

export const metadata = { title: "Public bulletin" };

const TABS = [
  ["", "Everything"],
  ["minutes", "Minutes"],
  ["report", "Financial reports"],
  ["update", "Project updates"],
  ["project", "New projects"],
];

export default async function FeedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const type = first(sp.type) ?? "";
  const items = await getFeed(60, type || null);
  return (
    <div className="container-x py-12">
      <PageHeader eyebrow="Public bulletin" title="Everything the SK posts">
        Minutes, financial reports, project news and updates. Nothing is posted until the Chairperson approves it.
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([v, label]) => (
          <Link key={v} href={v ? `/feed?type=${v}` : "/feed"} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${type === v ? "bg-flag-blue text-white ring-flag-blue" : "bg-white text-slate-700 ring-slate-300 hover:ring-flag-blue"}`}>
            {label}
          </Link>
        ))}
      </div>
      {items.length === 0 ? <Empty>Nothing here yet.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">{items.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
      )}
    </div>
  );
}
