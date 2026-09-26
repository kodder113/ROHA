# ROHA Assessment Version 2 — Draft for Owner Review

- **Status:** Proposed. **Not approved, not published, not loaded into any production database.**
- **Prepared for:** Dr. Oscar A. Rodriguez, DSL — Rodrik Consulting LLC
- **Date:** September 26, 2026
- **Builds on:** [Prelaunch IP and methodological independence review](../prelaunch-review/README.md)

## Scope (as instructed)

- Structure retained: **six dimensions × four questions**, current and desired ratings on the same 1–5 scale, N/A on the same items.
- Assessment quality only. No application features or redesign.
- Version 1 and all historical results preserved. Nothing published; no production data modified.

## Contents

| # | Document | Owner instruction |
|---|---|---|
| 1 | [Version 1 vs Version 2 comparison: all 24 items with original, proposed revision, reason and intended construct](01-v1-v2-comparison.md) (also as [CSV](v1-v2-comparison.csv)) | 1, 2, 3, 4, 8 |
| 2 | [Quality review of all 24 items: clarity, reading level, consistency, independence](02-item-quality-review.md) | 5 |
| 3 | [Desired-state rating: item-by-item informativeness and ceiling-effect review](03-desired-state-review.md) | 6 |
| 4 | [Claims review and corrections](04-claims-corrections.md) | 7 |
| 5 | [Methodology document, updated to separate construct research from validation of ROHA](../prelaunch-review/05-methodology-specification.md) | 10 |
| — | [Version 2 draft loader script (not run)](../../supabase/drafts/assessment_v2_draft.sql) and its [automated test](../../src/test/assessment-v2-draft.integration.test.ts) | 9 |

## Summary of proposed changes

| Owner item | Result |
|---|---|
| 1. EE2, EE3, OE2 independently expressed | Rewritten. No shared phrasing identified with the proprietary engagement-survey items noted in the prelaunch review. |
| 2. LE2 / SA3 overlap | LE2 now measures whether leadership has set a clear direction. SA3 now measures whether leaders explain what priorities mean for the employee's team. |
| 3. OC2 and OE1: one concept each | OC2 measures equal respect across backgrounds; OE1 measures only the absence of unnecessary process steps. |
| 4. OE4 wording and definition aligned | Label and dimension definition now say "clarity of responsibilities", matching the item. Wording simplified. |
| 5. All 24 reviewed | 13 revised, 11 unchanged. Mean estimated reading grade 10.6 → 8.6; items above grade 12: 10 → 4. |
| 6. Desired-state informativeness | High ceiling risk for 22 items; moderate for IA1 and IA2. Desired rating retained (structure approved). Rating labels reworded; pilot test criterion proposed. |
| 7. Misleading claims | Five copy corrections made in the application and README (e.g. "organizational diagnostic" → "organizational health assessment in its initial release"; "evidence-based" removed). One database item (AI instructions v1 wording) is pending your approval. |
| 8. Comparison | Document 1 and the CSV. |
| 9. Version 1 preserved | Nothing published. The draft loader creates an unpublished draft only when run and is tested to leave Version 1 (content fingerprint unchanged) and historical scores untouched. |
| 10. Methodology | Section 5.4 added: construct research versus empirical validation of ROHA, validation status by source of evidence, and permitted wording. |

## Before approving Version 2

1. Review documents 1–4.
2. Have the research specialist review the wording and the desired-state recommendation.
3. **Screen all 24 Version 2 items against licensed copies of relevant instruments** and record the result (prelaunch recommendation R2). The comparisons here were made from recollection, not licensed copies.
4. Record your approval of the final wording, including any edits (human-authorship record; prelaunch recommendation R4).
5. Decide whether to approve the pending AI-instructions wording change (document 4).

## After approval (not yet done)

1. Load the draft into the target database by running `supabase/drafts/assessment_v2_draft.sql`, or create it manually in Super Admin → Assessments → *Create new draft version*. The result is a **draft**; organizations cannot see or use it.
2. Review the draft in Super Admin; make any final edits there.
3. Publish Version 2 and retire Version 1 in Super Admin. New campaigns then use Version 2. Any campaign on Version 1 keeps its questions, scores and reports. This is enforced by the database and covered by automated tests.
