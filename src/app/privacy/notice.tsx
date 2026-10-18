/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * The privacy notice, in English and Filipino.
 *
 * Written for RA 10173 (Data Privacy Act) and its implementing rules, against what this code
 * actually stores. When the code changes what it stores or shows, change this too and raise
 * PRIVACY_VERSION in src/lib/privacy.ts. The data inventory behind it is in docs/PRIVACY.md.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export const LAW = {
  ra10742: "https://lawphil.net/statutes/repacts/ra2016/ra_10742_2016.html",
  ra10173: "https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html",
  irr: "https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/",
  circular202204: "https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf",
  childFaq: "https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf",
  npc: "https://privacy.gov.ph/",
};

export type NoticeProps = {
  org: string;
  contact: ReactNode;
  version: string;
};

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-semibold text-flag-blue underline underline-offset-2" rel="noreferrer">{children}</a>
);

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h2 id={`${id}-h`} className="text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-slate-700 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}

export function PrivacyEn({ org, contact, version }: NoticeProps) {
  return (
    <>
      <div className="rounded-2xl bg-mist p-5 ring-1 ring-inset ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold">The short version</h2>
        <ul className="mt-3 space-y-2 text-slate-700 [&_li]:ml-5 [&_li]:list-disc">
          <li>You can read everything here without an account. We do not track you, show ads, or sell anything.</li>
          <li>Only elected SK officials have accounts. Their name, position and what they do in office are public, because the law asks the SK to disclose its work.</li>
          <li>Officials’ email addresses, phone numbers and passwords are never shown to the public.</li>
          <li>Meeting minutes should not name private people. If you are named and do not want to be, tell us and it will be fixed.</li>
          <li>You have rights over your personal data. Section 7 says how to use them.</li>
        </ul>
      </div>

      <Section id="who" title="1. Who is responsible">
        <p>The <b>{org}</b> decides what is published here and is responsible for the personal data in it (in the words of the law, it is the personal information controller).</p>
        <p>Privacy questions and requests: {contact}</p>
        <p>The site is built and kept running by PDYN Technologies (<Link href="/about#pdyn" className="font-semibold text-flag-blue underline">about them</Link>). It is hosted by Vercel and its database is kept by Neon, on servers outside the Philippines. They process the data only to run the site.</p>
      </Section>

      <Section id="published" title="2. What this site makes public, and why">
        <p>Republic Act 10742, the SK Reform Act, asks every SK to adopt a policy of <A href={LAW.ra10742}>full public disclosure</A> of its transactions and documents (Section 8(i)). This site is one way of doing that. It publishes:</p>
        <ul>
          <li><b>About each elected official:</b> name, position, committee, photo, a short bio, term, the credentials and contributions they choose to list, and a record of what they did here (projects led, minutes and reports published, ledger entries recorded).</li>
          <li><b>The council’s records:</b> projects and their budgets, schedules and progress; approved minutes; approved financial reports; the ledger of money in and out; and receipt photos the treasurer has not hidden.</li>
        </ul>
        <p>Officials are shown this the first time they log in, and they agree to it. Information about a public official acting in office is not private in the way a citizen’s is, but officials still choose what goes on their profile beyond their name and position.</p>
      </Section>

      <Section id="private" title="3. What stays private">
        <ul>
          <li>Officials’ email addresses, phone numbers and passwords (passwords are stored only as a one-way scramble that nobody can read back).</li>
          <li>Receipts the treasurer marks hidden, for example ones that show a private person’s name or signature.</li>
          <li>Photos of handwritten meeting notes, which only the secretary and the Chairperson can see.</li>
          <li>Drafts that have not been approved.</li>
        </ul>
      </Section>

      <Section id="visitors" title="4. If you are just reading">
        <ul>
          <li>No account, no tracking, no advertising, and no analytics cookies.</li>
          <li>One small cookie remembers whether you chose English or Filipino. Officials who log in get one more, which keeps them logged in for up to seven days.</li>
          <li>Like every website, the hosting service records basic request details, such as internet addresses, for security and to keep the site working.</li>
        </ul>
      </Section>

      <Section id="officials" title="5. If you are an official">
        <ul>
          <li><b>Getting an account:</b> there is no sign-up. The site admin creates the Chairperson&apos;s account, and the Chairperson adds the rest of the council, with your name, email, position and a temporary password. You replace the password with your own the first time you log in.</li>
          <li><b>Failed log-ins:</b> to stop password guessing, the email address tried and the internet address it came from are kept for up to one day, and cleared as soon as you log in correctly.</li>
          <li><b>When your term ends:</b> you can no longer log in, and you are listed as a former official. What you published in office stays, as part of the public record.</li>
          <li><b>Leaving:</b> the site admin can erase your account. Your email, password, phone, photo and profile are deleted. Your name stays only on records you published while in office.</li>
        </ul>
      </Section>

      <Section id="minutes" title="6. People named in minutes and updates">
        <p>SK meetings sometimes discuss residents, for example someone who asked for help. The council’s rule for anything published here is that <b>private individuals are described by role, not by name</b> (“a resident of Purok 3 asked for assistance”), and that health, family or money matters about a private person stay out of the public version entirely.</p>
        <p>If you find yourself named and do not want to be, contact us (Section 1). The council will correct it.</p>
      </Section>

      <Section id="rights" title="7. Your rights">
        <p>Under the <A href={LAW.ra10173}>Data Privacy Act</A> (Sections 16 to 18) and <A href={LAW.irr}>its implementing rules</A> (Sections 34 to 36), you have the right to be informed, to see the data held about you, to object, to have mistakes corrected, to have data erased or blocked, to take your data with you, and to be compensated for damage caused by misuse.</p>
        <p>To use any of these, write to the contact in Section 1. If you are not satisfied with the answer, you can complain to the <A href={LAW.npc}>National Privacy Commission</A>.</p>
      </Section>

      <Section id="security" title="8. Keeping data safe">
        <ul>
          <li>The site only works over an encrypted connection (HTTPS).</li>
          <li>Each official only reaches the desk for their position, and every important action is written to an audit log.</li>
          <li>Ledger entries cannot be deleted; mistakes are voided in public, with the reason.</li>
          <li>If personal data is ever exposed, the council will notify the National Privacy Commission and the people affected within 72 hours of learning of it, as the implementing rules require (Section 38).</li>
        </ul>
      </Section>

      <Section id="registration" title="9. Registration with the National Privacy Commission">
        <p>This site is <b>not registered</b> with the National Privacy Commission. Under <A href={LAW.circular202204}>NPC Circular 2022-04</A>, registration is required for those employing 250 or more people, processing sensitive personal information of 1,000 or more individuals, or processing that is likely to put people’s rights at risk. This site holds account details for a council of about ten officials and collects nothing from visitors, so it does not appear to meet those thresholds.</p>
        <p>For local governments, the same circular has the municipality designate and register a Data Protection Officer, who may designate a compliance officer at the barangay level. The council will confirm this assessment with the municipal Data Protection Officer, and register if they advise it.</p>
      </Section>

      <Section id="children" title="10. Young readers">
        <p>Many kabataan who read this site are under 18. The site collects nothing from them: there is no sign-up, no form and no tracking for visitors. We follow the National Privacy Commission’s guidance on <A href={LAW.childFaq}>child-oriented transparency</A> by keeping this notice in plain language, with the short version at the top.</p>
      </Section>

      <p className="text-sm text-slate-500">Version {version}. When this notice changes in substance, officials are asked to read it again.</p>
    </>
  );
}

export function PrivacyFil({ org, contact, version }: NoticeProps) {
  return (
    <>
      <div className="rounded-2xl bg-mist p-5 ring-1 ring-inset ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold">Sa madaling salita</h2>
        <ul className="mt-3 space-y-2 text-slate-700 [&_li]:ml-5 [&_li]:list-disc">
          <li>Mababasa mo ang lahat dito nang walang account. Hindi ka namin sinusubaybayan, walang ads, at wala kaming ibinebenta.</li>
          <li>Mga halal na opisyal lang ng SK ang may account. Pampubliko ang kanilang pangalan, posisyon at ginagawa sa puwesto, dahil hinihingi ng batas na ipaalam ng SK ang gawain nito.</li>
          <li>Hindi kailanman ipinapakita sa publiko ang email, numero ng telepono at password ng mga opisyal.</li>
          <li>Hindi dapat pangalanan sa katitikan ang mga pribadong tao. Kung napangalanan ka at ayaw mo, sabihan kami at aayusin ito.</li>
          <li>May karapatan ka sa iyong personal na datos. Nasa Bahagi 7 kung paano ito gamitin.</li>
        </ul>
      </div>

      <Section id="who" title="1. Sino ang may pananagutan">
        <p>Ang <b>{org}</b> ang nagpapasya kung ano ang inilalathala rito at may pananagutan sa personal na datos na narito (sa wika ng batas, ito ang personal information controller).</p>
        <p>Mga tanong at kahilingan tungkol sa privacy: {contact}</p>
        <p>Ang PDYN Technologies ang gumawa at nagpapatakbo ng site (<Link href="/about#pdyn" className="font-semibold text-flag-blue underline">tungkol sa kanila</Link>). Naka-host ito sa Vercel at ang database ay nasa Neon, sa mga server sa labas ng Pilipinas. Ginagamit lang nila ang datos para patakbuhin ang site.</p>
      </Section>

      <Section id="published" title="2. Ano ang ginagawang pampubliko ng site na ito, at bakit">
        <p>Hinihingi ng Republic Act 10742, ang SK Reform Act, na magkaroon ang bawat SK ng patakaran ng <A href={LAW.ra10742}>ganap na pagsisiwalat sa publiko</A> ng mga transaksyon at dokumento nito (Seksyon 8(i)). Isang paraan nito ang site na ito. Inilalathala nito ang:</p>
        <ul>
          <li><b>Tungkol sa bawat halal na opisyal:</b> pangalan, posisyon, komite, larawan, maikling bio, termino, ang mga kredensyal at ambag na pinili nilang ilista, at talaan ng ginawa nila rito (mga proyektong pinamahalaan, katitikan at ulat na nailathala, mga tala sa ledger).</li>
          <li><b>Mga rekord ng konseho:</b> mga proyekto at ang badyet, iskedyul at pag-usad nila; inaprubahang katitikan; inaprubahang ulat pampinansiyal; ang ledger ng perang pumasok at lumabas; at mga larawan ng resibo na hindi itinago ng treasurer.</li>
        </ul>
        <p>Ipinapakita ito sa mga opisyal sa una nilang pag-log in, at pumapayag sila. Hindi pribado ang impormasyon tungkol sa isang opisyal na gumaganap ng tungkulin sa paraang pribado ang sa isang ordinaryong mamamayan, pero ang mga opisyal pa rin ang pumipili kung ano ang ilalagay sa profile nila bukod sa pangalan at posisyon.</p>
      </Section>

      <Section id="private" title="3. Ano ang nananatiling pribado">
        <ul>
          <li>Email, numero ng telepono at password ng mga opisyal (ang password ay nakatago lang bilang isang hindi na maibabalik na pagkakagulo na walang makababasa).</li>
          <li>Mga resibong itinago ng treasurer, halimbawa ang may pangalan o pirma ng isang pribadong tao.</li>
          <li>Mga larawan ng sulat-kamay na tala ng pulong, na ang secretary at Chairperson lang ang nakakakita.</li>
          <li>Mga draft na hindi pa naaprubahan.</li>
        </ul>
      </Section>

      <Section id="visitors" title="4. Kung nagbabasa ka lang">
        <ul>
          <li>Walang account, walang pagsubaybay, walang advertising, at walang analytics cookie.</li>
          <li>Isang maliit na cookie ang nag-aalala kung English o Filipino ang pinili mo. Ang mga opisyal na nagla-log in ay may isa pa, na nagpapanatiling naka-log in sila nang hanggang pitong araw.</li>
          <li>Gaya ng bawat website, nagtatala ang hosting service ng mga pangunahing detalye ng request, gaya ng internet address, para sa seguridad at para gumana ang site.</li>
        </ul>
      </Section>

      <Section id="officials" title="5. Kung opisyal ka">
        <ul>
          <li><b>Pagkakaroon ng account:</b> walang sign-up. Ang site admin ang gumagawa ng account ng Chairperson, at ang Chairperson ang nagdadagdag sa iba pang bahagi ng konseho, gamit ang iyong pangalan, email, posisyon at pansamantalang password. Papalitan mo ang password ng sarili mong password sa unang pag-log in mo.</li>
          <li><b>Nabigong pag-log in:</b> para mapigilan ang panghuhula ng password, itinatago nang hanggang isang araw ang email na sinubukan at ang internet address na pinanggalingan, at binubura agad kapag tama na ang pag-log in mo.</li>
          <li><b>Kapag tapos na ang termino mo:</b> hindi ka na makakapag-log in, at ililista ka bilang dating opisyal. Nananatili ang inilathala mo habang nasa puwesto, bilang bahagi ng pampublikong rekord.</li>
          <li><b>Pag-alis:</b> mabubura ng site admin ang iyong account. Buburahin ang iyong email, password, telepono, larawan at profile. Mananatili lang ang pangalan mo sa mga rekord na inilathala mo habang nasa puwesto.</li>
        </ul>
      </Section>

      <Section id="minutes" title="6. Mga taong nabanggit sa katitikan at update">
        <p>Minsan napag-uusapan sa pulong ng SK ang mga residente, halimbawa ang taong humingi ng tulong. Ang patakaran ng konseho para sa anumang inilalathala rito ay <b>inilalarawan ang mga pribadong tao ayon sa papel nila, hindi sa pangalan</b> (“isang residente ng Purok 3 ang humingi ng tulong”), at hindi isinasama sa pampublikong bersyon ang anumang tungkol sa kalusugan, pamilya o pera ng isang pribadong tao.</p>
        <p>Kung napangalanan ka at ayaw mo, makipag-ugnayan sa amin (Bahagi 1). Itatama ito ng konseho.</p>
      </Section>

      <Section id="rights" title="7. Ang iyong mga karapatan">
        <p>Sa ilalim ng <A href={LAW.ra10173}>Data Privacy Act</A> (Seksyon 16 hanggang 18) at ng <A href={LAW.irr}>mga patakaran nito</A> (Seksyon 34 hanggang 36), may karapatan kang malaman, makita ang datos tungkol sa iyo, tumutol, ipaitama ang mali, ipabura o ipaharang ang datos, kunin ang iyong datos, at mabayaran sa pinsalang dulot ng maling paggamit.</p>
        <p>Para gamitin ang alinman dito, sumulat sa contact sa Bahagi 1. Kung hindi ka kuntento sa sagot, maaari kang magreklamo sa <A href={LAW.npc}>National Privacy Commission</A>.</p>
      </Section>

      <Section id="security" title="8. Pag-iingat sa datos">
        <ul>
          <li>Gumagana lang ang site sa naka-encrypt na koneksyon (HTTPS).</li>
          <li>Ang desk lang para sa posisyon nila ang naaabot ng bawat opisyal, at itinatala sa audit log ang bawat mahalagang gawain.</li>
          <li>Hindi mabubura ang mga tala sa ledger; ang mali ay pinapawalang-bisa sa harap ng publiko, kasama ang dahilan.</li>
          <li>Kung sakaling malantad ang personal na datos, aabisuhan ng konseho ang National Privacy Commission at ang mga apektado sa loob ng 72 oras mula nang malaman ito, ayon sa hinihingi ng mga patakaran (Seksyon 38).</li>
        </ul>
      </Section>

      <Section id="registration" title="9. Pagpaparehistro sa National Privacy Commission">
        <p><b>Hindi nakarehistro</b> ang site na ito sa National Privacy Commission. Sa ilalim ng <A href={LAW.circular202204}>NPC Circular 2022-04</A>, kailangang magparehistro ang may 250 o higit pang empleyado, ang nagpoproseso ng sensitibong personal na impormasyon ng 1,000 o higit pang tao, o ang pagpoprosesong malamang na maglagay sa panganib sa karapatan ng mga tao. May hawak lang ang site na ito na detalye ng account ng isang konseho na may humigit-kumulang sampung opisyal at walang kinukuha sa mga bisita, kaya mukhang hindi ito umaabot sa mga hangganang iyon.</p>
        <p>Para sa mga lokal na pamahalaan, ipinag-uutos ng parehong circular na ang munisipyo ang magtalaga at magparehistro ng Data Protection Officer, na maaaring magtalaga ng compliance officer sa antas ng barangay. Kukumpirmahin ng konseho ang pagtatasang ito sa Data Protection Officer ng munisipyo, at magpaparehistro kung iyon ang ipapayo.</p>
      </Section>

      <Section id="children" title="10. Mga batang mambabasa">
        <p>Marami sa mga kabataang nagbabasa ng site na ito ay wala pang 18 taong gulang. Wala kaming kinukuha mula sa kanila: walang sign-up, walang form at walang pagsubaybay sa mga bisita. Sinusunod namin ang gabay ng National Privacy Commission sa <A href={LAW.childFaq}>child-oriented transparency</A> sa pamamagitan ng simpleng wika sa abisong ito, at ng maikling bersyon sa itaas.</p>
      </Section>

      <p className="text-sm text-slate-500">Bersyon {version}. Kapag nagbago nang malaki ang abisong ito, hihilingin sa mga opisyal na basahin itong muli.</p>
    </>
  );
}
