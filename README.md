# ROHA — Rodrik Organizational Health Assessment

**Organizational Intelligence. Human-Centered Leadership.**
*Powered by AI. Grounded in Strategic Leadership.*

ROHA is a multi-tenant SaaS platform owned and operated by **Rodrik Consulting LLC** (founded by Dr. Oscar A. Rodriguez, DSL — <https://rodrikconsulting.com>). Organizations register, run confidential employee assessments, and receive privacy-screened executive dashboards, AI-assisted executive intelligence reports and a consulting-grade PDF.

> ROHA is an independently developed organizational health assessment in its initial release. It does not reproduce, derive from or claim affiliation with any other assessment instrument (including the OCAI). Its dimensions draw on established organizational research concepts, but ROHA's own questions and scoring have not yet been empirically tested for reliability or validity.

---

## Contents

1. [What's included](#whats-included)
2. [Architecture](#architecture)
3. [The ROHA framework and scoring methodology](#the-roha-framework-and-scoring-methodology)
4. [Privacy and security design](#privacy-and-security-design)
5. [Local development](#local-development)
6. [Environment variables and external credentials](#environment-variables-and-external-credentials)
7. [Production deployment](#production-deployment)
8. [Testing](#testing)
9. [Operations](#operations)
10. [Known limitations and residual risks](#known-limitations-and-residual-risks)

**Prelaunch intellectual property and methodological independence review:** see [`docs/prelaunch-review/`](docs/prelaunch-review/README.md). **Assessment Version 2 (five dimensions × five items; approved by the owner subject to IP screening; application support implemented; not published):** see [`docs/assessment-v2/`](docs/assessment-v2/README.md) and the [publication readiness report](docs/assessment-v2/10-publication-readiness-report.md).

---

## What's included

| Area | Where |
| --- | --- |
| Public website (Home, How ROHA Works, Framework, Features, Pricing, About, Contact, Privacy, Terms) | `src/app/(marketing)` |
| Registration with email verification, sign-in, password reset | `src/app/(auth)`, `src/app/auth/callback` |
| Organization app: overview, assessments, results, trends, reports, settings | `src/app/app` |
| Employee survey (no accounts, mobile-first) | `src/app/s/[token]`, `src/components/survey` |
| Deterministic scoring engine | `src/lib/scoring` |
| Small-group privacy protection | `src/lib/privacy`, `src/lib/results/segments.ts` |
| Executive dashboard (8 visualizations) | `src/components/dashboard` |
| AI executive intelligence (Anthropic) + rules-based fallback | `src/lib/ai`, `src/lib/reports/service.ts` |
| Executive PDF report | `src/lib/reports/pdf` |
| Plans, entitlements, Stripe Checkout / portal / webhooks | `src/lib/billing`, `src/app/api/stripe/webhook` |
| Rodrik Consulting super-admin portal | `src/app/admin` |
| Database schema, RLS, functions, reference data | `supabase/migrations` |
| Clearly labeled synthetic demonstration organization | `supabase/seed.sql`, public page `/demo` |

---

## Architecture

- **Next.js 16** (App Router, React 19, TypeScript, Server Components / Server Actions), **Tailwind CSS v4**, **Recharts**.
- **Supabase**: PostgreSQL, Auth (email + password with verification), Row Level Security.
- **Anthropic API** (`@anthropic-ai/sdk`) for narrative reports — default model `claude-opus-5` with adaptive thinking, structured JSON output and server-side refusal fallbacks.
- **Stripe** Checkout, Billing Portal and signed webhooks (optional — free plans never need it).
- **@react-pdf/renderer** for server-side PDF generation (built-in fonts, no network at render time).

Two Supabase clients are used on the server:

- `src/lib/supabase/server.ts` — **user-scoped** (anon key + the user's JWT). Organization data is read through RLS, so tenant isolation is enforced by the database.
- `src/lib/supabase/admin.ts` — **service role**, server-only (`import "server-only"`). Used only after authorization checks, for the public survey (validated inside `SECURITY DEFINER` functions), aggregation, provisioning, webhooks and super-admin tools. The key is never sent to the browser.

### Data model (normalized, see `supabase/migrations`)

`organizations`, `organization_members`, `roles`, `platform_admins`, `plans`, `subscriptions`, `billing_events`, `assessment_templates`, `assessment_versions`, `dimensions`, `questions`, `qualitative_questions`, `scoring_rule_versions`, `campaigns`, `campaign_segment_options`, `participation_tokens`, `responses`, `response_items`, `response_comments`, `campaign_daily_participation`, `aggregated_results`, `ai_report_instructions`, `ai_reports`, `generated_reports`, `audit_logs`, `app_errors`, `contact_inquiries`, `rate_limits`, `pending_registrations`.

TypeScript types are generated into `src/lib/database.types.ts` (`npm run db:types`, or `supabase gen types typescript`).

---

## The ROHA framework and scoring methodology

**Published version (Version 1):** six dimensions × four original items = **24 core items**, each rated for the **current state** and the **desired state** on a five-point agreement scale (1 Strongly disagree … 5 Strongly agree; *Not applicable* allowed on selected items) → **48 ratings per respondent**. Three optional open-ended questions are never scored. All wording lives in the database (`questions`, `qualitative_questions`) and is versioned.

| Code | Dimension |
| --- | --- |
| LE | Leadership Effectiveness |
| OC | Organizational Culture |
| EE | Employee Engagement |
| OE | Operational Effectiveness |
| IA | Innovation and Adaptability |
| SA | Strategic Alignment |

**Version 2 (approved, not published):** five dimensions × five items (25 items, 50 ratings): LE, OC, EE, OE and **SI — Strategic Alignment & Innovation**. The application supports both versions: the publication checklist accepts balanced 5–6 × 4–6 structures when matching scoring rules are published; reports map sections H and I to SI items without sub-scores; the history chart keeps versions separate. The draft is loaded only by `supabase/drafts/assessment_v2_draft.sql` (never automatically). A release (assessment version, its scoring rules and compatible AI instructions) is published in one database transaction (`publish_assessment_release`), after which every cached page is refreshed. `e2e/v2-transition.mjs` rehearses this on a local database.

Scoring (`src/lib/scoring/engine.ts`, rules v1 in `scoring_rule_versions`):

- Normalized score = **((rating − 1) / 4) × 100**.
- Question score = normalized mean of valid numeric ratings; N/A and missing ratings are excluded but counted.
- Dimension score = mean of question scores (equal weights by default); overall index = mean of dimension scores (equal weights).
- **Gap = desired − current** at every level. Positive: employees prefer more of the characteristic; negative: less (not automatically a problem).
- Inclusion rule: rules v1 include a response with at least 12 numeric current-state ratings. Rules v2 (draft): a respondent counts in each dimension where it has at least 4 numeric current-state ratings, and in the overall index only when that holds in **every** dimension (N/A does not count). Respondent counts are shown per dimension and for the index, and shortfalls are explained by dimension.
- Scoring rules declare the assessment version they belong to (`assessmentVersion`, absent = 1); new campaigns use the newest published rules for their assessment version.
- Distributions, sample sizes, N/A and missing counts are preserved. Descriptive bands (0–39, 40–59, 60–79, 80–100) are interpretive aids, not validated cut-offs.
- No industry benchmarks are produced. Scores describe perceptions and do not establish effectiveness, retention, productivity or financial performance.

**Versioning.** Published assessment versions, questions and scoring rules are immutable (database triggers). Campaigns pin the versions they were launched with, and closed-campaign aggregates are frozen, so historical results never change when content is revised. New versions are created as drafts in the super-admin portal. Results from different assessment versions are never joined in trend charts, and no change in the overall index is calculated across versions.

**AI never produces official numbers.** The AI receives an aggregate-only snapshot and writes narrative; every figure in the dashboard, report and PDF comes from the scoring engine. Narrative numbers are cross-checked against the snapshot and mismatches are flagged to the reader.

---

## Privacy and security design

**Confidential vs. anonymous campaigns.** *Confidential* campaigns ask optional demographic questions (department, location, level, tenure) to allow group comparisons; *anonymous* campaigns collect no demographics at all. The survey states plainly which applies and what the limitations are (including that the platform operator's authorized administrators could technically access stored records). ROHA never promises anonymity it cannot support.

**What is (not) stored with a response.** No names, emails, employee IDs, IP addresses, user agents or submission timestamps. Responses have random IDs. Written comments are stored in a separate table **without a link to the response**, so they cannot be joined to ratings or demographics. Daily participation is kept as counts only.

**Duplicate prevention without identification.** The browser holds a random participation token; the server stores only `HMAC(ROHA_TOKEN_SECRET, token)`. Optional single-use **access codes** (Professional+) are stored only as hashes. No response row references a token, and all tokens are destroyed when the campaign closes.

**Small-group protection** (`src/lib/privacy/suppression.ts`):

- Minimum group size **5** (configurable in scoring rules): groups below it are hidden.
- **Complementary suppression**: because the organization total is shown, the next-smallest groups are also hidden whenever the hidden remainder (including "not specified") could be derived by subtraction.
- Item-level cells rated numerically by fewer than 5 people are hidden.
- Only **one attribute can be filtered at a time** (no intersections).
- **Results are released only when a campaign closes** and are then frozen, so repeated queries cannot be differenced over time.
- Exports contain exactly the privacy-screened aggregates; raw individual responses are never exported to organizations.
- Verbatim comments are shown only with the respondent's explicit permission, after identifier scrubbing, in shuffled order, organization-wide only.

**Other controls.** RLS on every table (raw survey tables are not readable by any browser role), role-based access (owner / administrator / executive viewer, plus Rodrik Consulting platform administrators), server-side permission checks in every action, column-level grants, PostgreSQL-backed rate limiting keyed by daily-rotating HMACs (no raw IPs), audit logging of administrative actions, retention enforcement, organization export and deletion, security headers, `no-referrer` on survey links, and error logging to a super-admin console. Only aggregates and identifier-scrubbed comments are sent to the AI provider.

---

## Local development

Prerequisites: Node.js 22+, Docker (for the Supabase CLI).

```bash
npm install
npx supabase start          # Postgres, Auth, REST, Mailpit; applies migrations + demo seed
npx supabase status         # copy API URL, anon key and service-role key
cp .env.example .env.local  # fill in the values (see below)
npm run dev                 # http://localhost:3000
```

- Verification and invitation emails are captured by Mailpit at <http://127.0.0.1:54324>.
- `supabase/config.toml` enables email confirmation and the `/auth/callback` redirect URL.
- The demonstration organization (synthetic data) is visible at `/demo`.
- To become a Rodrik Consulting super-administrator, add your email to `ROHA_PLATFORM_ADMIN_EMAILS`, sign up/verify, then open `/admin`.

Without Docker you can still run the database test-suite against any PostgreSQL 15+ server (`TEST_DATABASE_ADMIN_URL`) and build a scratch database with `npm run db:local`.

---

## Environment variables and external credentials

See `.env.example`. Nothing is hard-coded; secrets are read only on the server.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL (auth redirects, survey links, Stripe return URLs). |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase project (publishable key also accepted as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only; survey submission, aggregation, provisioning, admin tools. |
| `ROHA_TOKEN_SECRET` | yes | 32+ random bytes (`openssl rand -hex 32`) for hashing participation tokens and rate-limit keys. |
| `ROHA_PLATFORM_ADMIN_EMAILS` | recommended | Comma-separated emails promoted to super-admins once verified. |
| `ANTHROPIC_API_KEY` | optional | Enables AI executive reports. Without it, a transparent rules-based summary is generated. |
| `ROHA_AI_MODEL` | optional | Defaults to `claude-opus-5`. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | optional | Paid plans. Free ROHA Discover works without them. |
| `CRON_SECRET` | recommended | Protects `/api/cron/retention`. |

**Status of integrations in this repository:** Supabase, the scoring engine, survey, dashboards, rules-based reports, PDF, retention and the super-admin portal were exercised end-to-end against a local Supabase stack. The Anthropic integration was verified against a mocked Messages API (request shape, streaming, structured output, refusal/truncation handling) — **it has not been called with a real API key**; configure `ANTHROPIC_API_KEY` and generate one report to confirm. Stripe webhook handling was verified with signed test events; **Checkout and the Billing Portal require real Stripe test/live keys and price IDs** to be configured.

---

## Production deployment

**Production address:** `https://roha.droscarrodriguez.com` (set as `NEXT_PUBLIC_APP_URL`; also the built-in production fallback in `src/lib/brand.ts`, so links never point to localhost).

### 1. Supabase

1. Create a project. In **Authentication → Providers → Email**, keep *Confirm email* **enabled**.
2. **Authentication → URL configuration**: Site URL = `https://roha.droscarrodriguez.com`; add `https://roha.droscarrodriguez.com/auth/callback` to Redirect URLs.
3. Configure a production SMTP sender (Authentication → SMTP) so verification/invitation emails are delivered reliably, for example `no-reply@droscarrodriguez.com`, with the SPF and DKIM records your email provider requires.
4. Apply migrations: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
5. (Optional) Load the demonstration organization: `psql "$DATABASE_URL" -f supabase/seed.sql`.

### 2. Anthropic (optional)

Create an API key at console.anthropic.com and set `ANTHROPIC_API_KEY`. The system prompt for reports is managed in **Super Admin → AI reporting** (versioned).

### 3. Stripe (optional)

1. Create two Prices: **ROHA Professional** — one-time **$499**; **ROHA Enterprise** — recurring **$199/month**.
2. In **Super Admin → Plans**, paste each `price_…` ID into the plan's *Stripe price ID*.
3. Add a webhook endpoint `https://roha.droscarrodriguez.com/api/stripe/webhook` for events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`; set `STRIPE_WEBHOOK_SECRET`.
4. Enable the Customer Billing Portal in Stripe settings (used by *Manage billing*).

ROHA never receives or stores card data; only Stripe identifiers are kept.

### 4. Hosting (Vercel recommended)

1. Import the repository, set all environment variables for Production, including `NEXT_PUBLIC_APP_URL=https://roha.droscarrodriguez.com`.
2. **Custom domain:** in Vercel → Project → Settings → Domains, add `roha.droscarrodriguez.com`. At the DNS provider for `droscarrodriguez.com`, create the record Vercel shows (normally a **CNAME** named `roha` pointing to `cname.vercel-dns.com`). Vercel issues the HTTPS certificate automatically once DNS resolves.
3. `vercel.json` schedules the daily retention job; set `CRON_SECRET` (Vercel sends it as a Bearer token).
4. Deploy, then sign up with an email listed in `ROHA_PLATFORM_ADMIN_EMAILS` to access `/admin`.
5. After the domain is live, check: `https://roha.droscarrodriguez.com` loads over HTTPS; sign-up verification emails link back to this domain; a survey link starts with `https://roha.droscarrodriguez.com/s/`; the Stripe webhook shows successful deliveries.

### 5. Before launch

- Have qualified counsel review the Privacy Policy and Terms (they are marked as templates, including a `[State]` governing-law placeholder and a refund-policy placeholder).
- Decide the plan limits not specified in the brief (Enterprise defaults: 1,000 responses per campaign, 10 administrators; Professional: 12 months of access, 2 administrators) — editable in **Super Admin → Plans**.

---

## Testing

```bash
npm run typecheck && npm run lint
npm test                  # unit + PDF + database integration tests (needs PostgreSQL, see below)
npm run test:unit         # without the database suites
```

- **Scoring engine** — all 24 items / 48 ratings, hand-verified examples, N/A and missing handling, incomplete responses, weights, gaps/bands, determinism, and cross-checks against an independent naive implementation.
- **Privacy** — primary/complementary/population suppression, item-level redaction, segment analysis, PII scrubbing.
- **Entitlements** — Discover/Professional/Enterprise/pilot overrides, lapsed plans, admin seats; free plan without Stripe.
- **Database (real PostgreSQL + RLS)** — tenant isolation, role permissions, raw-data inaccessibility, function privileges, survey submission rules (duplicates, incomplete, N/A, expiry, not-yet-open, response limits, access codes, anonymous mode), comment unlinking, immutability of published content, historical results unchanged after publishing a new assessment version, engine-vs-SQL score verification, rate limiting. Set `TEST_DATABASE_ADMIN_URL` (default `postgres://postgres:postgres@localhost:5432/postgres`); suites are skipped if unreachable.
- **AI layer** — snapshot contains no personal data, rules report consistency, invented-number detection, mocked Anthropic streaming (request shape, fallbacks, malformed/truncated/refused output).
- **PDF** — renders a ≥10-page report and edge cases (null scores, empty sections, anonymous mode).
- **End-to-end** (`npm run test:e2e`, requires `npx supabase start`, a running app and `SUPABASE_SERVICE_ROLE_KEY` in the environment) — registration with email verification, campaign creation/launch, six employees on desktop and mobile, duplicate prevention, closing and results release, suppression, tenant isolation, report generation, PDF entitlement, exports, super-admin portal, demo and home pages. `npm run test:e2e:stripe` verifies webhook signature checks, entitlement grants and idempotency (server must run with test Stripe keys).

---

## Operations

- **Retention**: `/api/cron/retention` closes expired campaigns and deletes raw responses/comments once an organization's retention period (default 36 months, 6–120 configurable by the owner) has elapsed after a campaign closes. Privacy-screened aggregates and reports are retained for historical comparison.
- **Complimentary pilots**: Super Admin → Organizations → *Grant complimentary pilot* (choose plan, optional end date and limit overrides).
- **Assessment revisions**: Super Admin → Assessments → *Create new draft version* → edit → publish. Existing campaigns keep their version.
- **Audit trail and errors**: Super Admin → Audit / Errors. Organization owners and administrators see their own organization's audit entries.

---

## Known limitations and residual risks

- **Cross-attribute inference.** Results for different single attributes (e.g. department views and location views) are each protected, but a determined viewer combining many partitions could, in principle, narrow down very small overlaps. Mitigations: minimum group size, complementary suppression, one-attribute filtering, frozen results. Raise `minGroupSize` in the scoring rules (e.g. to 7–10) for small organizations.
- **Browser-based duplicate prevention** stops accidental resubmission but not a determined person using another browser or device. Use single-use access codes where stronger control is required.
- **Comment scrubbing is best-effort.** Direct identifiers are removed automatically, but people can describe themselves; comments are therefore quoted only with permission.
- **Operator access.** Rodrik Consulting database administrators can technically access raw records; this is disclosed to employees.
- **AI output** is narrative only and may still contain errors of interpretation; numeric mismatches are flagged, and all official figures come from the scoring engine.
