"use server";

import { sql, type Row } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { back } from "@/lib/flash";
import { audit } from "@/lib/audit";
import { fundSummary } from "@/lib/funds";
import { polishUpdate } from "@/lib/ai";
import { fmtDate, peso } from "@/lib/format";
import { isOfficial } from "@/lib/roles";

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

function projectId(fd: FormData): number {
  const id = Number(fd.get("project_id"));
  if (!Number.isInteger(id)) back("/projects", "err", "Project not found.");
  return id;
}

/** Chairperson edits the requested budget while a proposal is still under review (e.g. after getting real quotes). */
export async function updateProposalBudget(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = projectId(fd);
  const budget = Number(String(fd.get("budget") ?? "").replace(/[^\d.]/g, ""));
  const path = `/projects/${id}`;
  if (!(budget > 0) || budget > 100_000_000) back(path, "err", "Enter the budget in pesos.");

  const rows = await sql<Row[]>`
    update projects set budget = ${budget} where id = ${id} and status = 'proposed' returning title
  `;
  if (rows.length === 0) back(path, "err", "The budget can only be changed while a proposal is under review.");
  await audit(chair.id, "changed proposed budget", "project", id, peso(budget));
  back(path, "ok", "Budget updated.");
}

/** Approving commits the budget. It is blocked if the fund cannot cover it. */
export async function approveProject(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = projectId(fd);
  const path = `/projects/${id}`;

  const [project] = await sql<Row[]>`select title, status, budget::float8 as budget from projects where id = ${id}`;
  if (!project || project.status !== "proposed") back(path, "err", "Only proposals under review can be approved.");

  const funds = await fundSummary();
  const budget = Number(project.budget);
  if (budget > funds.available) {
    back(
      path,
      "err",
      `The fund can't cover this yet. The proposal needs ${peso(budget)} but only ${peso(Math.max(funds.available, 0))} is available. Reduce the budget or ask the treasurer to record new funds.`,
    );
  }
  await sql`update projects set status = 'approved' where id = ${id} and status = 'proposed'`;
  await audit(chair.id, "approved project and budget", "project", id, `${project.title} ${peso(budget)}`);
  back(path, "ok", `Approved. ${peso(budget)} is now set aside for this project. Next, schedule it.`);
}

export async function scheduleProject(fd: FormData): Promise<void> {
  const chair = await requireRole("chairperson");
  const id = projectId(fd);
  const path = `/projects/${id}`;
  const start = String(fd.get("start_date") ?? "");
  const end = String(fd.get("end_date") ?? "") || start;
  const location = String(fd.get("location") ?? "").trim().slice(0, 160);
  const leadId = Number(fd.get("lead_id"));
  const allowOverlap = fd.get("allow_overlap") === "on";

  if (!isDate(start) || !isDate(end)) back(path, "err", "Pick a start date.");
  if (end < start) back(path, "err", "The end date cannot be before the start date.");
  if (location.length < 3) back(path, "err", "Where will it happen?");

  const [lead] = await sql<Row[]>`select id, role from users where id = ${leadId}`;
  if (!lead || !isOfficial(lead.role as string)) back(path, "err", "Choose an SK official as the point person.");

  const [project] = await sql<Row[]>`select title, status from projects where id = ${id}`;
  if (!project || !["approved", "scheduled"].includes(project.status as string)) {
    back(path, "err", "Approve the project and its budget first.");
  }

  if (!allowOverlap) {
    const clash = await sql<Row[]>`
      select title, start_date::text as start_date from projects
      where id <> ${id} and status in ('scheduled', 'ongoing')
        and start_date <= ${end}::date and coalesce(end_date, start_date) >= ${start}::date
      limit 1
    `;
    if (clash.length > 0) {
      back(path, "err", `That overlaps with "${clash[0].title}" (starts ${fmtDate(clash[0].start_date as string)}). Pick other dates, or tick "Allow overlap" if it is intended.`);
    }
  }

  await sql`
    update projects
    set status = 'scheduled', start_date = ${start}::date, end_date = ${end}::date, location = ${location}, lead_id = ${leadId}
    where id = ${id}
  `;
  await audit(chair.id, "scheduled project", "project", id, `${project.title}: ${start} to ${end}`);
  back(path, "ok", "Scheduled. It now appears on the public calendar.");
}

export async function postUpdate(fd: FormData): Promise<void> {
  const user = await requireRole("chairperson", "secretary", "treasurer", "kagawad");
  const id = projectId(fd);
  const path = `/projects/${id}`;
  let body = String(fd.get("body") ?? "").trim();
  const progressRaw = String(fd.get("progress") ?? "").trim();
  const progress = progressRaw === "" ? null : Math.min(Math.max(Math.round(Number(progressRaw)), 0), 100);
  const polish = fd.get("polish") === "on";

  if (body.length < 10) back(path, "err", "Write a short update (at least a sentence).");
  if (progress !== null && !Number.isFinite(progress)) back(path, "err", "Progress must be a number from 0 to 100.");

  const [project] = await sql<Row[]>`select title, status, lead_id from projects where id = ${id}`;
  if (!project || !["scheduled", "ongoing", "completed"].includes(project.status as string)) {
    back(path, "err", "Updates can be posted once a project is scheduled.");
  }
  if (user.role === "kagawad" && project.lead_id !== user.id) back(path, "err", "Only the point person can post updates for this project.");

  if (polish) body = await polishUpdate(body);

  await sql`insert into project_updates (project_id, author_id, body, progress) values (${id}, ${user.id}, ${body.slice(0, 2000)}, ${progress})`;
  if (progress !== null) {
    await sql`
      update projects
      set progress = ${progress}::int,
          status = case when ${progress}::int >= 100 then 'completed'
                        when status = 'scheduled' and ${progress}::int > 0 then 'ongoing'
                        else status end
      where id = ${id} and status in ('scheduled', 'ongoing')
    `;
  }
  await audit(user.id, "posted update", "project", id, project.title as string);
  back(path, "ok", "Update posted to the public feed.");
}

/** Any signed-in person can raise a hand to help with a scheduled project. */
export async function toggleVolunteer(fd: FormData): Promise<void> {
  const user = await requireRole();
  const id = projectId(fd);
  const path = `/projects/${id}`;

  const [project] = await sql<Row[]>`select status from projects where id = ${id}`;
  if (!project || !["scheduled", "ongoing"].includes(project.status as string)) back(path, "err", "Volunteering is open for scheduled and ongoing projects.");

  const removed = await sql<Row[]>`delete from project_volunteers where project_id = ${id} and user_id = ${user.id} returning user_id`;
  if (removed.length > 0) back(path, "ok", "You are no longer on the volunteer list.");
  await sql`insert into project_volunteers (project_id, user_id) values (${id}, ${user.id}) on conflict do nothing`;
  back(path, "ok", "Salamat! You are on the volunteer list. The point person will reach out.");
}
