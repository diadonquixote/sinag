import Link from "next/link";
import { Badge, Empty, Flash, PageHeader, SectionHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { sql, type Row } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getPolls } from "@/lib/queries";
import { categoryStyle, IDEA_STATUS } from "@/lib/roles";
import { fmtDate, peso } from "@/lib/format";
import { castVote } from "@/actions/ideas";

export const metadata = { title: "Ideas & polls" };

export default async function IdeasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [user, polls, ideas] = await Promise.all([
    currentUser(),
    getPolls(),
    sql<Row[]>`
      select i.id, i.title, i.description, i.category, i.status, i.est_budget::float8 as est_budget, i.created_at, u.name as author
      from ideas i join users u on u.id = i.author_id
      where i.status in ('approved','polling','selected','proposed')
      order by i.created_at desc limit 40`,
  ]);
  const myVotes = user
    ? await sql<Row[]>`select poll_id, idea_id from votes where user_id = ${user.id}`
    : [];
  const mine = new Set(myVotes.map((v) => `${v.poll_id}:${v.idea_id}`));
  const usedBy = (pollId: number) => myVotes.filter((v) => v.poll_id === pollId).length;

  return (
    <div className="container-x py-10 sm:py-12">
      <PageHeader
        eyebrow="Ideas & polls"
        title="You decide what happens next"
        action={<>
          {!user && <Link href="/register" className="btn-outline">Join to vote</Link>}
          <Link href="/ideas/new" className="btn-red">Suggest a project</Link>
        </>}
      >
        Kabataan suggest projects. The SK opens the best ones for voting. The winners become funded projects.
      </PageHeader>
      <Flash sp={sp} />

      <SectionHeader as="h3" title="Polls" />
      {polls.length === 0 ? <Empty>No polls yet. When the Chairperson opens one, it appears here.</Empty> : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const open = poll.status === "open" && new Date(poll.closes_at).getTime() > Date.now();
            const total = poll.ideas.reduce((s: number, i: Row) => s + i.votes, 0);
            const left = poll.max_votes - usedBy(poll.id);
            return (
              <section key={poll.id} className={`card sm:p-6 ${open ? "ring-4 ring-emerald-500/5" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold leading-tight">{poll.title}</h3>
                  <Badge className={open ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>{open ? `Open until ${fmtDate(poll.closes_at)}` : "Closed"}</Badge>
                </div>
                {open && (
                  <p className="mt-1 text-sm text-slate-600">
                    {user?.role === "kabataan" ? `You have ${left} of ${poll.max_votes} votes left. Tap a vote again to take it back.` : `Each kabataan gets ${poll.max_votes} votes.`}
                  </p>
                )}
                <ul className="mt-4 space-y-3">
                  {poll.ideas.map((idea: Row) => {
                    const voted = mine.has(`${poll.id}:${idea.id}`);
                    return (
                      <li key={idea.id} className={`rounded-xl border p-4 transition ${voted ? "border-flag-blue/40 bg-mist/60" : "border-slate-200"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryStyle(idea.category).chip}`}>{idea.category}</span>
                          <p className="shrink-0 text-right leading-none"><span className="font-display text-2xl font-bold text-flag-blue tabular-nums">{idea.votes}</span> <span className="text-xs text-slate-500">{idea.votes === 1 ? "vote" : "votes"}</span></p>
                        </div>
                        <h4 className="mt-2 font-display text-lg font-bold leading-snug">{idea.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{idea.description}</p>
                        <p className="mt-1.5 text-xs text-slate-500">By {idea.author} · est. {peso(idea.est_budget)}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${idea.title} share of votes`} aria-valuenow={total ? Math.round((idea.votes / total) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-flag-blue" style={{ width: `${total ? Math.round((idea.votes / total) * 100) : 0}%` }} />
                          </div>
                          {open && user?.role === "kabataan" && (
                            <form action={castVote} className="shrink-0">
                              <input type="hidden" name="poll_id" value={poll.id} /><input type="hidden" name="idea_id" value={idea.id} />
                              <SubmitButton className={voted ? "btn-outline btn-sm" : "btn-yellow btn-sm"} pending="...">{voted ? "Voted ✓ Undo" : "Vote"}</SubmitButton>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {open && !user && <p className="mt-4 text-sm"><Link href="/login" className="font-semibold text-flag-blue">Log in</Link> as kabataan to vote.</p>}
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-14"><SectionHeader as="h3" title="Suggested ideas">Every idea kabataan have sent in, and where it is now.</SectionHeader></div>
      {ideas.length === 0 ? <Empty action={<Link href="/ideas/new" className="btn-red btn-sm">Suggest a project</Link>}>No ideas yet. Be the first!</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((i) => (
            <article key={i.id} className="card">
              <Badge className={(IDEA_STATUS[i.status] ?? IDEA_STATUS.approved).className}>{(IDEA_STATUS[i.status] ?? IDEA_STATUS.approved).label}</Badge>
              <h3 className="mt-2.5 text-lg font-bold leading-snug">{i.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{i.description}</p>
              <p className="mt-2 text-xs text-slate-500">{i.category} · by {i.author} · est. {peso(i.est_budget)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
