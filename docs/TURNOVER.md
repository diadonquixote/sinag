# Turnover: when someone leaves

SK terms end, officials resign, and people lose phones. Sinag is meant to outlive any one person,
including its builder. This page says what to do in each case, so the site never depends on one
person remembering something.

Everything an outgoing official published stays on the record under their name. Ending a term
never deletes anything.

## Who can do what

| Situation | Who acts | Where |
| --- | --- | --- |
| A secretary, treasurer or kagawad leaves, or their term ends | The **Chairperson** | Team page, **Term ended or left the council?** |
| The Chairperson's term ends or they resign | The **site admin** | Accounts page, **Term ended**, then create the next Chairperson |
| An official forgot their password | The Chairperson (their team) or the site admin | Team page / Accounts page, **Reset password** |
| The site admin leaves | The **new site admin** | Accounts page (see "If the site admin changes" below) |
| An official wants their personal details erased | The site admin | Accounts page, **Remove** (turn the account off first) |

## An official on the Chairperson's team leaves

1. Chairperson: **Team** -> the person's card -> **Term ended or left the council?** -> **Term ended**.
   They are logged out on every device at once and can no longer log in.
2. They are listed under **Former officials** on the public council page. Their minutes, reports and
   ledger entries keep their name.
3. Their seat is free. **Add an official** for the replacement (limits: 1 secretary, 1 treasurer,
   7 kagawads active at a time).
4. Anything the person left as a **draft** is still in the system. The replacement can read and
   continue the secretary's and treasurer's drafts from their own desk; the Chairperson can approve
   anything that is waiting.

## The Chairperson's term ends

The council cannot approve or publish anything without an active Chairperson. Everything already
published stays online.

1. Site admin: create the **new Chairperson** on the Accounts page, after checking them against the
   official list of elected officials. Send the temporary password privately.
2. Site admin: **Term ended** on the old Chairperson. Do this after the new one has logged in, so
   there is no gap.
3. The new Chairperson adds the rest of the council from their Team page.
4. The Accounts page shows a yellow warning whenever there is no active Chairperson.

## If the site admin changes

There must always be at least two people who can run the Accounts page, or one person's lost
password locks everyone out.

1. The current admin creates the **new admin** account (Accounts page -> Position: Site admin).
2. The new admin logs in and chooses their own password.
3. The **new** admin turns off the old admin's account (an admin cannot turn off their own account,
   so the site can never be left with none).
4. Keep a second admin at all times. The Accounts page reminds you when you are the only one.

If every admin is locked out, whoever holds the database connection can create a new one from a
computer: `export DATABASE_URL='...'` then `npm run db:admin`. This is why the database account
must never belong to a single person (below).

## The accounts behind the site

The software is the easy part. These are the accounts that can switch the site off. Write down
who holds each one, and move them to **council-owned** email addresses before real records go in.

| Account | Holds | Hand over by |
| --- | --- | --- |
| Vercel | the website, its settings and secrets | add the new holder as a member, then transfer the project |
| Neon (database) | all records and the backups | add the new holder, then transfer the project |
| GitHub | the code | add the new holder as a collaborator or move the repository to an organisation |
| Domain registrar | the web address | transfer the domain to the council |
| Council email | password resets for all of the above | change its password and recovery details |
| Password manager | the **photo encryption key** and all the secrets | share the vault with the next holder |

### Secrets that must be handed over, and rotated

- `PHOTO_ENCRYPTION_KEY`: encrypts stored photos. **If it is lost, the photos cannot be read, and a
  database backup is not enough.** Keep a copy in the council's password manager. Do not change it
  without re-encrypting the photos first.
- `AUTH_SECRET`: signs login cookies. Changing it logs everybody out, which is safe and a good habit
  when a person who knew it leaves.
- `DATABASE_URL`: contains the database password. Reset the database password when a person who
  knew it leaves, then update it in Vercel and redeploy.
- AI keys (`GEMINI_API_KEY`, `GROQ_API_KEY`): create new keys in the new holder's name.

## A checklist for the day of turnover

- [ ] Outgoing officials marked **Term ended**; new officials added and have chosen their own passwords
- [ ] An active Chairperson, and at least two site admins
- [ ] Vercel, Neon, GitHub, domain and council email moved to the incoming holders
- [ ] `PHOTO_ENCRYPTION_KEY` and other secrets in the password manager, shared with the incoming holder
- [ ] Database password and `AUTH_SECRET` reset, Vercel redeployed
- [ ] `PRIVACY_CONTACT_NAME` and `PRIVACY_CONTACT_EMAIL` updated to the new privacy officer
- [ ] A backup or restore point taken before and after
- [ ] The next person to call, with a phone number, written in the council's own records
