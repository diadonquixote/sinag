import Link from "next/link";
import { getT } from "@/lib/i18n";
import { ORG_NAME } from "@/lib/org";
import { siteStage } from "@/lib/site";

/** Tells every visitor, on every page, what kind of site this is. Hidden once the council adopts it. */
export default async function StageBanner() {
  const stage = siteStage();
  if (stage === "live") return null;
  const { t } = await getT();
  return (
    <div role="note" className={stage === "demo" ? "bg-flag-red text-white" : "bg-ink text-white"}>
      <p className="container-x py-2 text-center text-xs leading-relaxed sm:text-sm">
        <span>{stage === "demo" ? t("stage.demo") : t("stage.pilot", { org: ORG_NAME })}</span>{" "}
        <Link href="/about" className="font-semibold underline underline-offset-2 hover:text-flag-yellow">{t("stage.more")}</Link>
      </p>
    </div>
  );
}
