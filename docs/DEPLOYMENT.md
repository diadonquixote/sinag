# Deploying Sinag for a council

This puts Sinag online for one SK council on Vercel with a Neon (or Supabase) Postgres database.
Running it on your own computer is in [DEVELOPMENT.md](DEVELOPMENT.md); looking after it once it
is live is in [OPERATIONS.md](OPERATIONS.md).

One deployment serves one council: one fund, one ledger, one council page. A second barangay gets
its own deployment and its own database.

## 1. A database for the council

Create a new Postgres database for this council only, never the one you develop against. In
Neon: **New project**, pick the region closest to the council (Singapore for the Philippines),
then **Connect → Connection pooling** and copy the connection string. Turn on backups or point-in-
time restore before real records go in.

## 2. Create the tables and the first account

On your computer, in the project folder, on the branch you will deploy:

```bash
export DATABASE_URL='postgres://...the council database...'
npm run db:setup     # the tables
npm run db:admin     # the site admin, who approves everyone else
```

Put each command on its own line. **Never run `db:seed` here**: it creates demo accounts with a
known password. Close the terminal afterwards so the connection string does not linger.

## 3. Vercel

1. **Add New → Project**, import the repository.
2. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the pooled connection string from step 1 |
   | `AUTH_SECRET` | a new secret: `openssl rand -base64 32` |
   | `NEXT_PUBLIC_ORG_NAME` | the council's name, e.g. `SK ng Barangay San Isidro` |
   | `SINAG_STAGE` | `pilot` while the council is trying it; `live` once it has adopted it |
   | `PRIVACY_CONTACT_NAME`, `PRIVACY_CONTACT_EMAIL` | the council's privacy officer, once named |

   Leave the AI keys and `SEED_PASSWORD` unset.
3. Deploy. If a required setting is missing, the build stops and names it.
4. Vercel builds the repository's default branch first. To serve `v1`: **Settings →
   Environments → Production → Branch Tracking**, set it to `v1`, and push to `v1` (or promote a
   `v1` deployment from **Deployments**).
5. Optional: **Settings → Functions** and set the region to match the database (Singapore,
   `sin1`, for a Singapore database).

## 4. Check it

- Open the site logged out, on a phone. Every page should load, with the pilot banner on top.
- Log in as the site admin and create the real Chairperson's account, after checking them
  against the official list of elected officials. Send them the temporary password privately.
  The Chairperson then adds the rest of the council from the Team page.
- Read `/privacy` with the council. It says the council is responsible for what is published.

## Upgrading

Changes reach the live site when they are pushed to `v1`. They are checked first on `v1-next`,
where CI runs every test and Vercel builds a preview.

**If a change touches `db/schema.sql`, run `npm run db:setup` against the council's database
before it goes live**, with the new code checked out:

```bash
git checkout v1-next && git pull
export DATABASE_URL='postgres://...the council database...'
npm run db:setup
```

`db:setup` only adds what is missing, so running it before the code is live is safe; the
running site simply ignores the new columns until the new code arrives.

## Plans and accounts

- Vercel's Hobby plan is for non-commercial use. A council's official site may need a paid plan.
- The Vercel, Neon and GitHub accounts should belong to the council (a shared council email), or
  at least be written down with who holds them, so the site survives a change of officials. The
  handover checklist is in [OPERATIONS.md](OPERATIONS.md#end-of-term).
