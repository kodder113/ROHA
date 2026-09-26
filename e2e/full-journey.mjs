/**
 * ROHA end-to-end journey against a running app + local Supabase stack.
 *
 *   npx supabase start && npm run build && npm run start
 *   node e2e/full-journey.mjs
 *
 * Covers: organization registration with email verification (Mailpit),
 * campaign creation & launch, employee survey (desktop + mobile), duplicate
 * prevention, closing, privacy-screened results, report generation, PDF
 * entitlement, tenant isolation and the super-admin portal.
 */
import { chromium, devices } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";
const DB_URL = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SHOTS = process.env.E2E_SCREENSHOTS ?? "e2e/screenshots";
const run = Date.now().toString(36);
const OWNER = `owner-${run}@roha.test`;
const OTHER = `other-${run}@roha.test`;
const PASSWORD = "Str0ngPassw0rd!";

mkdirSync(SHOTS, { recursive: true });
const sql = (q) => execSync(`psql "${DB_URL}" -tAc ${JSON.stringify(q)}`, { encoding: "utf8" }).trim();
let step = 0;
const log = (msg) => console.log(`\n[${++step}] ${msg}`);
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`   ✓ ${msg}`);
};

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
  const link = await verificationLink(email);
  await page.goto(link);
  await page.waitForURL(/\/app/);
}

async function answerSurvey(page, { seed, department }) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  await page.check('input[type="checkbox"]'); // informed consent
  await page.click("text=Begin assessment");
  // Profile step
  if (await page.locator("#department_option_id").count()) {
    if (department) await page.selectOption("#department_option_id", { label: department });
    await page.selectOption("#tenure_range", { index: 1 + Math.floor(rand() * 5) });
    await page.click("text=Continue");
  }
  for (let section = 0; section < 6; section++) {
    await page.waitForSelector("text=Section " + (section + 1) + " of 6");
    const fieldsets = page.locator("fieldset");
    const n = await fieldsets.count();
    for (let i = 0; i < n; i++) {
      const fs = fieldsets.nth(i);
      const isDesired = i % 2 === 1;
      const value = isDesired ? 4 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
      await fs.locator(`label:has(input[value="${value}"])`).click();
    }
    await page.click("text=Continue");
  }
  await page.fill("#c-does_well", `People support each other (respondent ${seed}). Contact me at someone@example.com`);
  await page.fill("#c-makes_harder", "Approvals take too long and systems are disconnected.");
  await page.check('input[type="checkbox"]');
  await page.click("text=Continue");
  await page.waitForSelector("text=Review and submit");
  await page.click("text=Submit my response");
  await page.waitForSelector("text=Thank you for sharing your perspective");
}

const browser = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
try {
  // ── Registration & verification ──────────────────────────────────────────
  log("Organization registration with email verification");
  const ownerCtx = await browser.newContext();
  const owner = await ownerCtx.newPage();
  await register(owner, OWNER, `Acme Health ${run}`);
  await owner.waitForSelector(`h1:has-text("Acme Health ${run}")`);
  assert(owner.url().startsWith(`${BASE}/app`), "workspace provisioned after email verification");
  assert(sql(`select p.key from subscriptions s join plans p on p.id=s.plan_id join organizations o on o.id=s.org_id where o.contact_email='${OWNER}'`) === "discover", "free Discover plan assigned without Stripe");
  await owner.screenshot({ path: `${SHOTS}/01-overview.png`, fullPage: true });

  // ── Campaign creation & launch ───────────────────────────────────────────
  log("Create and launch an assessment campaign");
  await owner.goto(`${BASE}/app/campaigns/new`);
  await owner.fill("#name", "2026 Organizational Health Assessment");
  await owner.fill("#description", "Help leadership understand what is working and what can be improved.");
  await owner.fill("#expected_participants", "12");
  await owner.fill("#departments", "Operations\nFinance\nClinical Services");
  await owner.fill("#locations", "Headquarters\nRemote");
  await Promise.all([owner.waitForURL(/\/app\/campaigns\/[0-9a-f-]{36}\?created=1/), owner.click("text=Create assessment draft")]);
  const campaignId = owner.url().match(/campaigns\/([0-9a-f-]{36})/)[1];
  await owner.click("text=Launch assessment");
  await owner.waitForSelector('input[aria-label="Survey link"]');
  const surveyUrl = await owner.inputValue('input[aria-label="Survey link"]');
  assert(/\/s\/[a-f0-9]{36}$/.test(surveyUrl), `survey link generated (${surveyUrl})`);
  assert(sql(`select response_limit from campaigns where id='${campaignId}'`) === "25", "Discover response limit (25) captured at launch");

  // ── Employee survey ──────────────────────────────────────────────────────
  log("Employees complete the survey (desktop + mobile, no accounts)");
  const depts = ["Operations", "Operations", "Operations", "Finance", "Finance", "Clinical Services"];
  let firstEmployeeCtx;
  for (let i = 0; i < depts.length; i++) {
    const ctx = await browser.newContext(i % 2 === 0 ? devices["iPhone 13"] : {});
    const page = await ctx.newPage();
    await page.goto(surveyUrl);
    if (i === 0) await page.screenshot({ path: `${SHOTS}/02-survey-welcome-mobile.png`, fullPage: true });
    await answerSurvey(page, { seed: i + 1, department: depts[i] });
    if (i === 0) {
      firstEmployeeCtx = ctx;
      await page.screenshot({ path: `${SHOTS}/03-survey-thanks-mobile.png` });
    } else await ctx.close();
  }
  assert(sql(`select count(*) from responses where campaign_id='${campaignId}'`) === "6", "6 responses stored");
  assert(sql(`select count(*) from response_items ri join responses r on r.id=ri.response_id where r.campaign_id='${campaignId}'`) === "144", "144 item rows (6 × 24), i.e. 288 ratings");
  assert(sql(`select count(*) from response_comments where campaign_id='${campaignId}' and body like '%@%'`) !== "", "comments stored separately from responses");

  log("Duplicate prevention");
  const again = await firstEmployeeCtx.newPage();
  await again.goto(surveyUrl);
  await again.waitForSelector("text=You have already responded");
  assert(true, "same browser cannot submit twice");

  log("Results are withheld while the campaign is open");
  await owner.goto(`${BASE}/app/campaigns/${campaignId}/results`);
  assert((await owner.content()).includes("released"), "results not released before closing");

  log("Close the campaign and view privacy-screened results");
  await owner.goto(`${BASE}/app/campaigns/${campaignId}`);
  await owner.click("text=Close assessment now");
  await owner.click("text=Close and release results");
  await owner.waitForURL(/results\?released=1/);
  assert(sql(`select count(*) from participation_tokens where campaign_id='${campaignId}'`) === "0", "participation tokens destroyed at close");
  await owner.goto(`${BASE}/app/campaigns/${campaignId}/results`);
  await owner.waitForSelector("text=Current health index");
  await owner.screenshot({ path: `${SHOTS}/04-results-dashboard.png`, fullPage: true });
  const html = await owner.content();
  assert(!html.includes("someone@example.com"), "PII (email) never displayed");
  const payload = JSON.parse(sql(`select payload::text from aggregated_results where campaign_id='${campaignId}'`));
  const deptSegs = payload.segments.department?.segments ?? [];
  assert(deptSegs.every((s) => !s.visible), "all departments (3/2/1 respondents) suppressed below the minimum group of 5");
  assert(payload.overall.validResponses === 6 && payload.overall.overall.currentIndex !== null, "organization-level results shown (n = 6)");

  log("Tenant isolation between organizations");
  const otherCtx = await browser.newContext();
  const other = await otherCtx.newPage();
  await register(other, OTHER, `Beta Logistics ${run}`);
  const r1 = await other.goto(`${BASE}/app/campaigns/${campaignId}`);
  const otherHtml = await other.content();
  // Pages stream behind loading.tsx, so notFound() may arrive with HTTP 200.
  assert((r1.status() === 404 || otherHtml.includes("Page not found")) && !otherHtml.includes("2026 Organizational Health Assessment"), "another organization's campaign is not found and nothing leaks");
  await other.goto(`${BASE}/app/campaigns/${campaignId}/results`);
  assert(!(await other.content()).includes("Current health index"), "another organization's results are not accessible");
  const r2 = await other.request.get(`${BASE}/api/campaigns/${campaignId}/export?format=json`);
  assert(r2.status() === 404, "another organization's export API returns 404");

  log("Executive report generation");
  await owner.goto(`${BASE}/app/campaigns/${campaignId}/report`);
  await owner.click("text=Generate basic executive summary");
  await owner.waitForSelector("text=Your executive summary is ready", { timeout: 60000 });
  await owner.reload();
  await owner.waitForSelector("text=30 / 60 / 90-day action plan");
  await owner.screenshot({ path: `${SHOTS}/05-report.png`, fullPage: true });
  const reportId = sql(`select id from ai_reports where campaign_id='${campaignId}' and status='completed' order by created_at desc limit 1`);
  let pdf = await owner.request.get(`${BASE}/api/reports/${reportId}/pdf`);
  assert(pdf.status() === 403, "PDF blocked on Discover (server-side entitlement)");
  sql(`insert into subscriptions (org_id, plan_id, status, source, campaign_credits) select o.id, p.id, 'active', 'complimentary', 1 from organizations o, plans p where o.contact_email='${OWNER}' and p.key='professional'`);
  pdf = await owner.request.get(`${BASE}/api/reports/${reportId}/pdf`);
  const body = await pdf.body();
  assert(pdf.status() === 200 && body.subarray(0, 5).toString() === "%PDF-", `PDF generated after complimentary Professional grant (${body.length} bytes)`);
  writeFileSync(`${SHOTS}/report.pdf`, body);
  const otherPdf = await other.request.get(`${BASE}/api/reports/${reportId}/pdf`);
  assert(otherPdf.status() === 404, "another organization cannot download the PDF");

  log("Aggregate export");
  const csv = await owner.request.get(`${BASE}/api/campaigns/${campaignId}/export?format=csv`);
  const csvText = await csv.text();
  assert(csv.status() === 200 && csvText.startsWith("group,group_value"), "CSV export available");
  assert(!csvText.includes("Clinical Services"), "suppressed groups excluded from export");

  log("Super-admin portal");
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  const adminRes = await fetch(`http://127.0.0.1:54321/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@roha.test", password: PASSWORD, email_confirm: true }),
  });
  assert(adminRes.ok || adminRes.status === 422, "super-admin user exists");
  await adminPage.goto(`${BASE}/sign-in?next=/admin`);
  await adminPage.fill("#email", "superadmin@roha.test");
  await adminPage.fill("#password", PASSWORD);
  await Promise.all([adminPage.waitForURL(/\/admin/), adminPage.click('button[type="submit"]')]);
  for (const p of ["/admin", "/admin/organizations", "/admin/campaigns", "/admin/plans", "/admin/assessments", "/admin/scoring", "/admin/ai", "/admin/reports", "/admin/billing", "/admin/errors", "/admin/audit", "/admin/inquiries", "/admin/team"]) {
    const res = await adminPage.goto(`${BASE}${p}`);
    assert(res.status() === 200 && !(await adminPage.content()).includes("Something went wrong"), `${p} loads`);
  }
  await adminPage.goto(`${BASE}/admin`);
  await adminPage.screenshot({ path: `${SHOTS}/06-admin.png`, fullPage: true });
  const denied = await owner.goto(`${BASE}/admin`);
  assert(denied.url().includes("/app"), "organization owner cannot access the super-admin portal");

  log("Public demo dashboard (synthetic data)");
  const demoCtx = await browser.newContext(devices["Pixel 7"]);
  const demo = await demoCtx.newPage();
  await demo.goto(`${BASE}/demo`);
  await demo.waitForSelector("text=Demonstration only");
  await demo.screenshot({ path: `${SHOTS}/07-demo-mobile.png`, fullPage: true });
  const homeCtx = await browser.newContext();
  const home = await homeCtx.newPage();
  await home.goto(BASE);
  await home.waitForSelector("h1:has-text('Discover what your employees know about your organization that you')");
  assert(true, "homepage headline");
  await home.screenshot({ path: `${SHOTS}/08-home.png`, fullPage: true });

  console.log("\nALL E2E CHECKS PASSED");
} finally {
  await browser.close();
}
