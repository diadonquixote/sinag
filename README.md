# Sinag

[![CI](https://github.com/diadonquixote/sinag/actions/workflows/ci.yml/badge.svg?branch=v1)](https://github.com/diadonquixote/sinag/actions/workflows/ci.yml)
[![License: All rights reserved](https://img.shields.io/badge/license-All%20rights%20reserved-red.svg)](LICENSE)

**Sinag** means *a ray of light*. It is a public record for Sangguniang Kabataan (SK) councils
in the Philippines: the council records what it decides, schedules and spends, and anyone can
read it, in English or Filipino, with no account.

**Live pilot:** [sinag-v1.vercel.app](https://sinag-v1.vercel.app), with the SK ng Gumaca.
The signed paper copies posted in the barangay remain the official records during the pilot.

---

## Why I built this

I served as secretary of our Sangguniang Kabataan. That is where I learned how easily public
money becomes invisible.

Not through anything dramatic. Through minutes that stay in a notebook. Through a financial
report read aloud once at an assembly and never posted anywhere. Through a budget that exists,
is spent, and is never seen by a single one of the young people it belongs to. By the time
anyone thinks to ask where the funds went, the records are scattered, the term is ending, and
the honest answer is that nobody really knows.

The law is not the problem. [RA 10742](https://lawphil.net/statutes/repacts/ra2016/ra_10742_2016.html)
already requires the SK to practise full public disclosure of its transactions and documents
(Section 8(i)) and to post them where people can see them (Sections 14(c) and 15(e)). The
problem is that there is nowhere for that disclosure to go, and no habit of putting it there.
A bulletin board in one barangay hall, read by whoever happens to walk past.

So Sinag is not a record-keeping tool for councils. It is a record *for the public*, that the
council happens to keep. Every peso in the ledger is attached to a receipt. Nothing is published
without the Chairperson approving it, and nothing approved can quietly disappear afterwards:
entries are voided on the record, never deleted. Every number on the site is computed from the
ledger in code, so no one can type in a total that the entries do not support.

I built it because I wanted it to exist when I was the one keeping those records.

## Where this is going

It starts in one barangay, which is mine. That is deliberate: a transparency tool that has never
survived contact with a real council, a real budget and a real audit is not worth much.

But nothing in the idea is local. Every youth council, student government, cooperative and small
public body has the same shape of problem: a small budget, a few officers, real obligations to
disclose, and no practical way to do it. What is specific to the Philippines here is the law it
is built around and the language it speaks. The rest is not.

So the aim is wider than my barangay, and the path to it is unglamorous: make it work completely
in one place, for one council, with real money and real scrutiny. Then the next.

This is not a portfolio piece. It is meant to be used.

— [Kristina Diane Aviles](https://github.com/diadonquixote), CEO of
[PDYN Technologies](https://sinag-v1.vercel.app/about#pdyn) · pdyntechnology@gmail.com

---

## What it does

| Who | What they get |
| --- | --- |
| **Everyone (no login)** | Public bulletin of minutes, financial reports and project updates; project pages with budget against actual spending; a monthly calendar; the full ledger with receipts; the council's organization chart and each official's public profile. In English or Filipino |
| **Site admin** | Decides who gets in. There is no sign-up: the admin creates the SK Chairperson's account after checking the official list of elected officials. Also: change roles, reset passwords, turn accounts off, mark a term as ended, erase an account. The admin is not an office: not on the council chart, cannot publish or approve |
| **SK Chairperson** | Add the council's secretary, treasurer and kagawads (each chooses their own password at first log-in), record projects the council agreed on, approve budgets (blocked when the fund cannot cover them), schedule with overlap checks, approve everything before it is published, audit log |
| **SK Secretary** | Turn meeting notes (typed, or photos of handwritten pages kept as the original) into structured minutes: attendance, decisions, action items, draft resolutions |
| **SK Treasurer** | The ledger (entries are voided, never deleted) with receipt photos; financial reports with every number computed in code, and automatic warnings for overspending and missing receipts |
| **SK Kagawad** | Progress updates on the projects they lead |

## Why the record can be trusted

- **Nothing goes up unapproved.** Minutes and reports go draft → submitted → published by the
  Chairperson, and each shows who wrote it and who approved it.
- **Nothing is quietly erased.** Ledger entries cannot be deleted; a mistake is voided in
  public, with the reason.
- **Numbers are computed, not typed.** Totals are added up from the entries in whole centavos,
  so they are exact ([`src/lib/money.ts`](src/lib/money.ts)).
- **Accounts are checked.** Nobody can sign up. The site admin creates the Chairperson's
  account against the official list, and the Chairperson adds the rest of the council.
- **Photos are encrypted** before they are stored (AES-256-GCM), so a copy of the database alone shows no receipts or notes.
- **Everything important is logged** in an audit trail.
- **The code is public to read**, so anyone can check how the numbers are worked out. It is all rights reserved.

## Security

Found a problem? Please report it privately. See [SECURITY.md](SECURITY.md).

## Privacy and the law

Sinag publishes what [RA 10742](https://lawphil.net/statutes/repacts/ra2016/ra_10742_2016.html)
asks the SK to disclose, and handles personal data under the
[Data Privacy Act, RA 10173](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html) and its
[implementing rules](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/).

- The public [privacy notice](https://sinag-v1.vercel.app/privacy) is in English and Filipino.
  Officials agree to it, with the version recorded, before they get an account.
- v1 collects nothing from visitors or from anyone under 18.
- The data inventory, retention periods, breach plan and the
  [NPC Circular 2022-04](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf)
  registration assessment are in [docs/PRIVACY.md](docs/PRIVACY.md).

This is not legal advice, and the council should confirm it with the municipal Data Protection
Officer.

## Status

A pilot with one council. What is checked on every change, in
[CI](.github/workflows/ci.yml):

- lint (ESLint, Next.js rules), the TypeScript type check, and a production `next build`
- unit tests (money, the fund summary, photo encryption and compression, uploads, translations, security headers, settings) and database tests
  against Postgres 16, with `db:setup` run twice to prove it is safe to repeat
- browser tests (Playwright, desktop and phone sizes) on a real build: every public page loads
  with no errors under the security policy, both languages work, and the whole account life
  cycle works (admin creates the Chairperson → Chairperson adds a kagawad → each must choose
  their own password → a password change logs out other devices → account
  turned off → the Chairperson ends a term)
- Lighthouse on phone settings for five public pages, with the scores and any failed checks
  reported on the run

What is not done yet: an independent security review, load testing, a review of the Filipino
text by more readers, and the council's resolution adopting the system and naming its privacy
officer.

## Two branches

`v1` (this branch) is the public record and is what is deployed. `main` is the full version,
which adds youth participation: an idea box, polls and volunteering. It waits for the privacy
groundwork that collecting data from people under 18 requires. `v1-next` is where changes are
checked before they reach `v1`.

## Design

White, with the Philippine flag's blue, red and yellow. Fraunces for headings, Plus Jakarta Sans
for text. The sun mark is the "sinag". Built phone-first, because most kabataan will only ever
see it on a phone.

## Documentation

| | |
| --- | --- |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | For contributors: the tests, the project layout, adding text in both languages |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Put it online for a council, every setting, upgrading safely |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Looking after a live site: backups, accounts, incidents |
| [docs/TURNOVER.md](docs/TURNOVER.md) | When an official, the Chairperson or the site admin leaves: who does what, and which accounts and secrets to hand over |
| [docs/PRIVACY.md](docs/PRIVACY.md) | What personal data is held, where, for how long, and the breach plan |
| [docs/DEMO.md](docs/DEMO.md) | Running a public demo with made-up data |
| [SECURITY.md](SECURITY.md) | Reporting a security problem |

## Built with

Next.js 15 (App Router, server actions), React 19, TypeScript, Tailwind CSS, PostgreSQL
(`postgres`), `jose` and `bcryptjs` for sessions, Vitest and Playwright for tests.

## License

Copyright © 2026 Kristina Diane Aviles, PDYN Technologies.

All rights reserved. Sinag is proprietary software: Kristina Diane Aviles is the only person
allowed to edit it. No one else may modify, copy, redistribute or deploy it without her written
permission. The code is public for transparency and may be read, nothing more. See [LICENSE](LICENSE).
