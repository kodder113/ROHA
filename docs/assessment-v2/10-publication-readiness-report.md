# 10. Publication Readiness Report — ROHA Assessment Version 2

- **Date:** September 26, 2026
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Verdict:** **Not ready to publish.** The content is approved by the owner and the application supports Version 2, but independent IP screening, professional reviews, written sign-offs, one owner decision and all production-environment testing are still outstanding.
- **Constraint honored:** Version 2 is not published, and no production database or assessment data was changed. The Version 2 draft was loaded only into local test databases.

## 1. What is complete

| Area | Status | Evidence |
|---|---|---|
| Framework (5 dimensions × 5 items) | Approved by the owner, subject to IP screening | Documents 1–2 |
| Owner's final edits | EE5 and SI3 applied in the draft loader | Document 2, 2.3; content fingerprint `8ef7dd86…` checked by an automated test |
| Current-versus-desired ratings | Retained for the pilot (Option A); scoring formula unchanged | Documents 4, 5 |
| Inclusion rule | At least 4 valid current-state ratings in every dimension; N/A and blanks do not count; exclusions reported by dimension and cause | Document 5, 5.3 |
| FLAME separation | Stated in the framework, methodology and provenance record; no ROHA material mentions FLAME | Document 1, 1.4 |
| Logo | Six-segment hexagon replaced by an abstract mark that does not depict a number of dimensions (app, favicon, PDF, website pattern) | Document 8, item 11 |
| Application changes (12, plus rules pairing and inclusion rule) | Implemented and tested; Version 1 behavior unchanged | Document 8 |
| History chart | Versions drawn separately, boundary marked, no line or change calculated across versions | Document 6, 6.4 |
| Version 1 preservation | Version 1 content, scoring rules v1, AI instructions v1 and all stored results unchanged; cached results are not recomputed | Automated test; local end-to-end check (byte-for-byte identical stored results after publishing v2) |
| IP review package and methodology | Updated for Version 2 | Prelaunch review README addendum, 05 (5.2.2, 5.6), 07 (7.1a, 7.4) |
| Automated verification | 104 unit/integration tests, type-check and lint pass; Version 1 end-to-end journey and Version 2 transition rehearsal pass on local Supabase | Run September 26, 2026 |

## 2. Remaining blockers

Each blocker must be cleared, and recorded, before the publication steps in section 3.

### A. Intellectual property and legal

| # | Blocker | Who | Notes |
|---|---|---|---|
| A1 | **Independent screening of all 25 Version 2 items against licensed copies** of relevant instruments (engagement surveys, job-design questionnaires, climate and culture instruments, and the OCAI) | Qualified reviewer with licensed access, instructed by counsel | Not done. This review worked from recollection only and cannot confirm the absence of similarity |
| A2 | **EE5 similarity check** (priority within A1) | Same | "Freedom … how … work" is close to common job-design autonomy wording. Fallback: the earlier draft wording, which you would need to re-approve |
| A3 | IP counsel review of the prelaunch package and Version 2 materials, including the architecture question, AI-assisted authorship and the terms of the AI tools used | IP counsel | Questions in prelaunch review, 7.2 |
| A4 | **Written owner sign-off** of the 25 Version 2 items (fingerprint `8ef7dd86…`) and **written confirmation that they do not reproduce FLAME content** | You | Sign-off table in prelaunch review, 7.4. Your approval message is recorded, but a signed record is advisable for authorship |
| A5 | Trademark clearance for "ROHA", the full name, taglines and the **new brand mark** | Trademark counsel | Not assessed by any review so far |
| A6 | Legal templates: Terms of Service contain placeholders ("[State]" in two places; "[Refund policy to be confirmed…]"); the Privacy Policy is a template | Counsel | Required before any paying or pilot customer relies on them |

### B. Methodology

| # | Blocker | Who | Notes |
|---|---|---|---|
| B1 | Review by an organizational research / psychometrics specialist: construct definitions, the integrated SI dimension, the inclusion rule and composition model | Research specialist | Questions in prelaunch review, 7.3 (including 9–10 for Version 2) |
| B2 | **Owner decision: N/A on both SI3 and SI5.** Under the approved rule, a respondent answering N/A to both is excluded from all results. Accept this, or remove N/A from one of the two items | You (with B1 advice) | If an item changes, the draft loader and fingerprint change and the draft must not yet have been loaded in production |
| B3 | Pilot plan: pre-registered criteria for the desired-state ceiling (document 4, 4.4), SI unidimensionality (document 5, 5.4), cognitive interviews (SI3 has an estimated reading grade of 19.2), consent language for research use | You and research specialist | Needed before pilot data can be used as evidence |
| B4 | Keep "not validated" wording in all materials until evidence exists | Ongoing | Current copy complies (document 9) |

### C. Production environment and credentials

None of these has been tested in production. All code paths have been tested only against local services, test-mode or mocked APIs.

| # | Blocker | What to verify |
|---|---|---|
| C1 | **Production Supabase project** | Migrations applied; RLS enabled; `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set as server environment variables (service-role key never in the browser); backups and point-in-time recovery enabled |
| C2 | **Supabase Auth email (SMTP)** | Custom SMTP configured; sign-up verification and password-reset emails delivered from the production domain; redirect URLs set to `NEXT_PUBLIC_APP_URL` |
| C3 | **Anthropic API** | `ANTHROPIC_API_KEY` set server-side; `ROHA_AI_MODEL` set to a model available to the account; one real report generated and checked by the numeric validator; data-processing terms reviewed. Only mocked API calls have been tested |
| C4 | **Stripe** | Live-mode `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; webhook endpoint registered; live prices mapped to plans; one real checkout, renewal and cancellation. Only test-mode signatures have been tested |
| C5 | Application secrets | `ROHA_TOKEN_SECRET` (random, at least 32 bytes, never rotated during an open campaign), `CRON_SECRET`, `ROHA_PLATFORM_ADMIN_EMAILS` limited to named administrators |
| C6 | Deployment | This branch deployed; `NEXT_PUBLIC_APP_URL` set; scheduled retention job (`/api/cron/retention`) running; error logging reviewed. Not deployed to date |
| C7 | CI on the final commit | GitHub Actions CI passed on every earlier push to this branch; it must pass on the commit that is deployed |
| C8 | **Production rehearsal** | Run `e2e/v2-transition.mjs` steps against a staging copy of production (the script refuses non-local databases; a staging run needs a deliberate, reviewed change or a manual checklist) |

## 3. Publication sequence (after all blockers are cleared)

1. Confirm A1–A6, B1–B3 and C1–C8 are recorded as complete.
2. Deploy the approved commit to production.
3. Back up the production database.
4. Run `supabase/drafts/assessment_v2_draft.sql` once in production. It creates drafts only and aborts if any version 2 exists.
5. In Super Admin, review assessment v2, scoring rules v2 and AI instructions v2.
6. Publish **scoring rules v2 first**, then **assessment v2**. The checklist blocks assessment v2 until rules v2 are published. Choose whether to retire Version 1 for new campaigns; existing campaigns keep their pinned versions either way.
7. **Activate AI instructions v2** in the same session. The active v1 instructions describe six dimensions and 24 items and would contradict Version 2 reports.
8. Check that the website shows five dimensions after revalidation (up to one hour), then open one test campaign in a test organization and verify the survey, results, report and PDF.
9. Optional: add a clearly labeled synthetic Version 2 demonstration campaign (requires your approval).

## 4. Risks accepted for the pilot

- Desired ratings may show a ceiling for most items (document 4); gaps are presented as priority indicators only.
- The integrated SI dimension may prove to be two factors; reports avoid sub-scores until tested.
- Historical trends across Version 1 and Version 2 show no change figures; organizations with Version 1 history will see a visible break.
- Item-level comparisons across versions are not yet displayed in the application.
