import { PageHeader } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { ORG_NAME } from "@/lib/org";
import { PENDING_REQUEST_DAYS, PRIVACY_VERSION, privacyContact } from "@/lib/privacy";
import { PDYN_EMAIL } from "@/lib/site";
import { PrivacyEn, PrivacyFil } from "./notice";

export async function generateMetadata() {
  const { lang } = await getT();
  return { title: lang === "fil" ? "Abiso sa privacy" : "Privacy notice" };
}

export default async function PrivacyPage() {
  const { lang } = await getT();
  const c = privacyContact();
  const fil = lang === "fil";
  const contact = c.email ? (
    <><b>{c.name ?? (fil ? "Ang privacy officer ng konseho" : "The council’s privacy officer")}</b>, <a href={`mailto:${c.email}`} className="font-semibold text-flag-blue underline">{c.email}</a>.</>
  ) : fil ? (
    <>Hindi pa napapangalanan ng konseho ang privacy officer nito. Habang wala pa, lumapit nang direkta sa SK, o sumulat sa nagpapatakbo ng site sa <a href={`mailto:${PDYN_EMAIL}`} className="font-semibold text-flag-blue underline">{PDYN_EMAIL}</a>, na magpapasa nito sa konseho.</>
  ) : (
    <>The council has not yet named its privacy officer. Until it does, contact the SK directly, or write to the people who run this site at <a href={`mailto:${PDYN_EMAIL}`} className="font-semibold text-flag-blue underline">{PDYN_EMAIL}</a>, who will pass it to the council.</>
  );
  const props = { org: ORG_NAME, contact, version: PRIVACY_VERSION, pendingDays: PENDING_REQUEST_DAYS };
  return (
    <div className="container-x py-10 sm:py-12">
      <div className="max-w-3xl">
        <PageHeader eyebrow={fil ? "Privacy" : "Privacy"} title={fil ? "Abiso sa privacy" : "Privacy notice"}>
          {fil
            ? `Kung anong personal na datos ang hawak at inilalathala ng site na ito ng ${ORG_NAME}, bakit, at ano ang mga karapatan mo.`
            : `What personal data this site of the ${ORG_NAME} holds and publishes, why, and what your rights are.`}
        </PageHeader>
        <div className="space-y-10">{fil ? <PrivacyFil {...props} /> : <PrivacyEn {...props} />}</div>
      </div>
    </div>
  );
}
