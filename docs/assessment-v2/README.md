# ROHA Assessment Version 2 — Five-Dimension Framework

- **Status:** framework and items **approved by the owner on September 26, 2026, subject to licensed IP screening**. Application support is implemented and tested. **Not published; not loaded into any production database.**
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Date:** September 26, 2026
- **Supersedes:** the earlier six-by-four Version 2 draft (retained in git history)
- **Builds on:** [Prelaunch IP and methodological independence review](../prelaunch-review/README.md)
- **Start here:** [Publication readiness report](10-publication-readiness-report.md), which lists every remaining blocker

## Owner decisions implemented

1. **Five dimensions × five items (25 items, 50 ratings):** Leadership Effectiveness · Organizational Culture · Employee Engagement · Operational Effectiveness · Strategic Alignment & Innovation.
2. **EE5:** "I have appropriate freedom to decide how to accomplish my work."
3. **SI3:** "This organization adapts effectively when circumstances change."
4. **Current-versus-desired ratings retained for the pilot; scoring formula unchanged.**
5. **Inclusion rule:** a respondent is included only with at least 4 valid current-state ratings in every dimension; N/A and incomplete answers are handled and reported transparently. (The earlier 13-of-25 proposal was not approved.)
6. **FLAME and ROHA are separate.** ROHA is not an implementation of FLAME.
7. **Logo:** the six-segment hexagon is replaced by an abstract mark that does not depend on the number of dimensions.
8. **Application changes** for five dimensions and 25 questions, including a history chart that separates Version 1 and Version 2 and calculates no change across them.
9. IP review package and methodology updated.
10. Version 1, its scoring rules and every historical result preserved.

## Contents

| # | Document | Covers |
|---|---|---|
| 1 | [Framework](01-framework.md) | Structure; five aspects per dimension; the integrated Strategic Alignment & Innovation construct; independence from FLAME and OCAI |
| 2 | [Item disposition](02-item-disposition.md) (+ [CSV](v2-items.csv)) | What happened to each v1 item; all 25 v2 items with source, construct and reason; the owner's final edits |
| 3 | [Item quality review](03-item-quality-review.md) | Clarity, reading level, one concept per item, leading language, distinguishability, independence; EE5 screening flag |
| 4 | [Desired-state methodology review](04-desired-state-review.md) | Ceiling analysis; owner decision (Option A: retain and test) |
| 5 | [Scoring specification](05-scoring-specification.md) | Unchanged formula; per-dimension inclusion rule; transparent exclusions; cross-version comparability |
| 6 | [Dashboard specification](06-dashboard-specification.md) | Five-dimension views; version-separated history (implemented) |
| 7 | [Executive reporting specification](07-executive-reporting-specification.md) | Sections A–L; SI treatment in H and I; AI instructions v2; PDF (implemented) |
| 8 | [Engineering changes](08-engineering-changes-before-publication.md) | The twelve changes plus rules pairing and inclusion rule: implemented and tested |
| 9 | [Claims corrections](09-claims-corrections.md) | Development-status wording |
| 10 | [Publication readiness report](10-publication-readiness-report.md) | Every remaining blocker and the publication sequence |
| — | [Methodology document](../prelaunch-review/05-methodology-specification.md) | Version 1 and Version 2 construct specifications; inclusion rules; comparability |
| — | [Draft loader](../../supabase/drafts/assessment_v2_draft.sql), [its test](../../src/test/assessment-v2-draft.integration.test.ts) and [local transition rehearsal](../../e2e/v2-transition.mjs) | Creates assessment v2, scoring rules v2 and AI instructions v2 as **drafts only**; the rehearsal publishes them on a local database only |

## Summary

| Topic | Result |
|---|---|
| v1 items | 11 retained (6 moved into the new dimension; SI3 differs from v1 IA2 only in its first word), 11 revised, 1 combined (SA4 → SI2), 1 replaced (IA3) |
| New items | OC5 learning from mistakes · EE5 autonomy (owner wording) · OE5 procedural clarity |
| Strategic Alignment & Innovation | One construct: direction known → acted on → adapted → ideas welcomed → ideas enabled (SI1–SI5); no sub-scores |
| Item quality | No double-barreled items; no redundant pairs; mean estimated reading grade 8.6 (v1: 10.6); SI3 estimated at grade 19.2 (check in cognitive interviews) |
| Independence | Items flagged in the prelaunch review rewritten; EE5 is the priority for licensed screening; all items still require screening |
| Scoring | Formula unchanged; inclusion rule of 4 valid current ratings per dimension (20 of 25 minimum); exclusions shown with reasons |
| Comparability | Version 1 and Version 2 overall and dimension scores are not compared; 10 items identical and 1 near-identical across versions |
| Application | Implemented and tested (104 automated tests; local end-to-end rehearsal of publication) |
| Publication | **Blocked** pending IP screening, professional reviews, written sign-offs, one owner decision (N/A on SI3 and SI5) and production credential testing (document 10) |
