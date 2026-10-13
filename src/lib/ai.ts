import { peso } from "./format";
import type { MinutesData, Proposal, ReportData } from "./types";

/**
 * AI assistants. Any OpenAI-compatible provider works; Sinag ships presets for the free ones.
 *
 * Rules every assistant follows here:
 *  - AI only drafts. A human reviews, and the chairperson approves before anything is public.
 *  - Money is never calculated by the model. Totals are computed in code; the model only writes words.
 *  - If the AI is not configured or fails, we fall back to a plain template so the app keeps working.
 *
 * Set AI_PROVIDER, or just drop in one key and Sinag picks the provider for you.
 */

type Preset = {
  label: string;
  base: string;
  keyEnv: string;
  model: string;
  /** null when the provider has no vision model we can rely on. Photos are then saved, not read. */
  vision: string | null;
};

const PRESETS: Record<string, Preset> = {
  // Free tier, no card required at the time of writing. Every Gemini model reads images.
  gemini: {
    label: "Google AI Studio",
    base: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyEnv: "GEMINI_API_KEY",
    model: "gemini-3.8-flash",
    vision: "gemini-3.8-flash",
  },
  // Free tier, fast, text only. Good as a backup when Gemini's daily limit runs out.
  groq: {
    label: "Groq",
    base: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    model: "llama-3.3-70b-versatile",
    vision: null,
  },
  // Paid. Kept so an existing Nebius setup keeps working.
  nebius: {
    label: "Nebius Token Factory",
    base: "https://api.tokenfactory.nebius.com/v1",
    keyEnv: "NEBIUS_API_KEY",
    model: "",
    vision: null,
  },
};

const env = (name: string): string => (process.env[name] || "").trim();

/** Works out which provider to talk to, and with which models. */
function provider(): { label: string; base: string; key: string; model: string; vision: string | null } {
  const chosen = env("AI_PROVIDER").toLowerCase();
  const name =
    (chosen && PRESETS[chosen] ? chosen : "") ||
    (env("GEMINI_API_KEY") && "gemini") ||
    (env("GROQ_API_KEY") && "groq") ||
    (env("NEBIUS_API_KEY") && "nebius") ||
    "gemini";

  const preset = PRESETS[name];
  // An explicit AI_* value always wins, so a changed model ID never needs a code change.
  return {
    label: preset.label,
    base: (env("AI_BASE_URL") || env("NEBIUS_BASE_URL") || preset.base).replace(/\/$/, ""),
    key: env("AI_API_KEY") || env(preset.keyEnv),
    model: env("AI_MODEL") || env("NEBIUS_MODEL") || preset.model,
    vision: env("AI_VISION_MODEL") || env("NEBIUS_VISION_MODEL") || preset.vision,
  };
}

export function aiConfigured(): boolean {
  const p = provider();
  return Boolean(p.key && p.model);
}

/** True when photos of notes and receipts can actually be read. */
export function visionConfigured(): boolean {
  const p = provider();
  return Boolean(p.key && p.vision);
}

/** For the setup notices on the desks. */
export function aiProviderLabel(): string {
  return provider().label;
}

type Message = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

class AiHttpError extends Error {
  constructor(
    public status: number,
    detail: string,
  ) {
    super(`AI request failed (${status}): ${detail}`);
  }
}

function stripThinking(text: string): string {
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const close = out.toLowerCase().lastIndexOf("</think>");
  if (close !== -1) out = out.slice(close + "</think>".length);
  return out.trim();
}

/** Why a call came back empty, so the desks can explain it instead of just failing. */
export type AiFailure = "not_configured" | "busy" | "failed";

type ChatOpts = { json?: boolean; model?: string; maxTokens?: number };

async function chatDetailed(
  messages: Message[],
  opts: ChatOpts = {},
): Promise<{ text: string | null; failure?: AiFailure }> {
  const p = provider();
  const model = opts.model || p.model;
  if (!p.key || !model) return { text: null, failure: "not_configured" };

  const attempt = async (jsonMode: boolean): Promise<string | null> => {
    const res = await fetch(`${p.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: opts.maxTokens ?? 3000,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(50_000),
      cache: "no-store",
    });
    if (!res.ok) throw new AiHttpError(res.status, (await res.text()).slice(0, 300));
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" ? stripThinking(text) : null;
  };

  try {
    return { text: await attempt(Boolean(opts.json)) };
  } catch (err) {
    // Some models reject response_format; retry once without it. Never retry timeouts.
    if (opts.json && err instanceof AiHttpError && (err.status === 400 || err.status === 422)) {
      try {
        return { text: await attempt(false) };
      } catch (err2) {
        console.error(err2 instanceof Error ? err2.message : err2);
        return { text: null, failure: failureOf(err2) };
      }
    }
    console.error(err instanceof Error ? err.message : err);
    return { text: null, failure: failureOf(err) };
  }
}

/** Free tiers push back with 429 (and sometimes 503) once the quota for the minute or day is used up. */
function failureOf(err: unknown): AiFailure {
  if (err instanceof AiHttpError && (err.status === 429 || err.status === 503)) return "busy";
  return "failed";
}

async function chat(messages: Message[], opts: ChatOpts = {}): Promise<string | null> {
  return (await chatDetailed(messages, opts)).text;
}

// ----------------------------------------------------------------- small helpers

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 600): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strs = (v: unknown, max = 40): string[] =>
  Array.isArray(v)
    ? v
        .map((x) => str(x))
        .filter(Boolean)
        .slice(0, max)
    : [];
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : NaN;
  return Number.isFinite(n) ? n : null;
};

function parseJson(text: string | null): Obj | null {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return isObj(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------- minutes

export function renderMinutesText(data: MinutesData, title: string): string {
  const out: string[] = [`# ${title}`, ""];
  if (data.summary) out.push("## Summary", data.summary, "");
  if (data.attendees.length || data.absent.length) {
    out.push("## Attendance");
    if (data.attendees.length) out.push(`- Present: ${data.attendees.join(", ")}`);
    if (data.absent.length) out.push(`- Absent: ${data.absent.join(", ")}`);
    out.push("");
  }
  if (data.agenda.length) out.push("## Agenda", ...data.agenda.map((a) => `- ${a}`), "");
  if (data.discussion.length) {
    out.push("## Discussion");
    for (const d of data.discussion) {
      out.push(`### ${d.topic}`, ...d.points.map((p) => `- ${p}`));
    }
    out.push("");
  }
  if (data.decisions.length) out.push("## Decisions", ...data.decisions.map((d) => `- ${d}`), "");
  if (data.action_items.length) {
    out.push("## Action items");
    for (const a of data.action_items) {
      const extra = [a.owner, a.due ? `due ${a.due}` : ""].filter(Boolean).join(", ");
      out.push(`- ${a.task}${extra ? ` (${extra})` : ""}`);
    }
    out.push("");
  }
  if (data.resolutions.length) {
    out.push("## Draft resolutions");
    for (const r of data.resolutions) {
      out.push(`### ${r.title}`);
      out.push(...r.whereas.map((w) => `- WHEREAS, ${w}`));
      out.push(...r.resolved.map((x) => `- RESOLVED, ${x}`));
    }
    out.push("");
  }
  const times = [data.call_to_order, data.adjourned].filter(Boolean).join(" ");
  if (times) out.push(times);
  return out.join("\n").trim();
}

function normalizeMinutes(raw: Obj): MinutesData {
  const discussion = Array.isArray(raw.discussion)
    ? raw.discussion
        .filter(isObj)
        .map((d) => ({ topic: str(d.topic, 200), points: strs(d.points, 20) }))
        .filter((d) => d.topic && d.points.length)
    : [];
  const actions = Array.isArray(raw.action_items)
    ? raw.action_items
        .filter(isObj)
        .map((a) => ({ task: str(a.task), owner: str(a.owner, 120) || undefined, due: str(a.due, 80) || undefined }))
        .filter((a) => a.task)
    : [];
  const resolutions = Array.isArray(raw.resolutions)
    ? raw.resolutions
        .filter(isObj)
        .map((r) => ({ title: str(r.title, 200), whereas: strs(r.whereas, 10), resolved: strs(r.resolved, 10) }))
        .filter((r) => r.title)
    : [];
  const budget = Array.isArray(raw.budget_items)
    ? raw.budget_items
        .filter(isObj)
        .map((b) => ({ description: str(b.description, 200), amount: num(b.amount) }))
        .filter((b) => b.description)
    : [];
  return {
    summary: str(raw.summary, 1200),
    attendees: strs(raw.attendees),
    absent: strs(raw.absent),
    call_to_order: str(raw.call_to_order, 120) || undefined,
    adjourned: str(raw.adjourned, 120) || undefined,
    agenda: strs(raw.agenda),
    discussion,
    decisions: strs(raw.decisions),
    action_items: actions,
    resolutions,
    budget_items: budget,
  };
}

function splitList(text: string): string[] {
  return text
    .split(/,|;|\band\b|\bat\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pulls peso amounts like "28k", "9.5k", "9,500" or "PHP 12000" out of one line of notes. */
function amountsIn(line: string): number[] {
  const out: number[] = [];
  const re = /(?:php|₱)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\s*[kK])?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const base = Number(m[1].replace(/,/g, ""));
    const value = m[2] ? base * 1000 : base;
    if (Number.isFinite(value) && value >= 500) out.push(value);
  }
  return out;
}

/** Plain, rule-based draft used when the AI is unavailable. The secretary edits it before submitting. */
function fallbackMinutes(raw: string): MinutesData {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const data: MinutesData = {
    summary: "",
    attendees: [],
    absent: [],
    agenda: [],
    discussion: [],
    decisions: [],
    action_items: [],
    resolutions: [],
    budget_items: [],
  };
  const notes: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const after = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : line;
    const clean = line.replace(/^\d+[).]\s*/, "");

    if (/^(present|dumalo|attendees?)\b/.test(lower)) {
      data.attendees.push(...splitList(after));
    } else if (/^(absent|wala)\b/.test(lower)) {
      data.absent.push(...splitList(after));
    } else if (/call(ed)? to order|nagsimula/.test(lower)) {
      data.call_to_order = clean;
    } else if (/adjourn|natapos|tinapos/.test(lower)) {
      data.adjourned = clean;
    } else if (/^agenda\b/.test(lower)) {
      data.agenda.push(...after.split(/\d+[).]/).map((s) => s.trim()).filter(Boolean));
    } else if (/\b(approv|aprub|motion|napagkasunduan|agreed|pinagtibay|resolved)/.test(lower)) {
      data.decisions.push(clean);
    } else {
      notes.push(clean);
    }

    const amounts = amountsIn(line);
    if (amounts.length && !/^(present|absent)/.test(lower)) {
      data.budget_items.push({ description: clean.slice(0, 160), amount: amounts[amounts.length - 1] });
    }
  }

  if (notes.length) data.discussion.push({ topic: "Notes", points: notes.slice(0, 20) });
  data.summary = data.decisions.length
    ? `The council made ${data.decisions.length} decision${data.decisions.length === 1 ? "" : "s"}. Review and edit this draft before submitting.`
    : "Draft prepared from the secretary's notes. Review and edit before submitting.";
  return data;
}

export async function generateMinutes(
  rawNotes: string,
  meta: { title: string; date: string },
): Promise<{ data: MinutesData; usedAI: boolean }> {
  const notes = rawNotes.slice(0, 12000);
  const system = [
    "You are the recording assistant of a Sangguniang Kabataan (SK) council in the Philippines.",
    "Turn the secretary's raw meeting notes into clear, formal minutes.",
    "The notes may be in English, Filipino or Taglish. Write in the same language mix as the notes.",
    "Rules: never invent names, numbers, decisions, dates or amounts. If something is not in the notes, leave it out.",
    "Keep names and titles as written (for example Kgd for Kagawad). Amounts are numbers in Philippine pesos.",
    "Only create a resolution when the notes show a formal decision (an approved motion) that would normally need one.",
    "Return ONLY a JSON object with exactly these keys:",
    '{"summary": string (2-3 sentences), "attendees": string[], "absent": string[], "call_to_order": string, "adjourned": string,',
    '"agenda": string[], "discussion": [{"topic": string, "points": string[]}], "decisions": string[],',
    '"action_items": [{"task": string, "owner": string, "due": string}],',
    '"resolutions": [{"title": string, "whereas": string[], "resolved": string[]}],',
    '"budget_items": [{"description": string, "amount": number | null}]}',
  ].join("\n");

  const reply = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: `Meeting: ${meta.title}\nDate: ${meta.date}\n\nRaw notes:\n"""\n${notes}\n"""` },
    ],
    { json: true, maxTokens: 3500 },
  );
  const parsed = parseJson(reply);
  if (parsed) {
    const data = normalizeMinutes(parsed);
    if (data.summary || data.decisions.length || data.discussion.length) {
      data.used_ai = true;
      return { data, usedAI: true };
    }
  }
  const data = fallbackMinutes(notes);
  data.used_ai = false;
  return { data, usedAI: false };
}

// ----------------------------------------------------------------- finance narrative

export async function narrateReport(
  report: Omit<ReportData, "lines" | "used_ai">,
): Promise<{ text: string; usedAI: boolean }> {
  const facts = {
    period: report.period,
    income_php: report.income,
    expenses_php: report.expense,
    net_php: report.net,
    fund_total_php: report.fund.total,
    committed_to_funded_projects_php: report.fund.committed,
    still_available_php: report.fund.available,
    spending_by_category: report.byCategory,
    spending_by_project: report.byProject,
    warnings: report.flags,
  };

  const reply = await chat(
    [
      {
        role: "system",
        content: [
          "You write the plain-language summary of a Sangguniang Kabataan financial report for the public, mostly young people.",
          "Write 2 short paragraphs (under 150 words in total) in simple English, then one short sentence in Filipino.",
          "Use ONLY the numbers in the data. Do not add, subtract or estimate anything. Write money as PHP 12,345.",
          "If there are warnings, mention them honestly and calmly. No headings, no bullet points.",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify(facts) },
    ],
    { maxTokens: 600 },
  );
  if (reply && reply.length > 40) return { text: reply, usedAI: true };

  const parts = [
    `From ${report.period.from} to ${report.period.to}, the SK received ${peso(report.income)} and spent ${peso(report.expense)}, ` +
      `a net change of ${peso(report.net)}.`,
  ];
  if (report.byProject.length) {
    parts.push(
      "Spending by project: " + report.byProject.map((p) => `${p.project} (${peso(p.spent)} of ${peso(p.budget)})`).join("; ") + ".",
    );
  }
  parts.push(
    `Of the ${peso(report.fund.total)} fund, ${peso(report.fund.committed)} is set aside for funded projects and ${peso(report.fund.available)} is still available.`,
  );
  if (report.flags.length) parts.push("Please note: " + report.flags.join(" "));
  return { text: parts.join("\n\n"), usedAI: false };
}

// ----------------------------------------------------------------- project proposal

export type IdeaInput = {
  title: string;
  description: string;
  category: string;
  est_budget: number;
  votes: number;
};

function templateProposal(idea: IdeaInput): Proposal {
  const total = idea.est_budget > 0 ? idea.est_budget : 10000;
  const share = (f: number) => Math.round(total * f);
  return {
    beneficiaries: "Kabataan of the barangay (to be confirmed by the council)",
    duration: "To be scheduled",
    objectives: [`Carry out "${idea.title}" as proposed by the youth.`, "Report results openly on Sinag."],
    activities: [
      { name: "Preparation", description: "Coordinate with the barangay, confirm the venue and recruit volunteers." },
      { name: "Main activity", description: idea.description.slice(0, 240) },
      { name: "Wrap-up", description: "Collect feedback, post photos and a final report." },
    ],
    budget_lines: [
      { item: "Materials and supplies", qty: 1, unit: "lot", unit_cost: share(0.5) },
      { item: "Food and refreshments", qty: 1, unit: "lot", unit_cost: share(0.2) },
      { item: "Venue, logistics and printing", qty: 1, unit: "lot", unit_cost: share(0.15) },
      { item: "Contingency", qty: 1, unit: "lot", unit_cost: total - share(0.5) - share(0.2) - share(0.15) },
    ],
    expected_outcomes: ["Activity completed within budget", "Youth participation recorded"],
    risks: ["Bad weather — prepare an alternate date or covered venue"],
    template: true,
  };
}

export function proposalTotal(p: Proposal): number {
  return p.budget_lines.reduce((sum, l) => sum + l.qty * l.unit_cost, 0);
}

export async function generateProposal(idea: IdeaInput): Promise<{ proposal: Proposal; usedAI: boolean }> {
  const reply = await chat(
    [
      {
        role: "system",
        content: [
          "You help a Sangguniang Kabataan council in the Philippines turn a youth-submitted idea into a short event proposal.",
          "Be practical and realistic for a barangay: local prices in Philippine pesos, small teams, volunteers.",
          "Do not invent facts about the community. Keep the total of budget lines close to the youth's estimated budget and never more than 10% above it.",
          "Return ONLY a JSON object with exactly these keys:",
          '{"beneficiaries": string, "duration": string, "objectives": string[] (2-4),',
          '"activities": [{"name": string, "description": string}] (2-5),',
          '"budget_lines": [{"item": string, "qty": number, "unit": string, "unit_cost": number}],',
          '"expected_outcomes": string[] (1-3), "risks": string[] (1-3)}',
        ].join("\n"),
      },
      {
        role: "user",
        content:
          `Idea: ${idea.title}\nCategory: ${idea.category}\nDescription: ${idea.description.slice(0, 1500)}\n` +
          `Estimated budget: PHP ${idea.est_budget}\nVotes received: ${idea.votes}`,
      },
    ],
    { json: true, maxTokens: 2500 },
  );

  const raw = parseJson(reply);
  if (raw) {
    const lines = Array.isArray(raw.budget_lines)
      ? raw.budget_lines
          .filter(isObj)
          .map((l) => ({
            item: str(l.item, 160),
            qty: Math.max(num(l.qty) ?? 1, 0),
            unit: str(l.unit, 40) || "lot",
            unit_cost: Math.max(num(l.unit_cost) ?? 0, 0),
          }))
          .filter((l) => l.item && l.qty > 0 && l.unit_cost > 0)
      : [];
    const activities = Array.isArray(raw.activities)
      ? raw.activities
          .filter(isObj)
          .map((a) => ({ name: str(a.name, 160), description: str(a.description, 400) }))
          .filter((a) => a.name)
      : [];
    if (lines.length && activities.length) {
      const proposal: Proposal = {
        beneficiaries: str(raw.beneficiaries, 300) || "Kabataan of the barangay",
        duration: str(raw.duration, 120) || "To be scheduled",
        objectives: strs(raw.objectives, 6),
        activities,
        budget_lines: lines,
        expected_outcomes: strs(raw.expected_outcomes, 6),
        risks: strs(raw.risks, 6),
        template: false,
      };
      return { proposal, usedAI: true };
    }
  }
  return { proposal: templateProposal(idea), usedAI: false };
}

// ----------------------------------------------------------------- project updates

export async function polishUpdate(text: string): Promise<string> {
  const reply = await chat(
    [
      {
        role: "system",
        content:
          "Rewrite the rough note below as a clear, friendly public project update of 2 to 4 sentences. " +
          "Keep every fact and number exactly. Add nothing new. Keep the same language as the note. Return only the update text.",
      },
      { role: "user", content: text.slice(0, 2000) },
    ],
    { maxTokens: 500 },
  );
  return reply && reply.length > 10 ? reply.slice(0, 2000) : text;
}

// ----------------------------------------------------------------- photo of handwritten notes

export async function transcribeImage(dataUrl: string): Promise<{ text?: string; error?: string }> {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) return { error: "That file type is not supported. Use a JPG or PNG photo." };
  if (dataUrl.length > 3_500_000) return { error: "The photo is too large. Try a smaller one." };

  const p = provider();
  if (!p.key || !p.vision) {
    return {
      error: p.key
        ? `${p.label} cannot read photos. The photo is saved with the minutes — type the notes in, or switch AI_PROVIDER to one that reads images.`
        : "Photo reading is not set up yet. Add an AI key, or type the notes in.",
    };
  }
  const model = p.vision;
  const reply = await chatDetailed(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Transcribe all handwritten and printed text in this photo of meeting notes exactly as written. " +
              "Keep line breaks and numbering. Do not summarize or correct. Output only the transcription.",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    { model, maxTokens: 2500 },
  );
  if (!reply.text) {
    return {
      error:
        reply.failure === "busy"
          ? "The free AI limit has been reached for now. Wait a minute and try again — the photo is already saved."
          : "Could not read the photo. Try a clearer picture, or type the notes in.",
    };
  }
  return { text: reply.text };
}

// ----------------------------------------------------------------- receipts

export type ReceiptReading = { amount?: number; date?: string; reference?: string; vendor?: string; description?: string };

/**
 * Reads a photo of a receipt so the treasurer does not have to retype it.
 * Only fills suggestions: the treasurer checks every field before saving.
 */
export async function readReceipt(dataUrl: string): Promise<{ reading?: ReceiptReading; error?: string }> {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) return { error: "Use a JPG or PNG photo." };
  if (dataUrl.length > 3_500_000) return { error: "The photo is too large." };
  const p = provider();
  if (!p.key || !p.vision) {
    return {
      error: p.key
        ? `${p.label} cannot read photos. The receipt is still attached to the entry — type the details in.`
        : "Receipt reading is not set up yet. Add an AI key, or type the details in.",
    };
  }
  const model = p.vision;
  const reply = await chatDetailed(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "This is a photo of a receipt or official receipt (OR) from the Philippines. " +
              'Reply with JSON only: {"total": number (the amount paid in pesos, no symbols), "date": "YYYY-MM-DD", ' +
              '"reference": "the OR or invoice number", "vendor": "store name", "items": "a short list of what was bought"}. ' +
              "Use null for anything you cannot read clearly. Do not guess.",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    { model, json: true, maxTokens: 600 },
  );
  const raw = parseJson(reply.text);
  if (!raw) {
    return {
      error:
        reply.failure === "busy"
          ? "The free AI limit has been reached for now. Wait a minute and try again — the receipt is already attached."
          : "Could not read this receipt. Type the details in.",
    };
  }

  const reading: ReceiptReading = {};
  const total = Number(String(raw.total ?? "").replace(/[^\d.]/g, ""));
  if (total > 0 && total < 100_000_000) reading.amount = Math.round(total * 100) / 100;
  if (typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) reading.date = raw.date;
  if (typeof raw.reference === "string" && raw.reference.trim()) reading.reference = raw.reference.trim().slice(0, 60);
  if (typeof raw.vendor === "string" && raw.vendor.trim()) reading.vendor = raw.vendor.trim().slice(0, 80);
  const items = Array.isArray(raw.items) ? raw.items.join(", ") : raw.items;
  if (typeof items === "string" && items.trim()) reading.description = items.trim().slice(0, 160);
  return { reading };
}
