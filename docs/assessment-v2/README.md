# ROHA Assessment Version 2 — Five-Dimension Framework

- **Status:** **framework frozen** and approved for the pilot (September 26, 2026), subject to independent legal and methodological review. Engineering is complete. **Not published; not loaded into any production database.**
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Date:** September 26, 2026
- **Supersedes:** the earlier six-by-four Version 2 draft (retained in git history)
- **Builds on:** [Prelaunch IP and methodological independence review](../prelaunch-review/README.md)
- **Start here:** [Final readiness checklist](10-publication-readiness-report.md), which separates completed engineering from outstanding external requirements

## Owner decisions implemented

1. **Five dimensions × five items (25 items, 50 ratings):** Leadership Effectiveness · Organizational Culture · Employee Engagement · Operational Effectiveness · Strategic Alignment & Innovation.
2. **EE5:** "I have appropriate freedom to decide how to accomplish my work."
3. **SI3:** "This organization adapts effectively when circumstances change."
4. **Current-versus-desired ratings retained for the pilot; scoring formula unchanged.**
5. **Inclusion rule:** at least 4 valid current-state ratings per dimension. A respondent counts in each dimension where this is met, and in the overall index only when it is met in every dimension. N/A is preserved, and respondent counts are shown for each population.
6. **FLAME and ROHA are separate.** ROHA is not an implementation of FLAME.
7. **Logo:** the six-segment hexagon is replaced by an abstract mark that does not depend on the number of dimensions.
8. **Application changes** for five dimensions and 25 questions, including a history chart that separates Version 1 and Version 2 and calculates no change across them.
9. IP review package and methodology updated.
10. Version 1, its scoring rules and every historical result preserved.
11. **Final adjustments:** atomic release publication (assessment version, scoring rules and AI instructions together); immediate cache invalidation; statistical implications documented and tested (document 5, 5.9).

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
| 10 | [Final readiness checklist](10-publication-readiness-report.md) | Completed engineering versus external legal, research and production requirements |
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
| Scoring | Formula unchanged; per-dimension eligibility (4 of 5); overall index on respondents eligible everywhere; populations reported |
| Comparability | Version 1 and Version 2 overall and dimension scores are not compared; 10 items identical and 1 near-identical across versions |
| Application | Implemented and tested (automated tests plus a local end-to-end rehearsal of the atomic release) |
| Publication | **Blocked** only by external requirements: IP screening, research review, trademark, legal pages, sign-offs, production credentials and deployment tests (document 10) |
