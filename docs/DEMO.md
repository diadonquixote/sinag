# Running a public demo

A demo is a separate copy of Sinag full of made-up people and records, where anyone can log in
as every role and try every screen without touching a real council's site.

It runs the same code. What makes it a demo is its settings and its database:

- `SINAG_STAGE=demo` puts a red banner on every page saying nothing on it is real, and shows the
  demo logins on the login page.
- Its own database, loaded with `db:seed`.

## A separate public repository

Keeping the demo in its own repository (for example `sinag-demo`) lets it be shown, forked and
reset without going near the real council's deployment.

1. On GitHub, create an empty **public** repository, `sinag-demo`, with no README.
2. Push this code to it:
   ```bash
   git remote add demo https://github.com/<you>/sinag-demo.git
   git push demo v1:main
   ```
   To bring it up to date later, run the same push again.
3. It stays under the AGPL-3.0, like this repository.

## Setting it up

1. A new, separate database (a free Neon project is enough).
2. Load the demo data, choosing the password visitors will use:
   ```bash
   export DATABASE_URL='postgres://...the demo database...'
   export SEED_PASSWORD='sinag-demo'
   npm run db:setup
   npm run db:seed
   ```
3. A new Vercel project from the `sinag-demo` repository, with:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the demo database |
   | `AUTH_SECRET` | its own secret: `openssl rand -base64 32` |
   | `PHOTO_ENCRYPTION_KEY` | its own key: `openssl rand -base64 32` |
   | `NEXT_PUBLIC_ORG_NAME` | `SK ng Barangay Halimbawa (Demo)` |
   | `SINAG_STAGE` | `demo` |
   | `DEMO_PASSWORD` | the same as `SEED_PASSWORD` above |
   | `NEXT_PUBLIC_SOURCE_URL` | the demo repository's address |

The demo logins are `admin@sinag.demo`, `chair@sinag.demo`, `secretary@sinag.demo`,
`treasurer@sinag.demo` and `kagawad@sinag.demo`.

## Resetting it

Visitors will change things. To put the demo data back:

```bash
export DATABASE_URL='postgres://...the demo database...'
export SINAG_STAGE=demo
export SEED_PASSWORD='sinag-demo'
npm run db:reset-demo
```

It refuses to run unless `SINAG_STAGE=demo`, and refuses if the database has any account that is
not a `@sinag.demo` one, so it cannot wipe a real council's data by mistake.

To reset it every night, add a scheduled GitHub Actions workflow to the demo repository with the
demo database's URL stored as a repository secret:

```yaml
name: Reset demo
on:
  schedule: [{ cron: "0 18 * * *" }]   # 2:00 a.m. Philippine time
  workflow_dispatch:
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run db:reset-demo
        env:
          DATABASE_URL: ${{ secrets.DEMO_DATABASE_URL }}
          SINAG_STAGE: demo
          SEED_PASSWORD: ${{ secrets.DEMO_PASSWORD }}
```
