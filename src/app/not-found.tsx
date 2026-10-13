import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl font-bold">{t("404.title")}</h1>
      <p className="mt-3 text-slate-600">{t("404.lead")}</p>
      <Link href="/" className="btn-primary mt-6">{t("404.home")}</Link>
    </div>
  );
}
