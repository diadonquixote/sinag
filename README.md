# Sinag v1

**Sinag** means *a ray of light*. It is a transparency web app for Sangguniang Kabataan (SK)
councils: the council records what it is doing and what it spends, and the whole barangay can
read it without an account.

## Why I built this

I served as secretary of our Sangguniang Kabataan. That is where I learned how easily public
money becomes invisible.

Not through anything dramatic. Through minutes that stay in a notebook. Through a financial
report read aloud once at an assembly and never posted anywhere. Through a budget that exists,
is spent, and is never seen by a single one of the young people it belongs to. By the time
anyone thinks to ask where the funds went, the records are scattered, the term is ending, and
the honest answer is that nobody really knows.

The law is not the problem. RA 10742 already requires the SK to practise full public disclosure
of its transactions and documents. The problem is that there is nowhere for that disclosure to
go, and no habit of putting it there. A bulletin board in one barangay hall, read by whoever
happens to walk past.

So Sinag is not a record-keeping tool for councils. It is a record *for the public*, that the
council happens to keep. Every peso in the ledger is attached to a receipt. Nothing is published
without the Chairperson approving it, and nothing approved can quietly disappear afterwards —
entries are voided on the record, never deleted. Every number on the site is computed from the
ledger in code, so no one can type in a total that the entries do not support.

I built it because I wanted it to exist when I was the one keeping those records.

## Where this is going

It starts in one barangay, which is mine. That is deliberate: a transparency tool that has never
survived contact with a real council, a real budget and a real audit is not worth much.

But nothing in the idea is local. Every youth council, student government, cooperative and small
public body has the same shape of problem — a small budget, a few officers, real obligations to
disclose, and no practical way to do it. What is specific to the Philippines here is the law it
is built around and the language it speaks. The rest is not.

So the aim is wider than my barangay, and the path to it is unglamorous: make it work completely
in one place, for one council, with real money and real scrutiny. Then the next.

This is not a portfolio piece. It is meant to be used.

— Kristina Diane Aviles, built under PDYN Technologies

## What v1 is, and why

This is the half of Sinag that publishes public records. It collects no personal data from
young people, so it can go live while the privacy groundwork for the rest is being done.

RA 10742 already requires the SK to disclose its transactions and documents of public interest.
v1 is a way of keeping that promise. Everything in it is information the council is obliged to
publish anyway.

**Deliberately not in v1:** public sign-up, the youth idea box, polls and voting, volunteering,
and kabataan accounts. Those collect personal data from people who may be under 18, which brings
duties under the Data Privacy Act — a privacy notice, a child privacy impact assessment, erasure
and export. They come back in v2, once that groundwork exists. The code for them is in this
repository's history, not deleted from the world.

The AI assistants are present in the code but switched off, because free AI tiers forbid
personal data and council minutes are full of it. With no key set, the minutes assistant gives
the secretary a plain structured draft to edit, which is all v1 needs.

## What it does

| Who | What they get |
| --- | --- |
| **Everyone (no login)** | Public bulletin, project pages with budget against actual spending, monthly calendar, the full fund ledger, and the SK council organization chart |
| **SK Chairperson** | Record projects the council agreed on, approve budgets (blocked when the fund cannot cover them), schedule with overlap checks, **approve everything before it is published**, audit log, create official accounts |
| **SK Secretary** | Type or paste raw Taglish notes, or attach photos of handwritten pages as the original record, and get structured minutes: attendance, decisions, action items, draft resolutions, and a budget check |
| **SK Treasurer** | Ledger (entries are voided, never deleted) with receipt photos, shown on the public ledger unless hidden; financial reports with every number computed in code, plus automatic warnings for overspending and missing receipts |
| **SK Kagawad** | Post progress updates on the projects they lead |
| **Every official** | A profile with photo, bio, purok and committee, shown on the public council chart with their credentials, contributions, and an automatic record of what they have done in Sinag |

**Trust rules built in:** numbers are always computed in code, never by a model. Minutes and
reports go draft, then submitted, then published by the Chairperson. Every important action is
written to an audit log. The ledger is append-only.

## Where projects come from

v1 has no public idea box, so a project starts in a meeting. The council agrees on it, the
Chairperson records it on their desk, and from there it behaves exactly as before: approve the
budget against the available fund, set the dates, and it appears on the public calendar.

## Run it locally

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:setup               # creates the tables (safe to re-run)
npm run db:seed                # optional: demo data + demo accounts (needs SEED_PASSWORD in .env.local)
npm run dev
```

**After pulling new changes, run `npm run db:setup` again.** It only adds what is missing (for example the profile columns) and never deletes data.

Forgot the demo password, or changed `SEED_PASSWORD`? Run `npm run db:passwords` to reset every `@sinag.demo` account to the current `SEED_PASSWORD`.

Demo accounts (after seeding; password is your `SEED_PASSWORD`): `chair@sinag.demo`, `secretary@sinag.demo`, `treasurer@sinag.demo`, `kagawad@sinag.demo`. The seed also leaves a `youth1@sinag.demo` account from the full version; v1 has no desk for it.

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Any Postgres. Use the *pooled* URL on Vercel (Neon or Supabase both work) |
| `AUTH_SECRET` | yes | 16+ random characters: `openssl rand -base64 32` |
| `NEXT_PUBLIC_ORG_NAME` | no | Shown in the header, e.g. "SK ng Barangay San Isidro" |
| `GEMINI_API_KEY` | for AI | Free key from [Google AI Studio](https://aistudio.google.com/apikey). Reads photos too |
| `GROQ_API_KEY` | optional | Free [Groq](https://console.groq.com/keys) key. Text only — it cannot read photos |
| `AI_PROVIDER` | optional | `gemini`, `groq` or `nebius`. Blank means "whichever key is filled in" |
| `AI_MODEL` / `AI_VISION_MODEL` | optional | Override the built-in model IDs if one changes |
| `AI_BASE_URL` / `AI_API_KEY` | optional | Point at any other OpenAI-compatible provider |
| `SEED_PASSWORD` | demo only | Password for seeded demo accounts |

### The AI assistants are off in v1, on purpose

Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) say: "Do not submit
sensitive, confidential, or personal information to the Unpaid Services." Minutes name people
and receipts carry amounts and vendors, so the free tier is not an option for real council
records, and under the Data Privacy Act the SK stays accountable for what a processor does
with them.

So v1 ships with no key set. The minutes assistant still produces a structured draft from the
secretary's notes using plain rules, which she edits as she would anyway.

To turn the assistants on later, enable billing on the Gemini API — on the paid tier Google
does not train on your content — and set `GEMINI_API_KEY`. At an SK's volume this runs to a
few pesos a month. Set a budget cap when you enable it.

Without any AI key the app still works: assistants fall back to simple template drafts and say so.

Free tiers may use what you send to improve the provider's products. Minutes and receipts can
contain real names and amounts, so read the provider's terms before putting real council
records through them.

## Deploy to Vercel

1. Create a Postgres database (Neon or Supabase) for the real council. Keep it separate
   from the one you develop against.
2. Point `DATABASE_URL` at it in your shell and run **`npm run db:setup`**.
   Run `db:setup`, never `db:seed` — the demo accounts must not exist on a live site.
3. Create the first Chairperson with **`npm run db:chair`**. Nothing else can:
   public sign-up only ever creates kabataan accounts, and "Add official" needs a
   chairperson to already exist. Without this step the live site has no way in.
4. Import this GitHub repo in Vercel and add the environment variables above in
   Project Settings. A missing variable builds fine and fails at runtime, so check them twice.
5. Deploy, then log in as the Chairperson and add the rest of the council from the Team page.

AI pages allow up to 60 seconds. Photos are resized in the browser to stay under Vercel's
4.5 MB request limit. Vercel's Hobby plan is for non-commercial use, so move to a paid plan
if the app is used for real SK operations.

### Before real data goes in

- **Turn on backups** in Neon or Supabase. The ledger is append-only, which protects you from
  bad edits but not from a lost database.
- **Set `NEXT_PUBLIC_ORG_NAME`** to your barangay, not the default.
- **Walk one full cycle** with real data: idea, poll, proposal, budget, schedule, update,
  receipt, report. That is where the awkward parts show up.
- **Try it on a phone**, with the camera, not just a narrow browser window. Most kabataan
  will only ever see this on a phone.
- **Never commit `.env.local`.** It is already in `.gitignore`. If a key or password is ever
  pasted into a chat, a screenshot or a commit, replace it rather than hoping.

## Looking after it

| Command | What it does |
| --- | --- |
| `npm run db:setup` | Creates or updates tables. Safe to re-run; never deletes data. Run after every `git pull` |
| `npm run db:chair` | Creates the first Chairperson, or promotes an existing account |
| `npm run db:seed` | Demo data. Local only — never on a live site |
| `npm run db:passwords` | Resets the demo accounts to `SEED_PASSWORD` |

Repeated wrong passwords lock sign-in for about 15 minutes, counted per email address and per
internet address, so a password cannot be guessed endlessly. A correct password clears the
count, so an ordinary typo costs nothing. If someone is locked out and in a hurry, the
Chairperson can set them a new password from the Team page.

## Stack

Next.js 15 (App Router, server actions), React 19, TypeScript, Tailwind CSS, Postgres (`postgres`),
`jose` + `bcryptjs` for sessions, and any OpenAI-compatible AI provider (Gemini by default).

## Honest status

This code was written in an environment without access to the npm registry, so **`next build` has not been run**. What was verified: all TypeScript passes a syntax check and a stubbed type-check, the SQL schema and seed ran cleanly on PostgreSQL 16, and the key queries (fund available = ₱421,150 on the seed data, feed, calendar, polls, report spending) returned the expected results. Expect to fix a few small type errors on the first `npm run build`. The Nebius base URL and model IDs also need to be confirmed against your own console.
