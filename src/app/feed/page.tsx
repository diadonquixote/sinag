import FeedItem from "@/components/FeedItem";
import { Empty, FilterChips, PageHeader } from "@/components/ui";
import { getFeed } from "@/lib/queries";
import { first } from "@/lib/format";

export const metadata = { title: "Public bulletin" };

const TABS: [string, string][] = [
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
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow="Public bulletin" title="Everything the SK posts">
        Minutes, financial reports, project news and updates. Nothing is posted until the Chairperson approves it.
      </PageHeader>
      <div className="mb-8">
        <FilterChips label="Show" current={type} items={TABS} href={(v) => (v ? `/feed?type=${v}` : "/feed")} />
      </div>
      {items.length === 0 ? <Empty>Nothing here yet.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">{items.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
      )}
    </div>
  );
}
