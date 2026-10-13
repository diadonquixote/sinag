# Sinag

**Sinag** means *a ray of light*. It is a transparency web app for Sangguniang Kabataan (SK) councils: kabataan suggest and vote on projects, the council funds and schedules them, and every set of minutes, financial report and project update is posted where the whole barangay can read it.

Built by PDYN Technologies, from a first-hand problem: SK work that happens out of public view. Colors: white with the Philippine flag's blue, red and yellow.

## What it does

| Who | What they get |
| --- | --- |
| **Everyone (no login)** | Public bulletin, project pages with budget vs. actual spending, monthly calendar, polls and ideas, fund transparency page with the full ledger |
| **Kabataan** | Suggest project ideas, vote in polls (a fixed number of votes each, can be undone), volunteer for events, track their ideas |
| **SK Chairperson** | Review ideas, open and close polls, turn winners into AI-drafted proposals with itemized budgets, approve budgets (blocked if the fund can't cover them), schedule with overlap checks, **approve everything before it is published**, audit log, create official accounts |
| **SK Secretary** | Type raw Taglish notes or upload up to 6 photos of handwritten pages (read automatically when a vision model is set, and kept with the minutes as the original record) and get structured minutes: attendance, decisions, action items, draft resolutions, and a budget check |
| **SK Treasurer** | Ledger (entries are voided, never deleted) with receipt photos (taken on the phone or uploaded; read automatically when a vision model is set; shown on the public ledger unless hidden), generate financial reports with code-computed numbers, AI-written plain-language summary and automatic warnings (overspending, missing receipts) |
| **SK Kagawad** | Post progress updates on the projects they lead |
| **Every account** | A profile with photo, bio, purok, skills and a private mobile number. Officials appear on the public **SK council organization chart**; clicking anyone opens their profile with credentials, the contributions they list, and an automatic record of what they have done in Sinag. Kabataan photos are only shown to themselves and SK officials. Point persons see volunteers' contact details. |

**Trust rules built in:** AI only drafts. Numbers are always computed in code. Minutes and reports go draft, then submitted, then published by the Chairperson. Every important action is written to an audit log.

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

Demo accounts (after seeding; password is your `SEED_PASSWORD`): `chair@sinag.demo`, `secretary@sinag.demo`, `treasurer@sinag.demo`, `kagawad@sinag.demo`, `youth1@sinag.demo`.

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

### Turning on the AI assistants (free)

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in with Google and create an API key.
2. Put it in `.env.local` as `GEMINI_API_KEY=...` and restart `npm run dev`.

That is the whole setup — the model IDs are built in. Free tiers have daily limits, so if
one is reached the assistants say "the free AI limit has been reached" and fall back to
template drafts. Nothing is lost: photos and receipts are saved either way.

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
