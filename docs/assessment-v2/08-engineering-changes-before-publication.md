# 8. Engineering Changes Required Before Version 2 Can Be Published

**None of these changes has been made.** They are listed so you can see the full cost of adopting Version 2. They would be implemented only after you approve the Version 2 content. Each preserves Version 1 behavior for existing campaigns.

**Safety lock in place today:** the super-admin publication checklist (`src/app/admin/assessments/readiness.ts`) requires exactly six dimensions of four items, so a five-by-five version **cannot be published by accident**.

| # | Area | File(s) | Current assumption | Required change | Why required |
|---|---|---|---|---|---|
| 1 | Publication checklist | `src/app/admin/assessments/readiness.ts`, `src/app/admin/assessments/[versionId]/page.tsx` | Exactly 6 × 4 | Accept the approved structure (e.g. every dimension has the same number of items, 4–6, and at least 5 dimensions), or a per-version expected structure | Otherwise Version 2 cannot be published |
| 2 | AI report schema | `src/lib/ai/report-schema.ts` | `dimension_key` limited to the six v1 keys; sections D–I tied to v1 dimensions | Validate `dimension_key` against the campaign's own dimensions; version-aware mapping of sections D–I (document 7, 7.1) | AI and rules-based reports for Version 2 campaigns would fail validation |
| 3 | AI request | `src/lib/ai/anthropic-report.ts` | Task text lists sections D–I by v1 dimension | Generate section guidance from the campaign's framework | Correct instructions to the model |
| 4 | Rules-based summary | `src/lib/ai/rules-report.ts` | "six dimensions" text; v1 section mapping | Dimension-count text; version-aware mapping | Discover plan and fallback reports |
| 5 | Report view and PDF | `src/components/app/report-view.tsx`, `src/lib/reports/pdf/*` | Uses the v1 section mapping; "six-dimensional" titles | Data-driven titles; H/I per document 7 | Correct report rendering |
| 6 | Numeric validator | `src/lib/ai/validate.ts` | Structural numbers include 6, 24, 48 | Add 5, 25, 50 | Avoid false "unsupported number" warnings |
| 7 | Historical trend | `src/lib/results/service.ts` (`TrendPoint`), `src/components/dashboard/trend-chart.tsx`, `src/app/app/history/page.tsx` | Connects all campaigns | Include assessment version per point; break and caveat across versions (document 6) | Prevents misleading comparisons |
| 8 | Dashboard subtitle | `src/components/dashboard/results-sections.tsx` | "Six dimensions…" | Count from data | Accuracy |
| 9 | Survey welcome text | `src/components/survey/survey-app.tsx` | "six areas … 24 statements" | Counts and dimension names from the survey definition | Accuracy for employees |
| 10 | Public website copy | `src/app/(marketing)/*` (home, framework, how it works, features, about, terms), `src/app/app/campaigns/new/page.tsx` | "six dimensions", "24 statements" | Update at publication, or derive counts from the published framework | Accuracy; the framework page itself already reads the published version from the database |
| 11 | Brand mark description | `src/components/brand/logo.tsx` (comment), any brand guidance | Hexagon mark "six segments … the six dimensions" | **Owner decision:** keep the hexagon as a general brand mark (no dimension symbolism), or commission a five-part mark | Brand consistency |
| 12 | Tests | `src/lib/ai/*.test.ts`, `src/lib/reports/pdf/render.test.ts`, e2e | v1 fixtures only | Add five-by-five fixtures for reports and PDF; e2e run on a published Version 2 in a test database | Verification |

**Not required:** scoring engine, survey submission function, privacy/suppression logic, segment analysis, database schema. All are structure-agnostic, and the five-by-five draft is tested against the engine.

**Order of operations after approval:**
1. Licensed-instrument screening and owner sign-off of wording.
2. Items 1–12 implemented and tested.
3. Run the draft loader in production (creates drafts only).
4. Review in Super Admin.
5. Publish assessment v2 and scoring rules v2; activate AI instructions v2.
6. Update public copy (item 10).
