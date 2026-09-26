# 5. Scoring Specification — Assessment Version 2 with Scoring Rules Version 2 (draft)

**Summary:** the scoring **method** is unchanged. Only one configuration value changes (the validity threshold), and it is stored as a new scoring-rules version. No scoring-engine code changes are required: the engine handles any number of dimensions and items, and the five-by-five structure is verified by an automated test.

## 5.1 Inputs

| Element | Specification |
|---|---|
| Items | 25 (5 dimensions × 5) |
| Perspectives | Current state; desired state |
| Scale | 1 Strongly disagree · 2 Disagree · 3 Neither agree nor disagree · 4 Agree · 5 Strongly agree |
| Not Applicable | Allowed on LE3, OE3, SI3, SI5; excluded from averages, counted separately |
| Completeness at submission | Every item needs a rating or N/A for both perspectives (enforced by the database, unchanged) |
| Ratings per respondent | 50 |

## 5.2 Calculations (unchanged from rules v1)

| Quantity | Rule |
|---|---|
| Normalized item score | ((mean valid rating − 1) / 4) × 100, per item and perspective |
| Dimension score | Equal-weighted mean of the item scores with data (5 items) |
| Overall health index | Equal-weighted mean of dimension scores: **each dimension 20%** (v1: 16.7%) |
| Gap | Desired − current, at item, dimension and overall level |
| Gap categories | Aligned (< 10), notable (10–19.9), substantial (≥ 20 points), with direction |
| Descriptive bands | 0–39, 40–59, 60–79, 80–100: interpretive aids, not validated cut-offs |
| Preserved statistics | Distributions (1–5 counts), n, N/A count, missing count, mean, SD for every item and perspective |

## 5.3 Configuration changes (scoring rules v2 draft)

| Setting | Rules v1 | Rules v2 (draft) | Reason |
|---|---|---|---|
| `minValidCurrentRatings` | 12 (of 24) | **13 (of 25)** | Keeps the policy "at least half of the current-state ratings are numeric" |
| All other settings | — | Identical | — |

Scoring rules v2 is created as a **draft** by `supabase/drafts/assessment_v2_draft.sql`. When published, new campaigns use it; campaigns on rules v1 keep v1.

## 5.4 Strategic Alignment & Innovation

The SI dimension score is the equal-weighted mean of SI1–SI5, like every other dimension. **No sub-scores** are calculated for "alignment" (SI1–SI2) or "adaptive innovation" (SI3–SI5): two- and three-item sub-scores would be unreliable and are not validated. Reports may discuss these aspects using the item-level scores. If the pilot shows the dimension is two-dimensional, a later scoring-rules version could define sub-scores or split the dimension (owner decision).

## 5.5 Comparability between versions

| Comparison | Allowed? | Rule |
|---|---|---|
| Overall index, v1 campaign vs. v2 campaign | **Not directly comparable** | Different items, dimensions and weights. Trend displays must mark the version change and must not draw a continuous line across it without a caveat. |
| LE, OC, EE, OE dimension scores, v1 vs. v2 | **Partially comparable, with caveat** | Same dimension keys, but each gained an item and some items were revised |
| SI (v2) vs. SA or IA (v1) | **Not comparable** | New integrated construct |
| Item-level, unchanged wording | **Comparable** | LE1, LE3, LE4, OC3, OC4, EE1, EE4, and SI1/SI4/SI5 (v1 SA1/IA1/IA4, same wording) |
| Item-level, revised wording | **Not comparable** | Treat as new items |
| Within the same version | Comparable | As today |

**Item crosswalk** (identical wording): LE1↔LE1, LE3↔LE3, LE4↔LE4, OC3↔OC3, OC4↔OC4, EE1↔EE1, EE4↔EE4, SA1↔SI1, IA1↔SI4, IA4↔SI5.

## 5.6 Privacy thresholds (unchanged)

Minimum group size 5; complementary suppression; one attribute filtered at a time; results released after the campaign closes; item cells rated by fewer than 5 people hidden.

## 5.7 Desired-state treatment

Per the completed review (document 4): desired ratings are retained and scored as in v1. Gaps are reported as priority indicators, and negative gaps are never automatically treated as problems. The pilot criteria in 4.4 decide any future change to the response model.

## 5.8 Verification

`src/test/assessment-v2-draft.integration.test.ts` checks that:
- the draft creates 5 × 5 items and draft rules v2 (identical to v1 except `minValidCurrentRatings` = 13);
- the unchanged engine scores a 25-item response set, with the overall index equal to the mean of the five dimension scores;
- Version 1 content and historical scores are unchanged.
