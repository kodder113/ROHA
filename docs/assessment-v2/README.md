# ROHA Assessment Version 2 — Five-Dimension Draft for Owner Review

- **Status:** Proposed. **Not approved, not published, not loaded into any production database.**
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Date:** September 26, 2026
- **Supersedes:** the earlier six-by-four Version 2 draft (retained in git history)
- **Builds on:** [Prelaunch IP and methodological independence review](../prelaunch-review/README.md)

## Owner direction implemented

- **Five dimensions × five items (25 items, 50 ratings):** Leadership Effectiveness · Organizational Culture · Employee Engagement · Operational Effectiveness · Strategic Alignment & Innovation.
- The five-part structure follows the structural philosophy of the owner's FLAME framework. ROHA remains an independent assessment: no FLAME or OCAI content was used.
- Version 1 and all historical results are preserved. Nothing is published and no production data is modified.

## Contents

| # | Document | Covers |
|---|---|---|
| 1 | [Framework](01-framework.md) | Structure; five aspects per dimension; the integrated Strategic Alignment & Innovation construct; rationale; independence from FLAME and OCAI |
| 2 | [Item disposition](02-item-disposition.md) (+ [CSV](v2-items.csv)) | What happened to each of the 24 v1 items (retained / revised / combined / replaced) and all 25 v2 items with source, construct and reason |
| 3 | [Item quality review](03-item-quality-review.md) | Clarity, reading level, one concept per item, leading language, consistency, distinguishability, independence |
| 4 | [Desired-state methodology review](04-desired-state-review.md) | **Completed before any scoring change.** Item-by-item ceiling analysis, recommendation, owner options |
| 5 | [Scoring specification](05-scoring-specification.md) | Unchanged method; scoring rules v2 draft; cross-version comparability rules |
| 6 | [Dashboard specification](06-dashboard-specification.md) | Five-dimension views; version-aware historical trend |
| 7 | [Executive reporting specification](07-executive-reporting-specification.md) | Sections A–L mapping; SI treatment in sections H and I; AI instructions v2 draft; PDF |
| 8 | [Engineering changes before publication](08-engineering-changes-before-publication.md) | Twelve changes needed to support Version 2 (not made) |
| 9 | [Claims corrections](09-claims-corrections.md) | Development-status wording (from the previous round) |
| — | [Methodology document](../prelaunch-review/05-methodology-specification.md) | Updated: Version 1 and Version 2 construct specifications; construct research vs. validation of ROHA |
| — | [Draft loader](../../supabase/drafts/assessment_v2_draft.sql) and [its test](../../src/test/assessment-v2-draft.integration.test.ts) | Creates assessment v2, scoring rules v2 and AI instructions v2 as **drafts only** when run |

## Summary

| Topic | Result |
|---|---|
| v1 items | 10 retained (5 moved into the new dimension), 12 revised, 1 combined (SA4 → SI2), 1 replaced (IA3) |
| New items | OC5 learning from mistakes · EE5 autonomy · OE5 procedural clarity |
| Strategic Alignment & Innovation | One construct: direction known → acted on → adapted → ideas welcomed → ideas enabled (SI1–SI5). Leadership behaviors about direction stay in Leadership (LE2, LE5) |
| Item quality | No double-barreled items; no redundant pairs; mean estimated reading grade 8.1 (v1: 10.6) |
| Independence | Items flagged in the prelaunch review rewritten; new items avoid known phrasing patterns; licensed screening still required |
| Desired-state review | Ceiling likely for 22 of 25 items; informative for EE5, SI3, SI4. **Recommendation: retain the rating with the new labels and test it in a pilot. No scoring-engine change.** |
| Scoring | Method unchanged; only the validity threshold goes from 12 to 13 (rules v2 draft). Engine verified on five-by-five data |
| Comparability | Version 1 and Version 2 overall and SI scores are not directly comparable; 10 items with identical wording are comparable at item level |
| Before publication | 12 engineering changes (document 8). The admin checklist currently blocks publishing a five-by-five version, which prevents accidental publication |

## Decisions needed from you

1. Approve, edit or reject the framework (document 1), including the integrated Strategic Alignment & Innovation definition.
2. Approve, edit or reject the 25 items (documents 2–3). Record your approval and edits as the human-authorship record.
3. Choose the desired-state option (document 4, 4.5); **A (retain and test) is recommended**.
4. Confirm that ROHA's five dimensions, definitions and items do not reproduce FLAME content (document 1, 1.4).
5. Decide whether the hexagon brand mark keeps its "six dimensions" meaning (document 8, item 11).
6. After screening against licensed instruments, authorize the engineering changes (document 8) and then publication.
