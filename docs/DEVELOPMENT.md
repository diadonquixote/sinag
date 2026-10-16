# Developing Sinag

How to run Sinag on your own computer, test it, and find your way around the code.
For putting it online, see [DEPLOYMENT.md](DEPLOYMENT.md).

## What you need

- Node.js 20 or newer (22 is what CI uses)
- A PostgreSQL database. A free [Neon](https://neon.tech) project works; so does Postgres
  installed locally. Keep the one you develop against separate from any real council's.

## First run

```bash
npm install
cp .env.example .env.local     # set DATABASE_URL, AUTH_SECRET and PHOTO_ENCRYPTION_KEY at least
npm run db:setup               # creates the tables; safe to re-run
npm run db:seed                # demo people and records (needs SEED_PASSWORD in .env.local)
npm run dev                    # http://localhost:3000
```

**After every `git pull`, run `npm run db:setup` again.** It only adds what is missing and never
deletes data.

Demo logins after seeding (password: your `SEED_PASSWORD`): `admin@sinag.demo`,
`chair@sinag.demo`, `secretary@sinag.demo`, `treasurer@sinag.demo`, `kagawad@sinag.demo`.
Forgot it? `npm run db:passwords` resets them all to the current `SEED_PASSWORD`.

If a page shows up without its styling after switching branches, stop `npm run dev`, delete the
`.next` folder, start it again and hard-refresh the browser.

## Settings

| Name | Needed | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. On Vercel, use the pooled one |
| `AUTH_SECRET` | yes | 32+ random characters that sign login cookies: `openssl rand -base64 32` |
| `PHOTO_ENCRYPTION_KEY` | yes | 32 random bytes that encrypt stored photos: `openssl rand -base64 32`. Losing it makes the stored photos unreadable, so keep a copy |
| `NEXT_PUBLIC_ORG_NAME` | recommended | Whose records these are, e.g. `SK ng Barangay San Isidro`. Baked in at build time |
| `SINAG_STAGE` | no | `pilot` (default: banner saying paper copies are official), `live` (no banner), `demo` (made-up data, demo logins shown) |
| `PRIVACY_CONTACT_NAME`, `PRIVACY_CONTACT_EMAIL` | once named | The council's privacy officer, shown on the privacy notice |
| `NEXT_PUBLIC_SOURCE_URL` | no | Where the source code is, for the footer link. Defaults to this repository |
| `DEMO_PASSWORD` | demo only | Shown on the login page of a demo site |
| `SEED_PASSWORD` | local only | Password for the demo accounts `db:seed` creates |
| `GEMINI_API_KEY`, `GROQ_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `AI_VISION_MODEL`, `AI_BASE_URL`, `AI_API_KEY` | no | The AI assistants. Off in v1; see below |

A production build refuses to start without `DATABASE_URL`, `AUTH_SECRET` and `PHOTO_ENCRYPTION_KEY`, and says which
one is missing. (`SKIP_ENV_CHECK=1` turns that off for a build that deliberately has no database.)

## Checks

| Command | What it runs |
| --- | --- |
| `npm run lint` | ESLint with Next.js's rules |
| `npm run typecheck` | TypeScript, no output files. Run `npm run build` once first so Next.js writes its type files |
| `npm test` | Vitest: unit tests in `tests/unit`, database tests in `tests/db` (these run only when `DATABASE_URL` is set, inside a transaction that is always rolled back) |
| `npm run test:e2e` | Playwright browser tests in `tests/e2e`, against a production build on port 3100. Needs a seeded database and `SEED_PASSWORD`. First time: `npx playwright install chromium` |
| `npm run check` | lint, typecheck and unit tests together |

CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) runs all of them on every push to
`v1` and `v1-next`, against a fresh Postgres 16: lint, `db:setup` twice, unit and database tests,
build, type check, demo data, then the browser tests on desktop and phone sizes. Screenshots of
every public page are kept with each run.

Two details of the workflow: a failing step attaches the end of its output to the run as an
annotation (so a failure can be read from the GitHub API), and on `v1-next` a small job refreshes
`package-lock.json` when `package.json` changed and commits it back.

## Where things are

```
src/app/            pages (public ones at the top level, official desks under dashboard/)
src/actions/        server actions: everything that changes data, each one checks the role first
src/lib/auth.ts     sessions, roles and revoking logins
src/lib/money.ts    exact peso arithmetic in centavos
src/lib/images.ts   checking and cleaning uploaded photos
src/lib/messages.ts all public text, in English and Filipino
src/lib/i18n.ts     picking the language for a request
db/schema.sql       the whole database; written so it can be applied again and again
db/seed.sql         demo data
scripts/            db:setup, db:admin / db:chair, demo password reset
tests/              unit, db and e2e tests
```

## Adding or changing public text

Public pages take every word from `src/lib/messages.ts`. Add the English text to `en` and the
Filipino to `fil` under the same key, then use it in a page:

```tsx
const { t } = await getT();
<h1>{t("funds.heading")}</h1>
<p>{t("council.lead", { org: ORG_NAME })}</p>
```

The Filipino list is typed against the English one, so a missing translation is a type error,
and a test checks that both languages use the same `{placeholders}`. Official desks are English
for now.

## Changing the database

Edit `db/schema.sql` so that running it again is safe: `create table if not exists`,
`alter table ... add column if not exists`, and for a changed check constraint, `drop constraint
if exists` followed by `add constraint`. CI applies the schema twice to prove it. Every
deployment must run `npm run db:setup` against its database **before** code that needs the new
columns goes live (see [DEPLOYMENT.md](DEPLOYMENT.md#upgrading)).

## The AI assistants are off in v1, on purpose

The secretary's and treasurer's desks can use an AI model to draft minutes and report summaries.
v1 ships with no key, so they fall back to plain structured drafts and say so.

Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) say not to submit sensitive,
confidential or personal information to the free ("unpaid") services, and minutes name people.
To turn the assistants on, use a paid tier (where the provider does not train on your content),
set `GEMINI_API_KEY`, and set a budget cap. Free tiers are only for made-up data.
