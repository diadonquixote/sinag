// Records the Sinag demo video: walks the site with demo data, draws arrows and captions,
// captures frames and assembles an MP4 with ffmpeg.
//
//   BASE_URL=http://localhost:3100 DATABASE_URL=... SEED_PASSWORD=... node scripts/demo-video/record.mjs
//
// Frames are captured deterministically (one screenshot per animation step, one long frame
// per pause), so the video is smooth and sharp no matter how fast the machine is.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let chromium;
try { ({ chromium } = await import("@playwright/test")); } catch { ({ chromium } = await import("playwright")); }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OVERLAY = fs.readFileSync(path.join(HERE, "overlay.js"), "utf8");
const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = path.resolve(process.env.OUT_DIR || "demo-out");
const PASSWORD = process.env.SEED_PASSWORD || "";
const ORG = process.env.NEXT_PUBLIC_ORG_NAME || "Sangguniang Kabataan";
const ONLY = process.env.ONLY || ""; // run one scene while testing
const W = 1440, H = 810, SCALE = 4 / 3, FPS = 30;
const FRAMES = path.join(OUT, "frames");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });
const log = (...a) => { const s = a.join(" "); console.log(s); fs.appendFileSync(path.join(OUT, "log.txt"), s + "\n"); };

const HIDE_CSS = `
  div[role="note"].bg-flag-red, div[role="note"].bg-ink { display: none !important; }
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
  html { scroll-behavior: auto !important; }
  nextjs-portal { display: none !important; }
`;

function hideScript() {
  return `(() => { const add = () => { if (document.getElementById("__demo_css")) return; const s = document.createElement("style"); s.id = "__demo_css"; s.textContent = ${JSON.stringify(HIDE_CSS)}; (document.head || document.documentElement).appendChild(s); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add(); })();`;
}

// ------------------------------------------------------------------ frame capture
let n = 0;
const list = [];
async function shot(page, dur = 1 / FPS) {
  const file = `f${String(++n).padStart(5, "0")}.jpg`;
  await page.screenshot({ path: path.join(FRAMES, file), type: "jpeg", quality: 90 });
  list.push([file, dur]);
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ page helpers
let cur = { x: W * 0.62, y: H * 0.62 };
let cursorOn = false;

async function ensure(page) {
  await page.evaluate(`${OVERLAY}; installDemoOverlay();`);
  await page.evaluate(([x, y, on]) => window.__demo.cursor(x, y, on, false), [cur.x, cur.y, cursorOn]);
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(250);
  await ensure(page);
}

async function veil(page, from, to, frames = 7) {
  for (let i = 1; i <= frames; i++) {
    await page.evaluate((p) => window.__demo.veil(p), from + (to - from) * (i / frames));
    await shot(page);
  }
}

/** Fade to white, go to a page, fade back in. */
async function go(page, url, { fade = true } = {}) {
  if (fade && list.length) { await ensure(page); await veil(page, 0, 1); }
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await settle(page);
  if (fade && list.length) { await page.evaluate(() => window.__demo.veil(1)); await veil(page, 1, 0); }
}

async function pick(cands) {
  for (const c of [].concat(cands)) {
    if (!c) continue;
    const f = c.first();
    if (await f.isVisible().catch(() => false)) return f;
  }
  return null;
}

async function scrollTo(page, loc, place = 0.42) {
  const b = await loc.boundingBox();
  if (!b) return;
  const y0 = await page.evaluate(() => window.scrollY);
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  let target = y0 + b.y + b.height / 2 - H * place;
  if (b.height > H * 0.55) target = y0 + b.y - 110;
  target = Math.max(0, Math.min(maxY, target));
  if (Math.abs(target - y0) < 6) return;
  const steps = Math.round(Math.min(30, Math.max(12, Math.abs(target - y0) / 45)));
  for (let i = 1; i <= steps; i++) {
    const y = y0 + (target - y0) * ease(i / steps);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await shot(page);
  }
}

/** Highlight an element with an arrow and a caption. */
async function point(page, cands, title, sub, { hold = 2.8, place } = {}) {
  const loc = await pick(cands);
  if (!loc) { log("  skip (not found):", title); return false; }
  await scrollTo(page, loc, place);
  const r = await loc.boundingBox();
  if (!r) { log("  skip (no box):", title); return false; }
  await ensure(page);
  const IN = 16;
  for (let i = 1; i <= IN; i++) {
    await page.evaluate(([r, t, s, p]) => window.__demo.callout(r, t, s, p), [r, title, sub, i / IN]);
    await shot(page);
  }
  await shot(page, hold);
  for (let i = 5; i >= 0; i--) {
    await page.evaluate(([r, t, s, p]) => window.__demo.callout(r, t, s, p), [r, title, sub, i / 6]);
    await shot(page);
  }
  await page.evaluate(() => window.__demo.clear());
  log("  ok:", title);
  return true;
}

async function moveCursor(page, x, y, frames = 18) {
  const a = { ...cur };
  cursorOn = true;
  for (let i = 1; i <= frames; i++) {
    const k = ease(i / frames);
    cur = { x: a.x + (x - a.x) * k, y: a.y + (y - a.y) * k };
    await page.evaluate(([x, y]) => window.__demo.cursor(x, y, true, false), [cur.x, cur.y]);
    await shot(page);
  }
}

/** Move the cursor to an element and click it (the click is real). */
async function clickOn(page, cands, { place = 0.5 } = {}) {
  const loc = await pick(cands);
  if (!loc) { log("  skip click (not found)"); return false; }
  await scrollTo(page, loc, place);
  const b = await loc.boundingBox();
  await ensure(page);
  await moveCursor(page, b.x + Math.min(b.width / 2, 70), b.y + b.height / 2);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(([x, y]) => window.__demo.cursor(x, y, true, true), [cur.x, cur.y]);
    await shot(page);
  }
  await page.evaluate(([x, y]) => window.__demo.cursor(x, y, true, false), [cur.x, cur.y]);
  await shot(page, 0.15);
  const before = page.url();
  await loc.click();
  await page.waitForLoadState("networkidle").catch(() => {});
  if (page.url() !== before) await settle(page); else { await sleep(400); await ensure(page); }
  await shot(page, 0.5);
  cursorOn = false;
  await ensure(page);
  return true;
}

/** Type into a field a few characters per frame. */
async function typeInto(page, cands, text, { secret = false } = {}) {
  const loc = await pick(cands);
  if (!loc) { log("  skip typing (not found)"); return; }
  await scrollTo(page, loc, 0.45);
  const b = await loc.boundingBox();
  await ensure(page);
  await moveCursor(page, b.x + 40, b.y + b.height / 2, 12);
  await loc.click();
  cursorOn = false;
  await ensure(page);
  const step = secret ? 2 : 2;
  for (let i = step; i < text.length + step; i += step) {
    await loc.fill(text.slice(0, i));
    await shot(page);
    await shot(page);
  }
  await shot(page, 0.4);
}

async function card(page, title, sub, foot, { hold = 2.6, mark = false } = {}) {
  await ensure(page);
  const F = 14;
  for (let i = 1; i <= F; i++) { await page.evaluate(([t, s, f, p, m]) => window.__demo.card(t, s, f, p, m), [title, sub, foot, i / F, mark]); await shot(page); }
  await shot(page, hold);
  for (let i = F - 1; i >= 0; i--) { await page.evaluate(([t, s, f, p, m]) => window.__demo.card(t, s, f, p, m), [title, sub, foot, i / F, mark]); await shot(page); }
}

async function login(page, email, { show = false, then } = {}) {
  await page.context().clearCookies();
  if (show) {
    await go(page, "/login");
    await typeInto(page, page.getByLabel("Email", { exact: true }), email);
    await typeInto(page, page.getByLabel("Password", { exact: true }), PASSWORD, { secret: true });
    await clickOn(page, page.getByRole("button", { name: "Log in" }));
    return;
  }
  // Off camera: log in, then fade to the desk.
  await ensure(page);
  await veil(page, 0, 1);
  await page.goto(BASE + "/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => u.pathname !== "/login", { timeout: 15000 }).catch(() => {});
  if (then) await page.goto(BASE + then);
  await settle(page);
  await page.evaluate(() => window.__demo.veil(1));
  await veil(page, 1, 0);
}

// Climbs from an element to the nearest card-like box around it.
const box = (loc) => loc.locator('xpath=ancestor-or-self::*[contains(concat(" ",normalize-space(@class)," ")," card ") or self::li or self::article][1]');

// ------------------------------------------------------------------ extra demo data
async function addDemoExtras(browser) {
  if (!process.env.DATABASE_URL) { log("no DATABASE_URL: skipping receipts and extras"); return; }
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  const page = await browser.newPage({ viewport: { width: 420, height: 620 }, deviceScaleFactor: 1.5 });
  await sql`insert into transactions (project_id, kind, amount, description, category, tx_date, reference, created_by, voided_at, void_reason)
            values (3, 'expense', 850, 'Tarpaulin printing', 'Printing', current_date - 2, 'OR-0430', 3, now(), 'Entered twice; the correct entry is OR-0433')`;
  await sql`insert into transactions (project_id, kind, amount, description, category, tx_date, reference, created_by)
            values (3, 'expense', 850, 'Tarpaulin printing', 'Printing', current_date - 2, 'OR-0433', 3)`;
  await sql`update minutes set data = data - 'used_ai'`;
  const rows = await sql`select id, amount::text as amount, description, reference, tx_date::text as d from transactions where kind = 'expense' and voided_at is null order by id`;
  for (const t of rows) {
    const html = `<!doctype html><html><body style="margin:0;background:#e7e2d6;display:flex;align-items:center;justify-content:center;height:620px;font-family:'Courier New',monospace">
      <div style="width:330px;background:#fffdf6;padding:26px 24px;box-shadow:0 6px 18px rgba(0,0,0,.18);transform:rotate(-1.2deg);color:#222">
        <div style="text-align:center;font-weight:700;font-size:17px">SAMPLE HARDWARE &amp; GENERAL MERCHANDISE</div>
        <div style="text-align:center;font-size:12px;margin-top:4px">Poblacion, Sample Town · TIN 000-000-000-000</div>
        <div style="text-align:center;font-weight:700;margin:14px 0 4px;font-size:15px">OFFICIAL RECEIPT</div>
        <div style="display:flex;justify-content:space-between;font-size:13px"><span>No. ${t.reference ?? ""}</span><span>${t.d}</span></div>
        <div style="font-size:13px;margin-top:6px">Sold to: Sangguniang Kabataan</div>
        <div style="border-top:1px dashed #999;margin:12px 0"></div>
        <div style="display:flex;justify-content:space-between;font-size:14px"><span>${t.description}</span><span>${Number(t.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
        <div style="border-top:1px dashed #999;margin:12px 0"></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL</span><span>PHP ${Number(t.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
        <div style="margin-top:26px;font-size:12px;text-align:center;color:#555">SAMPLE ONLY · NOT A REAL RECEIPT</div>
        <div style="margin-top:18px;font-size:13px;text-align:right;font-style:italic">Received by: ____________</div>
      </div></body></html>`;
    await page.setContent(html);
    const jpg = await page.screenshot({ type: "jpeg", quality: 85 });
    await sql`insert into transaction_receipts (transaction_id, data, type, is_public, created_by) values (${t.id}, ${jpg}, 'image/jpeg', true, 3)`;
  }
  await page.close();
  await sql`insert into users (name, email, password_hash, role, barangay, status, request_note, term)
            values ('Carlo Mercado', 'carlo.mercado@example.ph', crypt(${PASSWORD || "x"}, gen_salt('bf', 6)), 'kagawad', 'Demo Barangay', 'pending',
                    'Elected SK Kagawad in 2023. The Chairperson and the barangay secretary can confirm.', '2023 to 2026')
            on conflict do nothing`;
  await sql.end();
  log("demo extras added: receipts for", rows.length, "entries, a voided entry, a pending request");
}

// ------------------------------------------------------------------ phone shots
async function phoneShots(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, bypassCSP: true });
  await ctx.addInitScript(hideScript());
  const p = await ctx.newPage();
  const out = [];
  for (const url of ["/", "/funds", "/projects/1"]) {
    await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.addStyleTag({ content: HIDE_CSS }).catch(() => {});
    await sleep(300);
    out.push((await p.screenshot({ type: "jpeg", quality: 88 })).toString("base64"));
  }
  await ctx.close();
  return out;
}

// ------------------------------------------------------------------ the video
const scenes = {
  async intro(page) {
    await go(page, "/", { fade: false });
    await card(page, "Sinag", "A public record for Sangguniang Kabataan councils.\nWhat the council decides, schedules and spends, open to everyone.", "Product demo", { hold: 3.2, mark: true });
  },

  async home(page) {
    await point(page, page.locator("header").getByText(ORG, { exact: true }), "Whose records these are", "The council's name stays in view on every page.");
    await point(page, page.locator('header nav[aria-label="Main"]'), "Everything here is public", "Bulletin, projects, calendar, funds and the council. No account needed.");
    await point(page, page.locator('header a[href^="/lang"]'), "English or Filipino", "One tap switches every public page.");
    await point(page, page.getByText(/^Last update /), "Always shows how current it is", "Visitors can see when the council last posted.");
    await point(page, page.locator("main dl").first(), "Numbers computed from the records", "Projects, completed work, published records and pesos spent are added up automatically, never typed in.");
    await point(page, box(page.locator('main a[href^="/projects/"]').first()), "What's coming up", "The next activities, with dates and places.");
  },

  async bulletin(page) {
    await go(page, "/feed");
    await point(page, box(page.locator('main a[href^="/feed/minutes/"]').first()), "The public bulletin", "Minutes of every session, financial reports and project updates in one feed.");
    await clickOn(page, page.locator('main a[href^="/feed/minutes/"]'));
    await point(page, page.getByText(/Approved by/), "Approved before it goes up", "Each record shows who wrote it and which Chairperson approved it.", { place: 0.3 });
    await point(page, page.getByRole("heading", { name: /Decisions/ }), "Decisions on the record", "Attendance, agenda, decisions and action items, written so anyone can follow.", { place: 0.35 });
    await go(page, "/feed/reports/1");
    await point(page, page.locator("main h1"), "Financial reports", "Income and spending for the period, every line listed.");
    await point(page, page.locator("main table").first(), "Every peso, line by line", "Each figure comes straight from the ledger.");
  },

  async projects(page) {
    await go(page, "/projects");
    await point(page, box(page.locator('main [role="progressbar"]').first()), "Projects the council agreed on", "Each one shows its budget, its status and how much has been spent.");
    await clickOn(page, page.getByRole("link", { name: /Brigada Eskwela/ }));
    await point(page, page.locator('main [role="progressbar"]'), "Budget used so far", "Spending against the approved budget, from the ledger.");
    await point(page, box(page.getByText(/All classrooms repainted/)), "Updates from the field", "The kagawad who leads the project posts progress as it happens.");
  },

  async calendar(page) {
    await go(page, "/calendar");
    await point(page, page.locator("main div.grid.grid-cols-7").last(), "The council's calendar", "Every scheduled activity, month by month.", { place: 0.5 });
  },

  async funds(page) {
    await go(page, "/funds");
    await point(page, page.locator("main div.grid").filter({ hasText: "Still available" }).first(), "Where the money stands", "Total fund, income, spent, committed and still available, exact to the centavo.");
    await point(page, box(page.locator('main [role="progressbar"]').first()), "Budget against spending", "For every project, side by side.");
    await point(page, page.locator('main a[href^="/api/receipt/"]'), "Every expense has its receipt", "Tap View to see the photo of the official receipt.", { place: 0.45 });
    const href = await page.locator('main a[href^="/api/receipt/"]').first().getAttribute("href").catch(() => null);
    if (href) {
      await go(page, href);
      await point(page, page.locator("img"), "The actual receipt", "Location data and hidden details are removed before it is stored.");
      await go(page, "/funds");
    }
    await point(page, page.locator("main tr").filter({ hasText: "Voided" }), "Mistakes are voided, never deleted", "The entry stays on the record, struck through, with the reason.", { place: 0.45 });
  },

  async council(page) {
    await go(page, "/council");
    await point(page, page.locator('main a[href^="/council/"]').first(), "The people you elected", "The council's organization chart. Tap anyone to see their profile.");
    await clickOn(page, page.locator('main a[href^="/council/"]'));
    await point(page, page.getByRole("heading", { name: /Credentials/ }).locator("xpath=.."), "Credentials and contributions", "What each official brings, and what they have done on record.", { place: 0.4 });
  },

  async language(page) {
    await go(page, "/");
    await clickOn(page, page.locator('header a[href^="/lang"]'));
    await point(page, page.locator("main h1"), "Nasa Filipino rin", "Every public page, in Filipino or English.");
    await page.goto(BASE + "/lang?to=en&next=%2F");
    await settle(page);
  },

  async phone(page, phones) {
    if (!phones || !phones.length) return;
    const imgs = phones.map((b) => `<div class="ph"><img src="data:image/jpeg;base64,${b}"></div>`).join("");
    await page.setContent(`<!doctype html><html><head><style>
      body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(60rem 36rem at 50% 40%,#FFF8D6 0%,#fff 65%);font-family:system-ui,sans-serif}
      h2{margin:0 0 28px;font:700 40px Georgia,serif;color:#0038A8;letter-spacing:-.01em}
      p{margin:-14px 0 30px;color:#334155;font-size:19px}
      .row{display:flex;gap:46px}
      .ph{width:262px;height:566px;border-radius:40px;border:11px solid #0A1A3F;overflow:hidden;background:#fff;box-shadow:0 26px 50px rgba(10,26,63,.28);opacity:0;transform:translateY(40px)}
      .ph img{width:100%;display:block}
    </style></head><body><h2>Made for phones</h2><p>Most kabataan will only ever see it on a phone.</p><div class="row">${imgs}</div></body></html>`);
    await sleep(200);
    await ensure(page);
    const F = 26;
    for (let i = 1; i <= F; i++) {
      await page.evaluate((p) => {
        document.querySelectorAll(".ph").forEach((el, k) => {
          const t = Math.max(0, Math.min(1, p * 1.6 - k * 0.3));
          const e = 1 - Math.pow(1 - t, 3);
          el.style.opacity = String(e);
          el.style.transform = `translateY(${(1 - e) * 40}px)`;
        });
      }, i / F);
      await shot(page);
    }
    await shot(page, 3.2);
  },

  async officials(page) {
    await go(page, "/");
    await card(page, "For SK officials", "Behind a login, each official has a desk for their job.\nOnly verified, elected officials get an account.", "", { hold: 2.6 });
    await go(page, "/request-access");
    await point(page, page.locator("main form"), "Officials ask for an account", "They give their position and how the site admin can confirm who they are.", { place: 0.45 });
  },

  async admin(page) {
    await login(page, "admin@sinag.demo", { show: true });
    await point(page, page.locator("main li").filter({ hasText: "Carlo Mercado" }), "The admin checks every request", "Compared against the list of elected officials, then approved or turned down.");
    await point(page, page.locator("main li").filter({ hasText: "Carlo Mercado" }).getByRole("button", { name: /Approve/ }), "One click to approve", "The admin cannot publish anything. They only decide who gets in.");
  },

  async secretary(page) {
    await login(page, "secretary@sinag.demo");
    // A setup notice for whoever runs the site, not a feature: leave it out of the video.
    await page.evaluate(() => {
      document.querySelectorAll('main [role="note"]').forEach((el) => { if (el.textContent.includes("GEMINI_API_KEY")) el.remove(); });
    });
    await clickOn(page, page.getByRole("button", { name: /Use sample notes/ }), { place: 0.6 });
    await point(page, page.getByRole("button", { name: "Turn into minutes" }).locator("xpath=ancestor::form[1]"), "Meeting notes in, minutes out", "The secretary types the notes or adds photos of the handwritten pages, which are kept as the original.", { place: 0.45 });
  },

  async treasurer(page) {
    await login(page, "treasurer@sinag.demo");
    await point(page, page.getByRole("heading", { name: "Record an entry" }).locator("xpath=ancestor::*[self::form or self::section or contains(@class,'card')][1]"), "Record every peso", "Amount, purpose, project and the official receipt number.", { place: 0.45 });
    await point(page, page.getByRole("heading", { name: "Generate a financial report" }).locator("xpath=ancestor::*[self::form or self::section or contains(@class,'card')][1]"), "Reports in one click", "Every number is computed from the ledger, with warnings for overspending and missing receipts.", { place: 0.45 });
  },

  async chair(page) {
    await login(page, "chair@sinag.demo");
    const publish = page.getByRole("button", { name: "Publish" });
    await point(page, [page.locator("main li").filter({ has: publish }), box(publish.first())], "Nothing goes up without approval", "Minutes and reports wait here until the Chairperson reviews them.");
    await clickOn(page, publish);
    await point(page, page.getByRole("status"), "Published", "It is now on the public bulletin, with the Chairperson's name on it.", { hold: 2.2 });
    await go(page, "/dashboard/chair");
    await point(page, page.getByRole("heading", { name: "Recent activity" }).locator("xpath=.."), "An audit trail", "Every important action is logged: who did what, and when.", { place: 0.4 });
    await page.context().clearCookies();
  },

  async outro(page) {
    await go(page, "/");
    await card(page, "Sinag", "sinag-v1.vercel.app", "Open source  ·  English and Filipino  ·  Made for SK councils", { hold: 4.2, mark: true });
  },
};

// ------------------------------------------------------------------ run
const browser = await chromium.launch();
try {
  await addDemoExtras(browser);
  const phones = await phoneShots(browser).catch((e) => { log("phone shots failed:", e.message); return []; });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, bypassCSP: true });
  await ctx.addInitScript(hideScript());
  const page = await ctx.newPage();
  for (const [name, fn] of Object.entries(scenes)) {
    if (ONLY && !ONLY.split(",").includes(name) && name !== "intro") continue;
    log(`scene: ${name}`);
    try { await fn(page, phones); }
    catch (e) { log(`  scene ${name} failed: ${e.message.split("\n")[0]}`); try { await page.goto(BASE + "/"); await settle(page); } catch {} }
  }
} finally {
  await browser.close();
}

// ------------------------------------------------------------------ assemble
const concat = list.map(([f, d]) => `file 'frames/${f}'\nduration ${d.toFixed(4)}`).join("\n") + `\nfile 'frames/${list.at(-1)[0]}'\n`;
fs.writeFileSync(path.join(OUT, "frames.txt"), concat);
const total = list.reduce((s, [, d]) => s + d, 0);
log(`frames: ${list.length}, length: ${total.toFixed(1)} s`);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "frames.txt",
  "-vf", "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
  "-movflags", "+faststart", "sinag-demo.mp4"], { cwd: OUT, stdio: "inherit" });
log("video:", path.join(OUT, "sinag-demo.mp4"));
