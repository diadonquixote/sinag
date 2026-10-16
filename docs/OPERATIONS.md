# Looking after a live Sinag

For whoever keeps a council's Sinag running: the site admin, and whoever holds the hosting
accounts.

## Routine

| When | What |
| --- | --- |
| After every update that changes `db/schema.sql` | `npm run db:setup` against the council database, before the code goes live |
| Monthly | Check that database backups are on and recent. The ledger cannot be edited, but a lost database is still lost |
| Monthly | Accounts page: anyone who should no longer have access? |
| Quarterly | The treasurer's certified statements are still posted in the barangay as RA 10742 §15(e) requires. Sinag is an extra channel, not a replacement |
| When the privacy notice changes | Raise `PRIVACY_VERSION` in `src/lib/privacy.ts`; officials are asked to read it again |

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:setup` | Creates or updates tables. Safe to re-run; never deletes data |
| `npm run db:admin` | Creates the site admin, or makes an existing account the admin. Also the way back in if every admin is locked out |
| `npm run db:chair` | Creates a Chairperson directly, or promotes an existing account |
| `npm run db:seed` | Demo data. **Never on a council's database** |

All of them read `DATABASE_URL` from the terminal (`export DATABASE_URL='...'`) or `.env.local`.

## Accounts

Nobody can sign up. The site admin creates the **SK Chairperson's** account, and the
Chairperson adds the secretary, treasurer and kagawads from their **Team** page (at most one
secretary, one treasurer and seven kagawads active at once). Every new account starts with a
temporary password, sent privately, which the person must replace the first time they log in.
`/request-access` only explains this; it has no form, so there is no request queue to flood.

The admin's **Accounts** page:

- **Create an account**: the Chairperson first, checked against the official list of elected
  officials. The admin can create any other account too.
- **Reset password** sets a temporary one and logs the person out everywhere. Share it privately.
  The Chairperson can do the same for their own team from the Team page.
- **Turn off account** logs them out at once. Their records stay.
- **Term ended** for an outgoing official: logged out, listed as a former official. The Chairperson does this for their own team from the Team page; the admin does it for the Chairperson.
- **Remove** erases email, password, phone, photo and profile; the name stays only on what they
  published in office. Turn the account off first.

Locked out after too many wrong passwords? It clears by itself after 15 minutes, or the admin
can reset the password.

## End of term

The full turnover guide, with a checklist, is in [TURNOVER.md](TURNOVER.md). In short, when a new council takes office:

1. Mark each outgoing official **Term ended**.
2. Create the new Chairperson's account, checked against the official list. They add the rest
   of their council from the Team page.
3. If the admin role changes hands: add the new admin on the Accounts page, have them log in,
   then they turn the old admin's account off.
4. Hand over the accounts behind the site. Write down who holds each one:

   | Account | Holds | Hand over by |
   | --- | --- | --- |
   | Vercel | the website and its settings | adding the new holder as a member, then transferring the project |
   | Neon | the database and its backups | transferring the project or adding the new holder |
   | GitHub | the code | adding the new holder as a collaborator |
   | Council email | password resets for all of the above | changing its password and recovery details |

5. The new council confirms its privacy officer and updates `PRIVACY_CONTACT_NAME` and
   `PRIVACY_CONTACT_EMAIL` in Vercel.

## When something goes wrong

**A password or key was exposed** (pasted into a chat, a screenshot, a commit): replace it, don't
hope. Database: reset the role's password in Neon, put the new connection string in Vercel's
`DATABASE_URL`, redeploy. `AUTH_SECRET`: set a new one in Vercel and redeploy; everyone is logged
out once. `PHOTO_ENCRYPTION_KEY`: do not simply replace it, or the stored photos become unreadable; decrypt and re-encrypt them with the new key first.

**Personal data may have been exposed:** the council must notify the National Privacy
Commission and the people affected within 72 hours of learning of it (IRR Section 38). The steps
are in [PRIVACY.md](PRIVACY.md#if-personal-data-is-exposed).

**The site is down:** Vercel → Deployments shows whether the latest build failed (the error names
the missing setting, if that is the cause). **Instant Rollback** returns to the last working
version while it is fixed.
