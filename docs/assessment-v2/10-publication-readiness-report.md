# 10. Final Publication Readiness Checklist — ROHA Assessment Version 2

- **Date:** September 26, 2026
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Framework status:** **frozen.** The five-dimension, 25-question structure is approved for the pilot, subject to independent legal and methodological review. Dimensions, questions, scoring formula and visual identity change only if a material defect is found.
- **Verdict:** **engineering complete; not ready to publish.** Every remaining blocker is external: legal, research, or production environment.
- **Constraint honored:** Version 2 is **not published**, and **no production data has been modified**. The draft has been loaded and published only in local test databases.

## A. Engineering work — complete

| # | Item | Status | Evidence |
|---|---|---|---|
| E1 | Five-dimension, 25-item draft with the owner's EE5 and SI3 wording | Done | Draft loader; content fingerprint `8ef7dd86…` checked by test |
| E2 | Current-versus-desired ratings retained; scoring formula unchanged | Done | Document 5 |
| E3 | N/A preserved on LE3, OE3, SI3 and SI5 | Done | Rehearsal stores N/A on all four |
| E4 | At least 4 valid current ratings per dimension required for the overall index | Done | `engine.test.ts` |
| E5 | Respondents short in one dimension still count in their eligible dimensions; counts shown per dimension and for the index; privacy thresholds applied to every population | Done | `engine.test.ts`, `privacy.test.ts`, rehearsal |
| E6 | Statistical implications of separate populations documented and tested | Done | Document 5, section 5.9; `engine.test.ts` |
| E7 | Atomic release: assessment version, scoring rules and compatible AI instructions published together or not at all | Done | New migration; `release-publication.integration.test.ts`, including rollback |
| E8 | Website and application caches invalidated immediately after publication | Done | Rehearsal: homepage and framework page show Version 2 on the first request |
| E9 | History separates Version 1 and Version 2; no change calculated across versions | Done | Rehearsal |
| E10 | Reports, PDF and AI input for five dimensions (SI without sub-scores) | Done | `ai.test.ts`, `render.test.ts`, rehearsal PDF |
| E11 | Version 1, its scoring rules and all historical results preserved | Done | Stored results byte-for-byte identical after the local release |
| E12 | Abstract brand mark independent of dimension count | Done | Document 8, item 11 |
| E13 | FLAME separation stated; ROHA is not an implementation of FLAME | Done | Documents 1, 7 and the provenance record |
| E14 | Automated verification: type-check, lint, build, unit and database tests; the Version 1 end-to-end journey and the Version 2 transition rehearsal | Passing locally | CI must also pass on the final commit (C7) |

## B. External legal and intellectual property — outstanding

| # | Requirement | Owner | Status |
|---|---|---|---|
| L1 | **Independent screening of all 25 items against licensed copies** of relevant instruments; **EE5 first** (its wording is close to job-design autonomy items) | IP counsel / licensed reviewer | **Outstanding** |
| L2 | IP counsel review of the prelaunch package, including AI-assisted authorship | IP counsel | **Outstanding** |
| L3 | **Trademark clearance** for "ROHA", the full name, taglines and the new brand mark | Trademark counsel | **Outstanding** |
| L4 | **Legal pages:** Terms of Service placeholders ("[State]" twice; refund policy) and Privacy Policy template review | Counsel | **Outstanding** |
| L5 | Written owner sign-off of the 25 items (fingerprint `8ef7dd86…`), plus written confirmation that they do not reproduce FLAME content | You | **Outstanding** (prelaunch review, 7.4) |

## C. External research and methodology — outstanding

| # | Requirement | Owner | Status |
|---|---|---|---|
| R1 | **Independent research review:** constructs, the integrated SI dimension, the inclusion rule and separate populations (document 5, 5.9) | Research / psychometrics specialist | **Outstanding** |
| R2 | Pilot protocol: pre-registered criteria (desired-state ceiling, SI unidimensionality, share of partially eligible respondents), cognitive interviews (SI3 reading level) and consent for research use | You and the specialist | **Outstanding** |

## D. Production environment — outstanding

Nothing below has been tested in production. All code paths have been exercised only against local services, Stripe test mode or mocked AI calls.

| # | Requirement | What to verify | Status |
|---|---|---|---|
| C1 | Supabase production project | Migrations applied, including `20260927000100`; RLS enabled; service-role key only in server environment variables; backups enabled | **Outstanding** |
| C2 | Authentication email (SMTP) | Verification and password-reset emails delivered from the production domain | **Outstanding** |
| C3 | Anthropic API | Server-side key and model; one real report generated and validated | **Partly done.** A live AI report (`claude-opus-5`) was generated end to end on a local database on September 26, 2026, with the PDF. It found two checker false alarms and one wording error, all fixed. **Still needed:** a new key (the test key was shared in chat and must be revoked) configured in production, and one production report |
| C4 | Stripe live mode | Live keys, webhook secret and prices; one real checkout, renewal and cancellation | **Outstanding** |
| C5 | Application secrets | `ROHA_TOKEN_SECRET`, `CRON_SECRET`, `ROHA_PLATFORM_ADMIN_EMAILS` | **Outstanding** |
| C6 | Deployment | App deployed; `NEXT_PUBLIC_APP_URL` set; retention cron running; error log reviewed | **Outstanding** |
| C7 | CI on the deployed commit | GitHub Actions passes | Pending on the final push |
| C8 | Production deployment tests | End-to-end smoke test on production (or a staging copy): registration, survey, close, results, report, PDF, billing. Then the Version 2 release steps below | **Outstanding** |

## E. Publication steps (only after B, C and D are complete)

1. Deploy the approved commit. This applies migration `20260927000100`, which adds a schema column and a function and changes no assessment content.
2. Back up the production database.
3. Run `supabase/drafts/assessment_v2_draft.sql` once. It creates drafts only.
4. In Super Admin → Assessment versions → version 2: confirm that the checklist is green, then click **Publish release**.
5. Confirm that the homepage shows five dimensions, then run one test campaign in a test organization.

## F. Scope

ROHA is no longer being expanded. The optional items listed in documents 6–8 (SI grouping captions, gap-chart SI note, item-level crosswalk trend, a Version 2 demonstration campaign) are **not** planned for the pilot.
