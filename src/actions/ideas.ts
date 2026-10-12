"use server";

import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { CATEGORIES } from "@/lib/roles";
import { fundSummary } from "@/lib/funds";
import { generateProposal, proposalTotal } from "@/lib/ai";

/** Any signed-in person can suggest a project. It waits for the council's review. */
export async function submitIdea(fd: FormData): Promise<void> {
  const user = await requireRole();
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const category = String(fd.get("category") ?? "");
  const budget = Number(String(fd.get("est_budget") ?? "0").replace(/[^\d.]/g, ""));

  if (title.length < 5) back("/ideas/new", "err", "Give your idea a short title (at least 5 characters).");
  if (description.length < 30) back("/ideas/new", "err", "Tell us a bit more: what is it, who is it for, and why? (at least 30 characters)");
  if (!(CATEGORIES as readonly string[]).includes(category)) back("/ideas/new", "err", "Pick a category.");
  if (!Number.isFinite(budget) || budget < 0 || budget > 5_000_000) back("/ideas/new", "err", "Enter a realistic estimated budget in pesos.");

  const [idea] = await sql<Row[]>`
    insert into ideas (author_id, title, description, category, est_budget)
    values (${user.id}, ${title.slice(0, 140)}, ${description.slice(0, 3000)}, ${category}, ${budget})
    returning id
  `;
  await audit(user.id, "submitted idea", "idea", idea.id as number, title);
  back("/dashboard", "ok", "Salamat! Your idea was sent to the SK for review. You will see its status here.");
}

/** Chairperson approves an idea for polling, or declines it with a reason the author can read. */
export async function reviewIdea(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = Number(fd.get("idea_id"));
  const decision = String(fd.get("decision") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  if (!Number.isInteger(id)) back("/dashboard/chair", "err", "That idea could not be found.");

  if (decision === "reject") {
    if (note.length < 5) back("/dashboard/chair", "err", "Please give a short reason so the author understands.");
    await sql`update ideas set status = 'rejected', review_note = ${note} where id = ${id} and status = 'pending'`;
    await audit(chair.id, "declined idea", "idea", id, note);
    back("/dashboard/chair", "ok", "Idea declined. The author can see your reason.");
  }
  await sql`update ideas set status = 'approved', review_note = ${note || null} where id = ${id} and status = 'pending'`;
  await audit(chair.id, "approved idea for polling", "idea", id);
  back("/dashboard/chair", "ok", "Idea approved. You can now add it to a poll.");
}

export async function createPoll(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const title = String(fd.get("title") ?? "").trim();
  const closes = String(fd.get("closes_on") ?? "");
  const maxVotes = Math.min(Math.max(Number(fd.get("max_votes") ?? 3) || 3, 1), 20);
  const ideaIds = fd
    .getAll("idea_ids")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));

  if (title.length < 4) back("/dashboard/chair", "err", "Give the poll a title.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closes)) back("/dashboard/chair", "err", "Pick the last day of voting.");
  if (ideaIds.length < 2) back("/dashboard/chair", "err", "Choose at least two approved ideas for the poll.");

  const valid = await sql<Row[]>`select id from ideas where status = 'approved' and id in ${sql(ideaIds)}`;
  if (valid.length < 2) back("/dashboard/chair", "err", "Only approved ideas can be added to a poll.");

  const pollId = await sql.begin(async (tx) => {
    const [poll] = await tx<Row[]>`
      insert into polls (title, closes_at, max_votes)
      values (${title.slice(0, 140)}, (${closes}::date + time '23:59:59') at time zone 'Asia/Manila', ${maxVotes})
      returning id
    `;
    for (const row of valid) {
      await tx`insert into poll_ideas (poll_id, idea_id) values (${poll.id}, ${row.id})`;
    }
    await tx`update ideas set status = 'polling' where id in ${tx(valid.map((v) => v.id as number))}`;
    return poll.id as number;
  });
  await audit(chair.id, "opened poll", "poll", pollId, title);
  back("/dashboard/chair", "ok", "Poll is open. Kabataan can start voting.");
}

/** Vote for an idea, or press again to take the vote back. Each youth has a fixed number of votes per poll. */
export async function castVote(fd: FormData): Promise<void> {
  const user = await requireRole("kabataan");
  const pollId = Number(fd.get("poll_id"));
  const ideaId = Number(fd.get("idea_id"));
  if (!Number.isInteger(pollId) || !Number.isInteger(ideaId)) back("/ideas", "err", "That vote could not be counted.");

  const result = await sql.begin(async (tx): Promise<{ ok: boolean; message: string }> => {
    // Lock the poll row so two quick taps can never go over the limit.
    const [poll] = await tx<Row[]>`select id, status, max_votes, closes_at from polls where id = ${pollId} for update`;
    if (!poll || poll.status !== "open" || new Date(poll.closes_at as string).getTime() < Date.now()) {
      return { ok: false, message: "Voting for this poll has closed." };
    }
    const inPoll = await tx<Row[]>`select 1 as x from poll_ideas where poll_id = ${pollId} and idea_id = ${ideaId}`;
    if (inPoll.length === 0) return { ok: false, message: "That idea is not part of this poll." };

    const existing = await tx<Row[]>`
      select 1 as x from votes where poll_id = ${pollId} and idea_id = ${ideaId} and user_id = ${user.id}
    `;
    if (existing.length > 0) {
      await tx`delete from votes where poll_id = ${pollId} and idea_id = ${ideaId} and user_id = ${user.id}`;
      return { ok: true, message: "Vote taken back. You can use it on another idea." };
    }
    const [used] = await tx<Row[]>`select count(*)::int as n from votes where poll_id = ${pollId} and user_id = ${user.id}`;
    if ((used.n as number) >= (poll.max_votes as number)) {
      return { ok: false, message: `You have used all ${poll.max_votes} of your votes. Take one back to vote for a different idea.` };
    }
    await tx`insert into votes (poll_id, idea_id, user_id) values (${pollId}, ${ideaId}, ${user.id})`;
    return { ok: true, message: "Vote counted. Salamat sa pakikilahok!" };
  });
  back("/ideas", result.ok ? "ok" : "err", result.message);
}

/** Close a poll: the top ideas are marked as winners, the rest return to the approved pool. */
export async function closePoll(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const pollId = Number(fd.get("poll_id"));
  const winners = Math.min(Math.max(Number(fd.get("winners") ?? 1) || 1, 1), 10);
  if (!Number.isInteger(pollId)) back("/dashboard/chair", "err", "Poll not found.");

  const summary = await sql.begin(async (tx) => {
    const [poll] = await tx<Row[]>`select status from polls where id = ${pollId} for update`;
    if (!poll || poll.status !== "open") return null;

    const ranked = await tx<Row[]>`
      select i.id, i.title, count(v.user_id)::int as votes
      from poll_ideas pi
      join ideas i on i.id = pi.idea_id
      left join votes v on v.poll_id = pi.poll_id and v.idea_id = i.id
      where pi.poll_id = ${pollId}
      group by i.id
      order by votes desc, i.created_at asc
    `;
    const winnerIds = ranked.filter((r) => (r.votes as number) > 0).slice(0, winners).map((r) => r.id as number);
    const otherIds = ranked.map((r) => r.id as number).filter((id) => !winnerIds.includes(id));

    await tx`update polls set status = 'closed' where id = ${pollId}`;
    if (winnerIds.length) await tx`update ideas set status = 'selected' where id in ${tx(winnerIds)}`;
    if (otherIds.length) await tx`update ideas set status = 'approved' where id in ${tx(otherIds)} and status = 'polling'`;
    return ranked.filter((r) => winnerIds.includes(r.id as number)).map((r) => `${r.title} (${r.votes} votes)`);
  });

  if (!summary) back("/dashboard/chair", "err", "That poll is already closed.");
  await audit(chair.id, "closed poll", "poll", pollId, summary.join("; "));
  back(
    "/dashboard/chair",
    "ok",
    summary.length ? `Poll closed. Winner${summary.length === 1 ? "" : "s"}: ${summary.join(", ")}.` : "Poll closed with no votes. Ideas returned to the approved list.",
  );
}

/** Turns a winning idea into a project proposal with an itemized budget. */
export async function draftProposal(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const ideaId = Number(fd.get("idea_id"));
  if (!Number.isInteger(ideaId)) back("/dashboard/chair", "err", "Idea not found.");

  const [idea] = await sql<Row[]>`
    select i.id, i.title, i.description, i.category, i.est_budget::float8 as est_budget,
           (select count(*) from votes v where v.idea_id = i.id)::int as votes
    from ideas i where i.id = ${ideaId} and i.status = 'selected'
  `;
  if (!idea) back("/dashboard/chair", "err", "Only ideas that won a poll can become proposals.");

  const { proposal, usedAI } = await generateProposal({
    title: idea.title as string,
    description: idea.description as string,
    category: idea.category as string,
    est_budget: idea.est_budget as number,
    votes: idea.votes as number,
  });
  const budget = Math.round(proposalTotal(proposal) * 100) / 100;

  const projectId = await sql.begin(async (tx) => {
    const [project] = await tx<Row[]>`
      insert into projects (idea_id, title, description, category, budget, status, proposal)
      values (${idea.id}, ${idea.title}, ${idea.description}, ${idea.category}, ${budget}, 'proposed',
              ${tx.json(proposal as never)})
      returning id
    `;
    await tx`update ideas set status = 'proposed' where id = ${idea.id}`;
    return project.id as number;
  });
  await audit(chair.id, "drafted proposal", "project", projectId, `${idea.title}${usedAI ? "" : " (template)"}`);

  const funds = await fundSummary();
  const note = usedAI ? "" : " AI was not available, so a generic template was used. Edit the figures with real quotes.";
  back(
    "/dashboard/chair",
    "ok",
    `Proposal drafted for "${idea.title}" at ${budget.toLocaleString("en-PH")} pesos. Available fund: ${Math.round(funds.available).toLocaleString("en-PH")} pesos.${note}`,
  );
}
