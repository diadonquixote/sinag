# Privacy plan

What personal data Sinag v1 holds, why, who can see it, how long it is kept, and what to do if
it is ever exposed. This is the working document behind the public
[privacy notice](../src/app/privacy/notice.tsx) (shown at `/privacy`). Keep the two in step:
when the code changes what it stores or shows, update both and raise `PRIVACY_VERSION` in
`src/lib/privacy.ts`.

It is written against the code, not assumed. It is not legal advice; the council should confirm
it with the municipal Data Protection Officer.

## Who is who

| Role under RA 10173 | Who |
| --- | --- |
| Personal information controller | The SK council whose site it is. It decides what is published and is accountable for it |
| Data Protection Officer / Compliance Officer for Privacy | Named by the council, or the barangay-level officer the municipality designates ([NPC Circular 2022-04](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf), Section 10). Shown on `/privacy` through `PRIVACY_CONTACT_NAME` and `PRIVACY_CONTACT_EMAIL` |
| Personal information processors | PDYN Technologies (builds and runs the site), Vercel (hosting), Neon (database). Servers are outside the Philippines |

## What is held

| Data | About | Where | Who can see it | Kept until | Why |
| --- | --- | --- | --- | --- | --- |
| Name, position, committee, term | Officials | `users` | Public | Erased on request; the name stays on records published in office | RA 10742 §8(i) full public disclosure; officials agree the first time they log in |
| Photo, bio, credentials, contributions, purok, skills | Officials | `users` | Public (photo and profile), only if the official fills them in | The official deletes them, or the account is erased | The official's own choice to publish |
| Email, phone | Officials | `users` | The official; the site admin (email); other officials (phone) | Account erased | Logging in; contact within the council |
| Password | Officials | `users`, as a bcrypt hash only | Nobody; it cannot be read back | Account erased | Logging in |
| Privacy acceptance (date, version) | Officials | `users` | Site admin | Account erased | Proof of consent |
| Failed log-in attempts: email tried, internet address | Anyone who mistypes | `login_attempts` | Nobody through the site | Up to 1 day; cleared on a correct log-in | Stopping password guessing |
| Audit log: who did what, when | Officials | `audit_log` | Chairperson (recent activity) | Kept as part of the record | Accountability |
| Minutes, reports, project updates | Whoever is named in them | `minutes`, `reports`, `project_updates` | Public once approved | Kept as part of the public record | RA 10742 disclosure |
| Ledger and receipt photos | Payees, vendors on receipts | `transactions`, `transaction_receipts` | Public unless the treasurer hides the receipt | Kept as part of the public record | RA 10742 disclosure; COA |
| Photos of handwritten notes | Whoever is in the notes | `minutes_photos` | Secretary who wrote them, Chairperson | Kept with the minutes | The original record |
| Language choice | Visitors | A cookie in their browser | Nobody else | One year, or until they clear it | Showing the chosen language |
| Login session | Officials | A cookie in their browser | Nobody else | 7 days, or until revoked | Staying logged in |
| Request logs | Visitors | Vercel | Whoever runs the hosting account | Vercel's retention | Security and running the site |

**Collected from visitors: nothing** beyond the language cookie and the hosting service's
request logs. No analytics, no ads, no tracking. **Collected from anyone under 18: nothing.**
Photos lose their EXIF metadata (including GPS location) and are squeezed to a small size before they are stored, and each photo is then **encrypted** (AES-256-GCM, a different random value for every photo) with a key that is kept outside the database. Someone who obtains a copy of the database, such as a leaked connection string or a stolen backup, sees scrambled bytes, not receipts, handwritten notes or faces. Photos are decrypted only for the moment they are served to someone allowed to see them. Everything travels over HTTPS.

## The rule for what gets published

The real risk in v1 is not the accounts. It is people named in what the council publishes. The
council's rule, agreed and followed by the secretary and treasurer:

- Officials are named; they are acting in their public role.
- A private individual is described by role, not name: "a resident of Purok 3 requested
  assistance".
- Health, family circumstances, assistance received and anything financial about a named
  private person stay out of the public version entirely.
- Receipts that show a private person's name, signature or TIN are marked hidden.
- If a name genuinely must be published, ask that person first.
- The council's own internal copy can hold more detail than the public post.

## Rights requests

People have the rights in RA 10173 §§16–18 and the IRR §§34–36: to be informed, to access, to
object, to correction, to erasure or blocking, to data portability, and to damages. When a
request arrives at the privacy contact:

1. Confirm who is asking (an official: from their account email; anyone else: by reply).
2. Answer within a reasonable time, and keep a note of the request and the answer.
3. For a person named in published minutes: edit the published minutes (the Chairperson can
   re-publish), and say what was changed.
4. For an official leaving: the site admin uses **Remove** on the Accounts page.
5. If refused, say why and mention the right to complain to the
   [National Privacy Commission](https://privacy.gov.ph/).

## If personal data is exposed

A breach is any unauthorised access to, disclosure of, or loss of personal data: a leaked
database password, a published receipt showing someone's details, a lost device that was logged
in, a wrong person getting an account.

1. **Contain it at once.** Reset the leaked password (Neon role, or `AUTH_SECRET` in Vercel, then
   redeploy). Turn off the account involved. Hide the receipt or unpublish the document. Roll back
   the deployment if needed.
2. **Tell the privacy contact and the Chairperson the same day.** Write down what happened, when
   it was found, what data and whose, and what was done.
3. **Within 72 hours of learning of it**, if the breach involves sensitive personal information
   or information that could enable identity fraud, and is likely to cause real harm, the council
   notifies the National Privacy Commission and the people affected
   ([IRR Section 38](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)).
   When in doubt, notify.
4. **Afterwards**, fix the cause and record the lesson here.

## Registration with the National Privacy Commission

Assessed 14 October 2026 against
[NPC Circular 2022-04](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf),
Section 5. Registration is mandatory for a controller or processor that:

| Criterion | Sinag v1 |
| --- | --- |
| employs 250 or more people | No. A council of about ten officials |
| processes sensitive personal information of 1,000 or more individuals | No. Officials' credentials can include education (sensitive under RA 10173 §3(l)), for about ten people |
| processes data likely to pose a risk to data subjects' rights and freedoms | Judged unlikely: public officials' public-role information, and no data from visitors or minors |
| uses automated decision-making or profiling | No |

Conclusion: registration does not appear to be required for v1. For local government units,
Section 10 has the municipality designate and register a DPO, who may designate a Compliance
Officer for Privacy at the barangay. **The council should confirm this assessment with the
municipal DPO**, and re-assess before v2, which would collect data from young people.

## Open items

- [ ] The council names its privacy contact (by resolution), and it is set in Vercel.
- [ ] The council confirms the registration assessment with the municipal DPO.
- [ ] The council agrees the publishing rule above, in writing.
- [ ] The hosting accounts move to a council-owned email, or their holders are written down.
- [ ] Before v2 (youth participation): a privacy impact assessment covering minors, consent
      records, and data export and erasure for kabataan accounts.

## Sources

[RA 10173](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html) ·
[IRR of RA 10173](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/) ·
[NPC Circular 2022-04](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf) ·
[NPC child-oriented transparency FAQs](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf) ·
[RA 10742](https://lawphil.net/statutes/repacts/ra2016/ra_10742_2016.html)
