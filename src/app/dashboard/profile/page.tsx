import Link from "next/link";
import { Flash, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import AvatarInput from "@/components/AvatarInput";
import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { isOfficial, ROLE_LABEL } from "@/lib/roles";
import { fmtDate, initials } from "@/lib/format";
import { changePassword } from "@/actions/auth";
import { updatePhoto, updateProfile } from "@/actions/profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole();
  const sp = await searchParams;
  const [me] = await sql<Row[]>`
    select name, email, role, barangay, purok, bio, phone, skills, committee, created_at,
           extract(epoch from avatar_updated_at)::bigint::text as avatar_v
    from users where id = ${user.id}`;
  const official = isOfficial(user.role);
  const photoUrl = me.avatar_v ? `/api/avatar/${user.id}?v=${me.avatar_v}` : null;

  const filled = [me.avatar_v, me.bio, me.purok, me.phone, official ? me.committee : me.skills].filter(Boolean).length;
  const complete = Math.round((filled / 5) * 100);

  return (
    <div>
      <Flash sp={sp} />
      <PageHeader
        eyebrow="Profile"
        title="Your profile"
        size="md"
        action={official ? <Link href="/council" className="btn-outline">See your public profile</Link> : undefined}
      >
        {official
          ? "This is what kabataan see on the SK council page. Keep it up to date so people know who to talk to."
          : "Help the SK get to know you. Your profile helps the council reach you when you volunteer."}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="card sm:p-6" aria-labelledby="photo-h">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="photo-h" className="text-lg font-bold">Photo</h2>
              <span className="text-xs font-semibold text-slate-500 lg:hidden">Profile {complete}% complete</span>
            </div>
            <form action={updatePhoto}>
              <AvatarInput current={photoUrl} initials={initials(me.name)} />
            </form>
            {photoUrl && (
              <form action={updatePhoto} className="mt-4 border-t border-slate-100 pt-4">
                <input type="hidden" name="remove" value="1" />
                <SubmitButton className="btn btn-sm px-0 text-slate-500 hover:text-flag-red" pending="Removing...">Remove photo</SubmitButton>
              </form>
            )}
          </section>

          <form action={updateProfile} className="card space-y-8 sm:p-6">
            <fieldset>
              <legend className="float-left mb-5 w-full font-display text-lg font-bold">About you</legend>
              <div className="clear-both space-y-5">
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" name="name" required minLength={2} maxLength={120} defaultValue={me.name} autoComplete="name" className="input" />
              </div>
              {official && (
                <div>
                  <label className="label" htmlFor="committee">Committee or responsibility</label>
                  <input id="committee" name="committee" maxLength={80} defaultValue={me.committee ?? ""} placeholder="e.g. Committee on Education" className="input" />
                  <p className="hint">Shown under your name on the council page.</p>
                </div>
              )}
              <div>
                <label className="label" htmlFor="bio">Short bio</label>
                <textarea id="bio" name="bio" rows={3} maxLength={300} defaultValue={me.bio ?? ""} placeholder={official ? "What you do in the SK and what people can ask you about." : "A line or two about yourself: school, work, what you care about."} className="input" />
                <p className="hint">Up to 300 characters.</p>
              </div>
              <div>
                <label className="label" htmlFor="skills">What can you help with?</label>
                <input id="skills" name="skills" maxLength={200} defaultValue={me.skills ?? ""} placeholder="e.g. first aid, photography, cooking, driving" className="input" />
                <p className="hint">Separate with commas. The point person sees this when you volunteer.</p>
              </div>
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-100 pt-6">
              <legend className="float-left mb-5 w-full font-display text-lg font-bold">Where you live</legend>
              <div className="clear-both grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="barangay">Barangay</label>
                  <input id="barangay" name="barangay" maxLength={120} defaultValue={me.barangay ?? ""} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="purok">Purok or sitio</label>
                  <input id="purok" name="purok" maxLength={60} defaultValue={me.purok ?? ""} placeholder="e.g. Purok 3" className="input" />
                </div>
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-100 pt-6">
              <legend className="float-left mb-5 w-full font-display text-lg font-bold">Contact</legend>
              <div className="clear-both grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="phone">Mobile number <span className="font-normal text-slate-400">(optional)</span></label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={me.phone ?? ""} placeholder="0917 123 4567" className="input" />
                  <p className="hint">Only SK officials can see this, to reach you about events you join.</p>
                </div>
                <div>
                  <p className="label">Email</p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{me.email}</p>
                  <p className="hint">This is how you log in. Ask the Chairperson to change it.</p>
                </div>
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <SubmitButton pending="Saving...">Save profile</SubmitButton>
            </div>
          </form>

          <form action={changePassword} className="card space-y-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold">Change password</h2>
              <p className="hint mt-0.5">Use at least 8 characters. Do not reuse a password from another site.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div><label className="label" htmlFor="current">Current password</label><PasswordInput id="current" name="current" required autoComplete="current-password" /></div>
              <div><label className="label" htmlFor="next">New password</label><PasswordInput id="next" name="next" required minLength={8} autoComplete="new-password" /></div>
            </div>
            <SubmitButton className="btn-outline" pending="Saving...">Change password</SubmitButton>
          </form>
          <div className="lg:hidden"><WhoSees official={official} /></div>
        </div>

        <aside className="hidden min-w-0 space-y-6 lg:block">
          <section className="card text-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-mist" />
            ) : (
              <span aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-flag-blue text-xl font-bold text-white ring-4 ring-mist">{initials(me.name)}</span>
            )}
            <p className="mt-3 font-display text-xl font-bold leading-tight">{me.name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABEL[user.role]}{official && me.committee ? ` · ${me.committee}` : ""}</p>
            {(me.purok || me.barangay) && <p className="mt-1 text-xs text-slate-500">{[me.purok, me.barangay].filter(Boolean).join(", ")}</p>}
            <p className="mt-3 text-xs text-slate-400">Member since {fmtDate(me.created_at)}</p>
            <div className="mt-5 border-t border-slate-100 pt-4 text-left">
              <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600"><span>Profile complete</span><span>{complete}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Profile complete" aria-valuenow={complete} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${complete === 100 ? "bg-emerald-500" : "bg-flag-yellow"}`} style={{ width: `${complete}%` }} />
              </div>
            </div>
          </section>

          <WhoSees official={official} />
        </aside>
      </div>
    </div>
  );
}

function Visibility({ label, who }: { label: string; who: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-semibold text-ink">{who}</dd>
    </div>
  );
}

function WhoSees({ official }: { official: boolean }) {
  return (
    <section className="card">
      <h2 className="text-base font-bold">Who can see what</h2>
      <dl className="mt-3 space-y-3 text-sm">
        <Visibility label="Name" who="Everyone" />
        <Visibility label={official ? "Photo, bio, committee" : "Photo and bio"} who={official ? "Everyone" : "You and SK officials"} />
        <Visibility label="Skills and purok" who="You and SK officials" />
        <Visibility label="Mobile number" who="You and SK officials" />
        <Visibility label="Email" who="You and the Chairperson" />
      </dl>
      {!official && <p className="mt-4 rounded-xl bg-mist px-3 py-2.5 text-xs leading-relaxed text-slate-600">Kabataan photos are never shown to the public, because some members are under 18.</p>}
    </section>
  );
}
