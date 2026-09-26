/**
 * ROHA Version 2 transition journey — LOCAL SUPABASE ONLY.
 *
 *   npx supabase db reset            # fresh local database (migrations + demo seed)
 *   npm run build && npm run start
 *   SUPABASE_SERVICE_ROLE_KEY=<local key> node e2e/v2-transition.mjs
 *
 * Rehearses the publication of assessment version 2 on a local database:
 * an organization completes a Version 1 assessment, the super-admin loads the
 * Version 2 draft, publishes scoring rules v2 and assessment v2 through the
 * admin portal, and the organization runs a Version 2 assessment. Verifies
 * that Version 1 results are untouched, the per-dimension inclusion rule is
 * applied and reported, the history chart separates versions, and reports and
 * PDFs render for five dimensions.
 *
 * Refuses to run against anything other than a local database.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";
const DB_URL = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SHOTS = process.env.E2E_SCREENSHOTS ?? "e2e/screenshots/v2";
const run = Date.now().toString(36);
const OWNER = `v2-owner-${run}@roha.test`;
const PASSWORD = "Str0ngPassw0rd!";

if (!/@(127\.0\.0\.1|localhost):/.test(DB_URL) || !/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) {
  throw new Error("v2-transition.mjs only runs against a local database and app.");
}

mkdirSync(SHOTS, { recursive: true });
const sql = (q) => execSync(`psql "${DB_URL}" -tAc ${JSON.stringify(q)}`, { encoding: "utf8" }).trim();
let step = 0;
const log = (msg) => console.log(`\n[${++step}] ${msg}`);
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`   ✓ ${msg}`);
};

if (sql("select count(*) from assessment_versions where version_number = 2") !== "0") {
  throw new Error("A version 2 already exists in the local database. Run `npx supabase db reset` first.");
}

async function verificationLink(email) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const data = await res.json();
    if (data.messages?.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${data.messages[0].ID}`)).json();
      const match = (msg.HTML || msg.Text).match(/href="([^"]+verify[^"]+)"/) || (msg.Text || "").match(/(http\S+verify\S+)/);
      if (match) return match[1].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No verification email for ${email}`);
}

async function register(page, email, orgName) {
  await page.goto(`${BASE}/get-started`);
  await page.fill("#name", orgName);
  await page.selectOption("#industry", "Healthcare");
  await page.selectOption("#employee_count_range", "100-249");
  await page.fill("#website", "example.org");
  await page.fill("#country", "United States");
  await page.fill("#region", "Florida");
  await page.fill("#contact_name", "Jordan Rivera");
  await page.fill("#contact_title", "Chief Operating Officer");
  await page.fill("#contact_email", email);
  await page.fill("#password", PASSWORD);
  await page.check('input[name="terms"]');
  await Promise.all([page.waitForURL(/\/auth\/verify/), page.click('button[type="submit"]')]);
  await page.goto(await verificationLink(email));
  await page.waitForURL(/\/app/);
}

/** Answers every section. `na` maps a 0-based section index to 0-based item positions answered N/A (current and desired). */
async function answerSurvey(page, { seed, sections, na = {} }) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  await page.check('input[type="checkbox"]');
  await page.click("text=Begin assessment");
  if (await page.locator("#tenure_range").count()) {
    await page.selectOption("#tenure_range", { index: 1 + Math.floor(rand() * 5) });
    await page.click("text=Continue");
  }
  for (let section = 0; section < sections; section++) {
    await page.waitForSelector(`text=Section ${section + 1} of ${sections}`);
    const items = page.locator("li[id^='q-']");
    const n = await items.count();
    for (let i = 0; i < n; i++) {
      const item = items.nth(i);
      const markNa = (na[section] ?? []).includes(i);
      const fieldsets = item.locator("fieldset");
      for (let f = 0; f < 2; f++) {
        const fs = fieldsets.nth(f);
        const value = markNa ? "NA" : f === 1 ? String(4 + Math.floor(rand() * 2)) : String(2 + Math.floor(rand() * 3));
        await fs.locator(`label:has(input[value="${value}"])`).click();
      }
    }
    await page.click("text=Continue");
  }
  await page.check('input[type="checkbox"]');
  await page.click("text=Continue");
  await page.waitForSelector("text=Review and submit");
  await page.click("text=Submit my response");
  await page.waitForSelector("text=Thank you for sharing your perspective");
}

async function runCampaign(browser, owner, { name, respondents }) {
  await owner.goto(`${BASE}/app/campaigns/new`);
  await owner.fill("#name", name);
  await owner.fill("#expected_participants", String(respondents.length));
  await owner.fill("#departments", "Operations\nFinance");
  await Promise.all([owner.waitForURL(/\/app\/campaigns\/[0-9a-f-]{36}\?created=1/), owner.click("text=Create assessment draft")]);
  const campaignId = owner.url().match(/campaigns\/([0-9a-f-]{36})/)[1];
  await owner.click("text=Launch assessment");
  await owner.waitForSelector('input[aria-label="Survey link"]');
  const surveyUrl = await owner.inputValue('input[aria-label="Survey link"]');
  for (let i = 0; i < respondents.length; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(surveyUrl);
    if (i === 0) await page.screenshot({ path: `${SHOTS}/${name.replace(/\W+/g, "-")}-welcome.png`, fullPage: true });
    await answerSurvey(page, { seed: i + 11, ...respondents[i] });
    await ctx.close();
  }
  await owner.goto(`${BASE}/app/campaigns/${campaignId}`);
  await owner.click("text=Close assessment now");
  await owner.click("text=Close and release results");
  await owner.waitForURL(/results\?released=1/);
  return campaignId;
}

async function adminPublish(page, path, button) {
  await page.goto(`${BASE}${path}`);
  page.once("dialog", (d) => d.accept());
  await page.click(`button:has-text("${button}")`);
  await page.waitForTimeout(1500);
  await page.reload();
}

const browser = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
try {
  log("Organization completes a Version 1 assessment");
  const ownerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const owner = await ownerCtx.newPage();
  await register(owner, OWNER, `Transition Health ${run}`);
  // Enterprise (complimentary) for historical comparisons and PDFs.
  sql(`insert into subscriptions (org_id, plan_id, status, source, campaign_credits) select o.id, p.id, 'active', 'complimentary', 5 from organizations o, plans p where o.contact_email='${OWNER}' and p.key='enterprise'`);
  const v1Campaign = await runCampaign(browser, owner, { name: "2025 Baseline", respondents: Array.from({ length: 5 }, () => ({ sections: 6 })) });
  assert(sql(`select v.version_number from campaigns c join assessment_versions v on v.id=c.assessment_version_id where c.id='${v1Campaign}'`) === "1", "Version 1 campaign pinned to assessment v1");
  const v1Payload = sql(`select payload::text from aggregated_results where campaign_id='${v1Campaign}'`);
  const v1Scores = JSON.parse(v1Payload).overall;
  assert(v1Scores.dimensions.length === 6 && v1Scores.validResponses === 5, "Version 1 results: 6 dimensions, 5 valid responses");
  const demoBefore = sql("select string_agg(payload::text, '|' order by campaign_id) from aggregated_results a join campaigns c on c.id=a.campaign_id join organizations o on o.id=c.org_id where o.is_demo");

  log("Super-admin loads the Version 2 draft (local database)");
  execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -q -f supabase/drafts/assessment_v2_draft.sql`, { stdio: "inherit" });
  assert(sql("select status from assessment_versions where version_number=2") === "draft", "assessment v2 created as a draft");
  assert(sql("select status from scoring_rule_versions where version_number=2") === "draft", "scoring rules v2 created as a draft");

  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const admin = await adminCtx.newPage();
  await fetch(`http://127.0.0.1:54321/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@roha.test", password: PASSWORD, email_confirm: true }),
  });
  sql("insert into platform_admins (user_id) select id from auth.users where email='superadmin@roha.test' on conflict do nothing");
  await admin.goto(`${BASE}/sign-in?next=/admin`);
  await admin.fill("#email", "superadmin@roha.test");
  await admin.fill("#password", PASSWORD);
  await Promise.all([admin.waitForURL((u) => u.pathname.startsWith("/admin")), admin.click('button[type="submit"]')]);

  const v2Id = sql("select id from assessment_versions where version_number=2");
  const rules2Id = sql("select id from scoring_rule_versions where version_number=2");
  await admin.goto(`${BASE}/admin/assessments/${v2Id}`);
  const beforeRules = await admin.content();
  assert(beforeRules.includes("5 × 5 = 25 questions"), "checklist accepts the 5 × 5 structure");
  assert(await admin.locator('button:has-text("Publish version 2")').isDisabled(), "assessment v2 cannot be published before scoring rules v2");
  await admin.screenshot({ path: `${SHOTS}/admin-checklist-blocked.png`, fullPage: true });

  log("Publish scoring rules v2, then assessment v2 (retiring v1 for new campaigns)");
  await adminPublish(admin, `/admin/scoring/${rules2Id}`, "Publish v2");
  assert(sql("select status from scoring_rule_versions where version_number=2") === "published", "scoring rules v2 published");
  await admin.goto(`${BASE}/admin/assessments/${v2Id}`);
  await adminPublish(admin, `/admin/assessments/${v2Id}`, "Publish version 2");
  assert(sql("select status from assessment_versions where version_number=2") === "published", "assessment v2 published");
  assert(sql("select status from assessment_versions where version_number=1") === "retired", "assessment v1 retired for new campaigns");

  log("Version 1 results are untouched");
  assert(sql(`select payload::text from aggregated_results where campaign_id='${v1Campaign}'`) === v1Payload, "Version 1 campaign's stored results unchanged");
  const demoAfter = sql("select string_agg(payload::text, '|' order by campaign_id) from aggregated_results a join campaigns c on c.id=a.campaign_id join organizations o on o.id=c.org_id where o.is_demo");
  assert(demoAfter === demoBefore, "demo organization's historical results unchanged");

  log("Organization runs a Version 2 assessment");
  const respondents = [
    ...Array.from({ length: 5 }, () => ({ sections: 5 })),
    { sections: 5, na: { 4: [2, 4] } }, // SI3 and SI5 N/A: only 3 valid ratings in SI → excluded
  ];
  const v2Campaign = await runCampaign(browser, owner, { name: "2026 Pilot", respondents });
  assert(
    sql(`select v.version_number || '/' || r.version_number from campaigns c join assessment_versions v on v.id=c.assessment_version_id join scoring_rule_versions r on r.id=c.scoring_rule_version_id where c.id='${v2Campaign}'`) === "2/2",
    "Version 2 campaign pinned to assessment v2 and scoring rules v2",
  );
  assert(sql(`select count(*) from response_items ri join responses r on r.id=ri.response_id where r.campaign_id='${v2Campaign}'`) === "150", "150 item rows (6 × 25)");
  const v2 = JSON.parse(sql(`select payload::text from aggregated_results where campaign_id='${v2Campaign}'`)).overall;
  assert(v2.dimensions.length === 5 && v2.questions.length === 25, "results have 5 dimensions and 25 items");
  assert(v2.validResponses === 5 && v2.excludedResponses === 1, "respondent with SI3 and SI5 marked N/A is excluded");
  assert(v2.exclusions.belowDimensionThreshold.strategy_innovation === 1 && v2.exclusions.withNotApplicable === 1, "exclusion recorded by dimension and cause");

  await owner.goto(`${BASE}/app/campaigns/${v2Campaign}/results`);
  await owner.waitForSelector("text=Current health index");
  const results = await owner.content();
  assert(results.includes("5 dimensions of organizational health"), "dashboard describes five dimensions");
  assert(results.includes("including at least 4 in every dimension"), "dashboard states the inclusion rule");
  assert(results.includes("1 response had too few current-state ratings in Strategic Alignment &amp; Innovation"), "dashboard explains the exclusion");
  await owner.screenshot({ path: `${SHOTS}/v2-results.png`, fullPage: true });

  log("History separates Version 1 and Version 2");
  await owner.goto(`${BASE}/app/history`);
  await owner.waitForSelector("text=Completed assessments");
  const history = await owner.content();
  assert(history.includes("vertical marker shows where a new assessment version begins") && history.includes("Version 2: dashed lines"), "chart marks the version boundary and styles versions separately");
  assert(history.includes("not directly comparable"), "chart explains that versions are not comparable");
  assert(history.includes(">v1<") && history.includes(">v2<"), "history table shows each assessment's version");
  await owner.screenshot({ path: `${SHOTS}/history.png`, fullPage: true });

  log("Executive report and PDF for Version 2");
  await owner.goto(`${BASE}/app/campaigns/${v2Campaign}/report`);
  await owner.click("button:has-text('Generate')");
  // Without an Anthropic key locally, the rules-based generator is used.
  for (let i = 0; i < 120 && sql(`select count(*) from ai_reports where campaign_id='${v2Campaign}' and status='completed'`) === "0"; i++) {
    await owner.waitForTimeout(1000);
  }
  await owner.goto(`${BASE}/app/campaigns/${v2Campaign}/report`);
  await owner.waitForSelector("text=30 / 60 / 90-day action plan");
  const report = await owner.content();
  assert(report.includes("items SI3–SI5") && report.includes("No separate score is calculated"), "section H covers SI3–SI5 without a sub-score");
  await owner.screenshot({ path: `${SHOTS}/v2-report.png`, fullPage: true });
  const reportId = sql(`select id from ai_reports where campaign_id='${v2Campaign}' and status='completed' order by created_at desc limit 1`);
  const pdf = await owner.request.get(`${BASE}/api/reports/${reportId}/pdf`);
  const body = await pdf.body();
  assert(pdf.status() === 200 && body.subarray(0, 5).toString() === "%PDF-", `Version 2 PDF generated (${body.length} bytes)`);
  writeFileSync(`${SHOTS}/v2-report.pdf`, body);

  log("Version 1 dashboard still renders six dimensions");
  await owner.goto(`${BASE}/app/campaigns/${v1Campaign}/results`);
  await owner.waitForSelector("text=Current health index");
  assert((await owner.content()).includes("6 dimensions of organizational health"), "Version 1 results keep six dimensions");

  console.log("\nALL VERSION 2 TRANSITION CHECKS PASSED");
} finally {
  await browser.close();
}
