import Link from "next/link";
import PdynLogo from "@/components/PdynLogo";
import { PageHeader } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { ORG_NAME } from "@/lib/org";
import { PDYN_EMAIL, siteStage, SOURCE_URL } from "@/lib/site";
import { LAW, Section } from "../privacy/notice";

export async function generateMetadata() {
  const { lang } = await getT();
  return { title: lang === "fil" ? "Tungkol sa site na ito" : "About this site" };
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="font-semibold text-flag-blue underline underline-offset-2" rel="noreferrer">{children}</a>
);

export default async function AboutPage() {
  const { lang } = await getT();
  const stage = siteStage();
  const fil = lang === "fil";

  const statusEn = stage === "demo"
    ? "This is a demonstration copy of Sinag. Everything on it is made up."
    : stage === "pilot"
      ? `This is a pilot. The ${ORG_NAME} is trying Sinag out before deciding whether to adopt it. Until then, the official records are the signed copies posted on the barangay bulletin board and in other public places, and the books kept for the Commission on Audit. This site is an extra way to see them, not a replacement.`
      : `The ${ORG_NAME} has adopted Sinag as one of the ways it discloses its work. The signed copies posted in the barangay and the books kept for the Commission on Audit remain the official records.`;
  const statusFil = stage === "demo"
    ? "Isang demonstrasyong kopya ito ng Sinag. Gawa-gawa lang ang lahat ng narito."
    : stage === "pilot"
      ? `Isa itong pilot. Sinusubukan pa ng ${ORG_NAME} ang Sinag bago magpasya kung gagamitin ito. Hangga’t wala pang pasya, ang opisyal na rekord ay ang mga pirmadong kopyang nakapaskil sa bulletin board ng barangay at sa iba pang pampublikong lugar, at ang mga aklat na itinatago para sa Commission on Audit. Dagdag na paraan lang ang site na ito para makita ang mga iyon, hindi kapalit.`
      : `Ginagamit na ng ${ORG_NAME} ang Sinag bilang isa sa mga paraan ng pagsisiwalat ng gawain nito. Ang mga pirmadong kopyang nakapaskil sa barangay at ang mga aklat para sa Commission on Audit pa rin ang opisyal na rekord.`;

  return (
    <div className="container-x py-10 sm:py-12">
      <div className="max-w-3xl">
        <PageHeader eyebrow={fil ? "Tungkol" : "About"} title={fil ? "Tungkol sa site na ito" : "About this site"}>
          {fil ? "Ano ang Sinag, sino ang nagpapatakbo nito, at gaano mo ito mapagkakatiwalaan." : "What Sinag is, who runs it, and how far you can rely on it."}
        </PageHeader>

        <div className="space-y-10">
          <Section id="what" title={fil ? "Ano ito" : "What this is"}>
            {fil ? (
              <p>Ang Sinag ay pampublikong talaan ng {ORG_NAME}: ang mga proyekto at iskedyul nito, ang perang pumapasok at lumalabas kasama ang mga resibo, ang katitikan ng mga pulong at ang mga ulat pampinansiyal. Hinihingi ng <A href={LAW.ra10742}>Republic Act 10742</A> na isiwalat ng bawat SK sa publiko ang mga transaksyon at dokumento nito (Seksyon 8(i)), at ipaskil ang mga ito sa barangay (Seksyon 14(c) at 15(e)). Inilalagay ng Sinag ang parehong mga rekord kung saan mababasa ng sinuman, anumang oras, sa telepono.</p>
            ) : (
              <p>Sinag is the public record of the {ORG_NAME}: its projects and schedule, the money in and out with the receipts, the minutes of its meetings and its financial reports. <A href={LAW.ra10742}>Republic Act 10742</A> asks every SK to disclose its transactions and documents to the public (Section 8(i)) and to post them in the barangay (Sections 14(c) and 15(e)). Sinag puts the same records where anyone can read them, at any time, on a phone.</p>
            )}
          </Section>

          <Section id="status" title={fil ? "Katayuan" : "Status"}>
            <p>{fil ? statusFil : statusEn}</p>
          </Section>

          <Section id="how" title={fil ? "Paano nakararating dito ang mga rekord" : "How records get here"}>
            {fil ? (
              <ul>
                <li>Mga halal na opisyal lang ang makakapag-log in, at sinusuri ng site admin ang bawat account sa listahan ng mga nahalal bago ito gumana.</li>
                <li>Isinusulat ng secretary at treasurer ang katitikan at mga ulat; inaaprubahan ito ng Chairperson bago makita ng publiko. Nakasaad sa bawat isa kung sino ang sumulat at sino ang nag-apruba.</li>
                <li>Hindi mabubura ang mga tala sa ledger. Ang mali ay pinapawalang-bisa at nananatiling nakikita, kasama ang dahilan.</li>
                <li>Bawat kabuuan ay sinusuma ng code mula sa mga tala, hanggang sentimo. Walang nagta-type ng kabuuan.</li>
                <li>Itinatala sa audit log ang bawat mahalagang gawain.</li>
              </ul>
            ) : (
              <ul>
                <li>Only elected officials can log in, and the site admin checks every account against the list of elected officials before it works.</li>
                <li>The secretary and treasurer write minutes and reports; the Chairperson approves them before the public sees them. Each one shows who wrote it and who approved it.</li>
                <li>Ledger entries cannot be deleted. A mistake is voided and stays visible, with the reason.</li>
                <li>Every total is added up by the code from the entries, to the centavo. Nobody types a total in.</li>
                <li>Every important action is written to an audit log.</li>
              </ul>
            )}
            <p>{fil ? "Ang hindi nito kayang patunayan: na kumpleto ang naitala ng mga opisyal. Kung may alam kang gastos o pasya na wala rito, itanong sa SK." : "What it cannot prove: that officials have recorded everything. If you know of spending or a decision that is missing here, ask the SK."}</p>
          </Section>

          <Section id="open" title={fil ? "Bukas ang code" : "Open source"}>
            {fil ? (
              <p>Malayang software ang Sinag sa ilalim ng <A href="https://www.gnu.org/licenses/agpl-3.0.html">GNU AGPL-3.0</A>. Mababasa ng sinuman ang code sa <A href={SOURCE_URL}>GitHub</A>, at sinumang magpatakbo ng binagong bersyon online ay kailangang ilathala rin ang kanilang mga pagbabago. Mahalaga ito sa isang tool para sa transparency: makikita mo mismo kung paano kinukuwenta ang mga numero.</p>
            ) : (
              <p>Sinag is free software under the <A href="https://www.gnu.org/licenses/agpl-3.0.html">GNU AGPL-3.0</A>. Anyone can read the code on <A href={SOURCE_URL}>GitHub</A>, and anyone who runs a modified version online must publish their changes too. That matters for a transparency tool: you can check for yourself how the numbers are worked out.</p>
            )}
          </Section>

          <section id="pdyn" aria-labelledby="pdyn-h" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PdynLogo />
            <h2 id="pdyn-h" className="mt-5 text-xl font-bold">{fil ? "Sino ang gumawa ng Sinag" : "Who built Sinag"}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-slate-700">
              {fil ? (
                <>
                  <p>Ang <b>PDYN Technologies</b> (Padayon Tech) ay isang technology startup sa Pilipinas, na pinamumunuan ng CEO nito na si <b>Kristina Diane Aviles</b>. Gumagawa ito ng software para sa mga problemang nakikita mismo nito sa komunidad.</p>
                  <p>Dati siyang secretary ng Sangguniang Kabataan. Doon niya nakita kung gaano kadaling hindi makita ng publiko ang perang pampubliko, at kung gaano kaunti ang paraan ng kabataan para makita ang pinagpapasyahan para sa kanila. Ginawa ang Sinag para doon.</p>
                  <p>Ang PDYN ang gumagawa at nagpapatakbo ng site. Ang konseho ang nagpapasya kung ano ang inilalathala, at ito ang may pananagutan sa nilalaman.</p>
                </>
              ) : (
                <>
                  <p><b>PDYN Technologies</b> (Padayon Tech) is a technology startup in the Philippines, led by its CEO, <b>Kristina Diane Aviles</b>. It builds software for problems it has seen first-hand in the community.</p>
                  <p>She served as secretary of a Sangguniang Kabataan. That is where she saw how easily public money goes unseen, and how few ways the youth have to see what is decided for them. Sinag was built for that.</p>
                  <p>PDYN builds and runs the site. The council decides what is published, and is responsible for what it says.</p>
                </>
              )}
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a href={`mailto:${PDYN_EMAIL}`} className="font-semibold text-flag-blue underline">{PDYN_EMAIL}</a>
                <a href="https://github.com/diadonquixote" className="font-semibold text-flag-blue underline" rel="noreferrer">GitHub</a>
              </p>
            </div>
          </section>

          <p className="text-sm text-slate-500">
            {fil ? "Tingnan din ang " : "See also the "}
            <Link href="/privacy" className="font-semibold text-flag-blue underline">{fil ? "abiso sa privacy" : "privacy notice"}</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
