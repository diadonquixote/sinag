import FeedItem from "@/components/FeedItem";
import { Empty, FilterChips, PageHeader } from "@/components/ui";
import { getFeed } from "@/lib/queries";
import { first } from "@/lib/format";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("feed.title") };
}

export default async function FeedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { t }] = await Promise.all([searchParams, getT()]);
  const type = first(sp.type) ?? "";
  const items = await getFeed(60, type || null);
  const tabs: [string, string][] = [
    ["", t("feed.everything")],
    ["minutes", t("feed.minutes")],
    ["report", t("feed.reports")],
    ["update", t("feed.updates")],
    ["project", t("feed.projects")],
  ];
  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader eyebrow={t("feed.title")} title={t("feed.heading")}>{t("feed.lead")}</PageHeader>
      <div className="mb-8">
        <FilterChips label={t("feed.show")} current={type} items={tabs} href={(v) => (v ? `/feed?type=${v}` : "/feed")} />
      </div>
      {items.length === 0 ? <Empty>{t("common.noneYet")}</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">{items.map((f) => <FeedItem key={`${f.type}-${f.id}`} item={f} />)}</div>
      )}
    </div>
  );
}
