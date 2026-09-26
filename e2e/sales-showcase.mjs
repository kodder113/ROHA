/**
 * ROHA sales showcase — LOCAL SUPABASE ONLY. Synthetic data.
 *
 *   npx supabase db reset && npm run build && npm run start
 *   SUPABASE_SERVICE_ROLE_KEY=<local key> node e2e/sales-showcase.mjs
 *
 * Builds a clearly labeled sample organization on a local database, using
 * assessment Version 2 (published locally only), with two synthetic campaigns
 * whose results tell a realistic story, and captures sales screenshots.
 *
 * The organization is flagged `is_demo`, so every application page shows the
 * "Demonstration" ribbon. No real organization, person or result is depicted.
 * Refuses to run against anything other than a local database.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const DB_URL = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const OUT = process.env.SHOWCASE_OUT ?? "e2e/screenshots/showcase";
const NARRATIVE = "e2e/showcase/sample-narrative.json";
const OWNER = "sample-owner@roha.test";
const PASSWORD = "Str0ngPassw0rd!";

if (!/@(127\.0\.0\.1|localhost):/.test(DB_URL) || !/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) {
  throw new Error("sales-showcase.mjs only runs against a local database and app.");
}
mkdirSync(OUT, { recursive: true });

const db = new pg.Client({ connectionString: DB_URL });
await db.connect();
const q = async (text, params = []) => (await db.query(text, params)).rows;
const one = async (text, params = []) => (await q(text, params))[0];

// Deterministic pseudo-random numbers (mulberry32) so the story is reproducible.
let seed = 20260926;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ---------------------------------------------------------------------------
// 1. Version 2 available locally
// ---------------------------------------------------------------------------
if (!(await one("select 1 as x from assessment_versions where version_number = 2"))) {
  execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -q -f supabase/drafts/assessment_v2_draft.sql`, { stdio: "ignore" });
}
if ((await one("select status from assessment_versions where version_number = 2")).status === "draft") {
  await q(`select public.publish_assessment_release(
      (select id from assessment_versions where version_number = 2),
      (select id from scoring_rule_versions where version_number = 2),
      (select id from ai_report_instructions where version_number = 2), true, null, 'showcase@local')`);
}
const version = await one("select id from assessment_versions where version_number = 2 and status = 'published'");
const rules = await one("select id from scoring_rule_versions where version_number = 2 and status = 'published'");
const questions = await q(
  `select q.id, q.key, q.allow_na, d.key as dim from questions q join dimensions d on d.id = q.dimension_id where q.version_id = $1 order by d.sort_order, q.sort_order`,
  [version.id],
);
const qualitative = await q("select id, key from qualitative_questions where version_id = $1", [version.id]);

// ---------------------------------------------------------------------------
// 2. The story (scores on the 0–100 index; converted to 1–5 ratings)
// ---------------------------------------------------------------------------
// Culture is a clear strength; operations — above all coordination between
// departments — is the main pain point; leaders set direction but do not explain
// what priorities mean for teams (LE5); ideas are welcomed but not enabled (SI4
// vs SI5); acknowledgement lags (EE2). Patient Services is the hotspot. Between
// the baseline and the follow-up, operations improved after a coordination
// initiative, while the leadership-communication gap persisted.
const CURRENT = {
  follow: {
    LE1: 64, LE2: 66, LE3: 50, LE4: 58, LE5: 36,
    OC1: 78, OC2: 76, OC3: 62, OC4: 68, OC5: 70,
    EE1: 84, EE2: 44, EE3: 56, EE4: 80, EE5: 66,
    OE1: 44, OE2: 54, OE3: 34, OE4: 46, OE5: 60,
    SI1: 68, SI2: 70, SI3: 52, SI4: 64, SI5: 34,
  },
};
CURRENT.base = Object.fromEntries(
  Object.entries(CURRENT.follow).map(([k, v]) => [k, v - (k.startsWith("OE") ? (k === "OE3" ? 20 : 12) : k.startsWith("OC") ? 1 : 2)]),
);
const DESIRED = (key) => ({ EE5: 80, SI3: 84, OE5: 84, LE3: 86 })[key] ?? 90;
const DIM = { leadership: "LE", culture: "OC", engagement: "EE", operations: "OE", strategy_innovation: "SI" };
const DEPTS = [
  { label: "Clinical Operations", n: [34, 38], off: { OE: -8, LE: -2 } },
  { label: "Patient Services", n: [22, 24], off: { LE: -20, OE: -10, EE: -8, SI: -6 } },
  { label: "Finance", n: [13, 14], off: { LE: 6, OE: 8, SI: -6 } },
  { label: "Information Technology", n: [11, 12], off: { SI: 10, OE: -4, EE: 4 } },
  { label: "Facilities", n: [10, 11], off: { EE: -8, SI: -8, OC: -4 } },
  { label: "Human Resources", n: [8, 9], off: { OC: 4, EE: 4, LE: 4 } },
  { label: "Executive Office", n: [4, 4], off: { LE: 12, SI: 10 } }, // fewer than 5: always hidden
];
const LOCATIONS = ["Main Campus", "North Clinic", "Remote"];
const LEVELS = ["Individual contributor", "Supervisor / team lead", "Manager", "Senior leader"];
const TENURE = ["lt_1", "1_2", "3_5", "6_10", "gt_10"];
const COMMENTS = {
  does_well: [
    "People genuinely look out for each other, especially on difficult days.",
    "My team is supportive and we trust each other.",
    "We care about the people we serve, and it shows.",
    "Colleagues treat each other with respect regardless of role.",
    "Onboarding was welcoming and my coworkers made time to help.",
    "When something goes wrong, we talk about how to fix it instead of blaming people.",
    "The mission is clear to everyone on the front line.",
    "Strong teamwork inside departments.",
  ],
  makes_harder: [
    "Hand-offs between departments get lost; nobody owns the request once it leaves our team.",
    "We hear about new priorities, but not what they mean for our daily work.",
    "Approvals take too long and require the same information several times.",
    "Different departments use different systems that do not talk to each other.",
    "Good ideas get a positive response and then nothing happens.",
    "It is not clear who to go to when a problem crosses teams.",
    "Extra effort is rarely acknowledged.",
    "Scheduling changes are communicated late.",
  ],
  recommend: [
    "Hold a short cross-department huddle each week for shared work.",
    "Have leaders explain what each new priority means for our team, not just announce it.",
    "Give small improvement ideas a time and a budget to be tested.",
    "Name one owner for every request that crosses departments.",
    "Recognize good work more often and more specifically.",
    "Simplify the approval process for routine requests.",
  ],
};

const toRating = (score) => Math.max(1, Math.min(5, Math.round(1 + Math.max(0, Math.min(100, score)) / 25)));

// ---------------------------------------------------------------------------
// 3. Sample organization, owner and campaigns
// ---------------------------------------------------------------------------
await q("delete from organizations where slug = 'sample-crestline'");
const adminHeaders = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};
let ownerId = (await one("select id from auth.users where email = $1", [OWNER]))?.id;
if (!ownerId) {
  const res = await fetch("http://127.0.0.1:54321/auth/v1/admin/users", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email: OWNER, password: PASSWORD, email_confirm: true, user_metadata: { full_name: "Sample Owner" } }),
  });
  if (!res.ok) throw new Error(`Could not create the sample owner: ${await res.text()}`);
  ownerId = (await res.json()).id;
}
const org = await one(
  `insert into organizations (name, slug, industry, employee_count_range, country, region, contact_name, contact_email, contact_title, is_demo, is_pilot, pilot_notes)
   values ('Crestline Health Partners (Sample Organization)', 'sample-crestline', 'Healthcare', '100-249', 'United States', 'Sample',
           'Sample Owner', $1, 'Chief Executive Officer', true, false,
           'Fictional organization with synthetic data, used for product screenshots. Does not describe a real organization.')
   returning id`,
  [OWNER],
);
await q("insert into organization_members (org_id, user_id, role_key) values ($1, $2, 'owner')", [org.id, ownerId]);
await q(
  "insert into subscriptions (org_id, plan_id, status, source, notes) select $1, id, 'active', 'complimentary', 'Sample organization' from plans where key = 'enterprise'",
  [org.id],
);

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const day = 86_400_000;
const rounds = [
  { key: "base", name: "Spring 2026 Organizational Health Baseline", close: new Date(today.getTime() - 185 * day), expected: 140 },
  { key: "follow", name: "Fall 2026 Organizational Health Follow-up", close: new Date(today.getTime() - 6 * day), expected: 140 },
];
const campaignIds = {};
for (const [ri, round] of rounds.entries()) {
  const c = await one(
    `insert into campaigns (org_id, assessment_version_id, scoring_rule_version_id, name, description, status, privacy_mode, opens_at, closes_at, expected_participants, response_limit)
     values ($1, $2, $3, $4, 'Sample campaign populated with synthetic responses.', 'draft', 'confidential', $5, $6, $7, 1000) returning id`,
    [org.id, version.id, rules.id, round.name, new Date(round.close.getTime() - 21 * day), round.close, round.expected],
  );
  campaignIds[round.key] = c.id;
  const opt = async (kind, labels) => {
    const ids = [];
    for (const [i, label] of labels.entries()) {
      ids.push((await one("insert into campaign_segment_options (campaign_id, kind, label, sort_order) values ($1, $2, $3, $4) returning id", [c.id, kind, label, i + 1])).id);
    }
    return ids;
  };
  const deptIds = await opt("department", DEPTS.map((d) => d.label));
  const locIds = await opt("location", LOCATIONS);
  const lvlIds = await opt("level", LEVELS);
  await q("update campaigns set status = 'open' where id = $1", [c.id]);

  let count = 0;
  for (const [di, dept] of DEPTS.entries()) {
    for (let n = 0; n < dept.n[ri]; n++) {
      const person = normal() * 7;
      const level = rand() < 0.62 ? 0 : rand() < 0.6 ? 1 : rand() < 0.75 ? 2 : 3;
      const resp = await one(
        `insert into responses (campaign_id, org_id, assessment_version_id, department_option_id, location_option_id, level_option_id, tenure_range, is_synthetic)
         values ($1, $2, $3, $4, $5, $6, $7, true) returning id`,
        [c.id, org.id, version.id, deptIds[di], rand() < 0.92 ? pick(locIds) : null, rand() < 0.9 ? lvlIds[level] : null, rand() < 0.9 ? pick(TENURE) : null],
      );
      count++;
      // About 2% answer N/A to both SI3 and SI5 (counted in four dimensions only).
      const bothSiNa = rand() < 0.02;
      const rows = questions.map((item) => {
        const code = DIM[item.dim];
        const na = item.allow_na && (bothSiNa && (item.key === "SI3" || item.key === "SI5") ? true : rand() < 0.04);
        const cur = CURRENT[round.key][item.key] + (dept.off[code] ?? 0) + person + normal() * 17;
        const des = DESIRED(item.key) + normal() * 10;
        return na ? [resp.id, item.id, null, true, null, true] : [resp.id, item.id, toRating(cur), false, toRating(des), false];
      });
      const values = rows.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(",");
      await q(`insert into response_items (response_id, question_id, current_value, current_na, desired_value, desired_na) values ${values}`, rows.flat());
    }
  }
  // Comments are stored separately from responses, as in production.
  for (const qq of qualitative) {
    for (let i = 0; i < Math.round(count * 0.35); i++) {
      await q(
        "insert into response_comments (campaign_id, org_id, qualitative_question_id, body, consent_to_quote, is_synthetic) values ($1, $2, $3, $4, $5, true)",
        [c.id, org.id, qq.id, pick(COMMENTS[qq.key]), rand() < 0.5],
      );
    }
  }
  for (let d = 21; d >= 1; d--) {
    const date = new Date(round.close.getTime() - d * day).toISOString().slice(0, 10);
    const weight = d > 18 ? 0.16 : d > 12 ? 0.05 : d > 3 ? 0.025 : 0.06;
    await q("insert into campaign_daily_participation (campaign_id, day, submissions) values ($1, $2, $3)", [c.id, date, Math.round(count * weight)]);
  }
  await q("update campaigns set status = 'closed', closed_at = $2, launched_at = $3 where id = $1", [c.id, round.close, new Date(round.close.getTime() - 21 * day)]);
}
console.log("Sample organization created:", org.id);

// ---------------------------------------------------------------------------
// 4. Screenshots
// ---------------------------------------------------------------------------
const browser = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1800);
}
/** Screenshot of the card whose heading has the given text. */
async function card(title, file) {
  const heading = page.getByText(title, { exact: true }).first();
  await heading.waitFor({ state: "visible", timeout: 30000 });
  const box = heading.locator("xpath=ancestor::*[contains(@class,'rounded-2xl') or contains(@class,'rounded-xl')][1]");
  await box.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await box.screenshot({ path: `${OUT}/${file}` });
}

try {
  await page.goto(`${BASE}/sign-in?next=/app`);
  await page.fill("#email", OWNER);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith("/app")), page.click('button[type="submit"]')]);

  // Baseline results first so the history has two points.
  await page.goto(`${BASE}/app/campaigns/${campaignIds.base}/results`);
  await page.getByText("Current health index").first().waitFor();
  await page.goto(`${BASE}/app/campaigns/${campaignIds.follow}/results`);
  await page.getByText("Current health index").first().waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/01-results-overview.png` });
  await card("Health heatmap by department", "02-department-heatmap.png");
  await card("Dimension gaps", "03-where-employees-want-change.png");
  await card("Current vs. desired profile", "04-current-vs-desired.png");
  // The improvement story is in Operational Effectiveness (after a coordination initiative).
  await page.selectOption("#trend-series", "v2:operations");
  await page.waitForTimeout(800);
  await card("Organizational health over time", "05-progress-over-time.png");
  await page.selectOption("#trend-series", "overall");
  await page.screenshot({ path: `${OUT}/00-results-full.png`, fullPage: true });

  // Executive report: generated by the app (rules-based without an AI key); if
  // a sample narrative file exists, it replaces the narrative and is labeled.
  await page.goto(`${BASE}/app/campaigns/${campaignIds.follow}/report`);
  await page.click("button:has-text('Generate')");
  // An AI report can take several minutes; without an AI key the rules-based summary is immediate.
  for (let i = 0; i < 900; i++) {
    const row = await one("select status, error from ai_reports where campaign_id = $1 order by created_at desc limit 1", [campaignIds.follow]);
    if (row?.status === "completed") break;
    if (row?.status === "failed") throw new Error(`Report generation failed: ${row.error}`);
    await page.waitForTimeout(1000);
  }
  const report = await one("select id, input_snapshot from ai_reports where campaign_id = $1 and status = 'completed' order by created_at desc limit 1", [campaignIds.follow]);
  writeFileSync(`${OUT}/report-input-snapshot.json`, JSON.stringify(report.input_snapshot, null, 2));
  if (existsSync(NARRATIVE)) {
    const narrative = JSON.parse(readFileSync(NARRATIVE, "utf8"));
    await q("update ai_reports set generator = 'anthropic', model = $2, content = $3 where id = $1", [
      report.id,
      "sample narrative for illustration (not produced by a live AI request)",
      narrative,
    ]);
  }
  await page.goto(`${BASE}/app/campaigns/${campaignIds.follow}/report`);
  await page.getByText("30 / 60 / 90-day action plan").first().waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/06-executive-report-top.png` });
  await page.screenshot({ path: `${OUT}/00-report-full.png`, fullPage: true });

  const pdf = await page.request.get(`${BASE}/api/reports/${report.id}/pdf`);
  if (pdf.status() !== 200) throw new Error(`PDF failed: ${pdf.status()}`);
  writeFileSync(`${OUT}/sample-executive-report.pdf`, await pdf.body());
  console.log("Screenshots written to", OUT);
} finally {
  await browser.close();
  await db.end();
}
