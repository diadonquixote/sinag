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
| `NEBIUS_API_KEY` | for AI | Nebius Token Factory key |
| `NEBIUS_BASE_URL` | for AI | Default `https://api.tokenfactory.nebius.com/v1` |
| `NEBIUS_MODEL` | for AI | A Nemotron model ID from your Nebius console |
| `NEBIUS_VISION_MODEL` | optional | Vision model for photos of handwritten notes |
| `SEED_PASSWORD` | demo only | Password for seeded demo accounts |

Without the AI variables the app still works: assistants fall back to simple template drafts and say so.

## Deploy to Vercel

1. Create a free Postgres database (Neon or Supabase) and run `npm run db:setup` against it (set `DATABASE_URL` in your shell first).
2. Import this GitHub repo in Vercel.
3. Add the environment variables above in Project Settings.
4. Deploy. AI pages allow up to 60 seconds. Photos are resized in the browser to stay under Vercel's 4.5 MB request limit.

Vercel's Hobby plan is for non-commercial use, so move to a paid plan if the app is used for real SK operations.

## Stack

Next.js 15 (App Router, server actions), React 19, TypeScript, Tailwind CSS, Postgres (`postgres`), `jose` + `bcryptjs` for sessions, Nebius Token Factory (OpenAI-compatible) with NVIDIA Nemotron models.

## Honest status

This code was written in an environment without access to the npm registry, so **`next build` has not been run**. What was verified: all TypeScript passes a syntax check and a stubbed type-check, the SQL schema and seed ran cleanly on PostgreSQL 16, and the key queries (fund available = ₱421,150 on the seed data, feed, calendar, polls, report spending) returned the expected results. Expect to fix a few small type errors on the first `npm run build`. The Nebius base URL and model IDs also need to be confirmed against your own console.
