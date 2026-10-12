import Link from "next/link";
import { Badge, Empty, Flash, PageHeader } from "@/components/ui";
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
    <div className="container-x py-12">
      <PageHeader eyebrow="Ideas & polls" title="You decide what happens next">
        Kabataan suggest projects. The SK opens the best ones for voting. The winners become funded projects.
      </PageHeader>
      <Flash sp={sp} />
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/ideas/new" className="btn-red">Suggest a project</Link>
        {!user && <Link href="/register" className="btn-outline">Join to vote</Link>}
      </div>

      <h2 className="text-2xl font-bold">Polls</h2>
      {polls.length === 0 ? <div className="mt-4"><Empty>No polls yet. When the Chairperson opens one, it appears here.</Empty></div> : (
        <div className="mt-4 space-y-8">
          {polls.map((poll) => {
            const open = poll.status === "open" && new Date(poll.closes_at).getTime() > Date.now();
            const total = poll.ideas.reduce((s: number, i: Row) => s + i.votes, 0);
            const left = poll.max_votes - usedBy(poll.id);
            return (
              <section key={poll.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold">{poll.title}</h3>
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
                      <li key={idea.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryStyle(idea.category).chip}`}>{idea.category}</span>
                            <h4 className="mt-2 font-bold">{idea.title}</h4>
                            <p className="mt-1 text-sm text-slate-600">{idea.description}</p>
                            <p className="mt-1 text-xs text-slate-500">By {idea.author} · est. {peso(idea.est_budget)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-flag-blue">{idea.votes}</p>
                            <p className="text-xs text-slate-500">votes</p>
                            {open && user?.role === "kabataan" && (
                              <form action={castVote} className="mt-2">
                                <input type="hidden" name="poll_id" value={poll.id} /><input type="hidden" name="idea_id" value={idea.id} />
                                <SubmitButton className={voted ? "btn-outline btn-sm" : "btn-yellow btn-sm"} pending="...">{voted ? "Voted ✓ (undo)" : "Vote"}</SubmitButton>
                              </form>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-flag-blue" style={{ width: `${total ? Math.round((idea.votes / total) * 100) : 0}%` }} /></div>
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

      <h2 className="mt-14 text-2xl font-bold">Suggested ideas</h2>
      {ideas.length === 0 ? <div className="mt-4"><Empty>No ideas yet. Be the first!</Empty></div> : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ideas.map((i) => (
            <article key={i.id} className="card">
              <Badge className={(IDEA_STATUS[i.status] ?? IDEA_STATUS.approved).className}>{(IDEA_STATUS[i.status] ?? IDEA_STATUS.approved).label}</Badge>
              <h3 className="mt-2 text-lg font-bold">{i.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">{i.description}</p>
              <p className="mt-2 text-xs text-slate-500">{i.category} · by {i.author} · est. {peso(i.est_budget)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
