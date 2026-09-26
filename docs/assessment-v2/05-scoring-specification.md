# 5. Scoring Specification — Assessment Version 2 with Scoring Rules Version 2 (draft)

**Summary:** the scoring **formula is unchanged** (owner decision, September 26, 2026; framework frozen). What changes is **who is counted where** (owner decisions, September 26, 2026):

- A respondent counts in a **dimension** when it has at least 4 valid current-state ratings in that dimension.
- A respondent counts in the **overall organizational health index** only when that holds in **every** dimension.
- A respondent who falls short in one dimension is **not discarded**: their answers still count in every dimension where they are eligible.
- N/A remains available on LE3, OE3, SI3 and SI5.

The earlier proposal of 13 valid ratings out of 25 was not approved. Scoring engine 1.2 implements this only for scoring rules that set `minValidCurrentPerDimension`, so scoring rules v1 and all Version 1 results behave exactly as before.

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
| Overall health index | Equal-weighted mean of dimension scores: **each dimension 20%** (v1: 16.7%). Rules v2: computed on the respondents eligible for every dimension (5.3) |
| Gap | Desired − current, at item, dimension and overall level |
| Gap categories | Aligned (< 10), notable (10–19.9), substantial (≥ 20 points), with direction |
| Descriptive bands | 0–39, 40–59, 60–79, 80–100: interpretive aids, not validated cut-offs |
| Preserved statistics | Distributions (1–5 counts), n, N/A count, missing count, mean, SD for every item and perspective |

## 5.3 Inclusion rule (scoring rules v2)

| Setting | Rules v1 | Rules v2 (draft) | Meaning |
|---|---|---|---|
| `minValidCurrentPerDimension` | not set | **4** | Eligibility for a dimension: at least 4 of its 5 current-state ratings are numeric |
| `minValidCurrentRatings` | 12 (of 24) | **20 (of 25)** | Overall minimum, implied by being eligible in all five dimensions |
| `assessmentVersion` | not set (= 1) | **2** | Pairs the rules with assessment version 2 |
| All other settings | — | Identical | — |

**Populations.**

| Statistic | Respondents used |
|---|---|
| Item results (current and desired) | Respondents eligible for the item's dimension |
| Dimension score, gap, distribution, n | Respondents eligible for that dimension |
| Overall current and desired index, overall gap | Respondents eligible for **every** dimension; the index is the equal-weighted mean of dimension scores **recomputed on this population** |
| "Not counted" | Respondents eligible for no dimension |

Only current-state ratings decide eligibility; desired ratings of eligible respondents are always used. N/A and blank answers never count as ratings.

**What happens in practice.** The survey requires a rating or N/A for every item. N/A is offered on LE3, OE3, SI3 and SI5, so the only way to fall short is to answer N/A to both SI3 and SI5. Such a respondent now counts in LE, OC, EE and OE, but not in SI or the overall index. (This replaces the earlier behavior, which discarded the respondent entirely; the open owner decision on this point is resolved.)

**Transparency.**

| Where | What is shown |
|---|---|
| Dashboard tiles | "In overall index: N", with "M more counted in some dimensions only" and "K not counted" |
| Current health index tile | "Based on N respondents" |
| Dimensional analysis | n per dimension |
| Methodology note | The rule in words; that the index can differ from the average of the dimension scores; counts by dimension and cause, including N/A |
| PDF | Methodology table (rule), participation section (populations and reasons), index section (population note), limitations (populations) |
| AI report input | Counts only (`partialResponses`, per-dimension respondents, reasons); the AI must state the populations in limitations and never call the index the average of dimension scores |
| Rules-based summary | The same limitation |
| Segment views | Only per-cell respondent thresholds; no exclusion detail |

**Privacy (unchanged thresholds, applied to each population).**
- Results are released only when at least 5 respondents contribute to some score.
- Every dimension, item and segment cell is hidden when its own n is below 5.
- The overall index is hidden when fewer than 5 respondents are eligible for every dimension.
- Segment group sizes, and complementary suppression, count **every contributing respondent**, so a person counted only in some dimensions is still protected by the group threshold.

Tested in `src/lib/privacy/privacy.test.ts`.

**Historical results.** Stored results are reused within the same engine major version, so the engine update recomputes no Version 1 result.

## 5.4 Strategic Alignment & Innovation

The SI dimension score is the equal-weighted mean of SI1–SI5, like every other dimension. **No sub-scores** are calculated for "alignment" (SI1–SI2) or "adaptive innovation" (SI3–SI5): two- and three-item sub-scores would be unreliable and are not validated. Reports may discuss these aspects using the item-level scores. If the pilot shows the dimension is two-dimensional, a later scoring-rules version could define sub-scores or split the dimension (owner decision).

## 5.5 Comparability between versions

**History chart rule (implemented).** Each assessment version is drawn as its own series with a different line style; no line connects a Version 1 point to a Version 2 point; a vertical marker shows where a new version begins; dimension series are selected per version; and **no change in the overall organizational health index (or any dimension score) is calculated across versions.** The history table lists each assessment's version.

| Comparison | Allowed? | Rule |
|---|---|---|
| Overall index, v1 campaign vs. v2 campaign | **Not directly comparable** | Different items, dimensions and weights. Trend displays must mark the version change and must not draw a continuous line across it without a caveat. |
| LE, OC, EE, OE dimension scores, v1 vs. v2 | **Partially comparable, with caveat** | Same dimension keys, but each gained an item and some items were revised |
| SI (v2) vs. SA or IA (v1) | **Not comparable** | New integrated construct |
| Item-level, unchanged wording | **Comparable** | LE1, LE3, LE4, OC3, OC4, EE1, EE4, and SI1/SI4/SI5 (v1 SA1/IA1/IA4, same wording); SI3 (v1 IA2) with the one-word change noted |
| Item-level, revised wording | **Not comparable** | Treat as new items |
| Within the same version | Comparable | As today |

**Item crosswalk** (identical wording): LE1↔LE1, LE3↔LE3, LE4↔LE4, OC3↔OC3, OC4↔OC4, EE1↔EE1, EE4↔EE4, SA1↔SI1, IA1↔SI4, IA4↔SI5. **Near-identical:** IA2↔SI3 ("The" → "This"). Item-level comparisons also depend on the inclusion rule, which differs between versions; the item crosswalk is not yet displayed in the application.

## 5.6 Privacy thresholds (unchanged)

Minimum group size 5; complementary suppression; one attribute filtered at a time; results released after the campaign closes; item cells rated by fewer than 5 people hidden.

## 5.7 Desired-state treatment

Per the completed review (document 4): desired ratings are retained and scored as in v1. Gaps are reported as priority indicators, and negative gaps are never automatically treated as problems. The pilot criteria in 4.4 decide any future change to the response model.

## 5.8 Verification

- `src/lib/scoring/engine.test.ts`: per-dimension eligibility; respondents counted in eligible dimensions only; overall index on the fully eligible population; the divergence case in 5.9; equivalence when everyone is eligible; rules v1 unaffected; cache compatibility.
- `src/lib/privacy/privacy.test.ts`: suppression of the overall index, of dimensions and of segment cells for each population; segment sizes count every contributor.
- `src/test/release-publication.integration.test.ts`: atomic release publication (document 8).
- `src/lib/scoring/pairing.test.ts`: rules are paired with their assessment version; the publication checklist accepts 6 × 4 and 5 × 5 and requires matching published rules.
- `src/test/assessment-v2-draft.integration.test.ts`: the draft creates 5 × 5 items with the approved wording and draft rules v2 (`minValidCurrentRatings` 20, `minValidCurrentPerDimension` 4, `assessmentVersion` 2; otherwise identical to v1); drafts are invisible to organizations; Version 1 content and historical scores are unchanged.
- `src/lib/ai/ai.test.ts` and `src/lib/reports/pdf/render.test.ts`: reports and PDFs for five dimensions, including exclusions.
- `e2e/v2-transition.mjs` (local database only):
  - a Version 1 campaign;
  - the atomic release in the admin portal;
  - immediate website refresh;
  - a Version 2 campaign with N/A answers and one partially eligible respondent;
  - the history chart, a report and a PDF.

  Version 1 and demo results stay byte-for-byte unchanged after publication.

## 5.9 Statistical implications of separate populations

Allowing a respondent to count in some dimensions but not the overall index means that different statistics can rest on different respondents. The implications, and how ROHA handles each, are:

| # | Implication | Consequence | Handling |
|---|---|---|---|
| 1 | **The overall index is not always the average of the displayed dimension scores.** It is computed on the respondents eligible everywhere; each displayed dimension score uses everyone eligible for that dimension. | Readers who average the dimension scores can get a different number. In an extreme test case (5 respondents rating 5 everywhere; 5 rating 1 but N/A on SI3 and SI5), the dimension scores average 60 while the overall index is 100. | The overall index keeps one consistent population, as the owner specified. The dashboard, PDF and AI instructions state that the two can differ, and give both respondent counts. Tested in `engine.test.ts` ("statistical implications…"). |
| 2 | **Dimension scores are not all based on the same people.** Comparing SI with LE compares slightly different groups. | Differences between dimensions could partly reflect who answered, not only what they think. | Respondent counts (n) are shown for every dimension. In practice only respondents with N/A on both SI3 and SI5 differ, so any difference is limited to SI. |
| 3 | **Selection bias.** Respondents who answer N/A to both SI3 and SI5 may differ systematically (for example, newer or front-line staff without visibility of organizational change). | The SI score and the overall index slightly under-represent them; their views still count in the other four dimensions. | The number affected is always reported. The pilot should record how often this happens and whether these respondents differ on other dimensions. |
| 4 | **Gaps are consistent within each statistic.** Current and desired scores for a dimension (and for the index) use the same population. | A gap never mixes populations. | By construction; tested. |
| 5 | **Small-group risk rises for partial populations.** A dimension can have fewer respondents than the whole group. | A cell could fall below 5 while others do not. | Every cell is suppressed independently when n < 5; the overall index is suppressed when its population is below 5; tested. |
| 6 | **Subtraction across populations.** Organization-wide n for SI (e.g. 6) differs from n for LE (e.g. 7), which reveals how many people answered N/A to both SI3 and SI5. | This reveals a count, not any rating, and only at organization level or in groups that are already at least 5. | Accepted as the cost of transparency the owner requested. Segment views show no exclusion detail. N/A counts were already shown per item before this change. |
| 7 | **Comparisons over time within Version 2.** If the share of partial respondents differs between two campaigns, index and dimension scores shift for population reasons. | Small, but real. | Respondent counts accompany every campaign's results; the history chart shows valid responses per campaign. |
| 8 | **Equivalence when everyone is eligible.** | When no respondent falls short, the results are identical to the single-population method. | Tested (identical overall and dimension scores). |

**Conclusion.** The approach keeps every usable answer, keeps the index on one consistent population, and makes the difference visible. Because N/A is available on only two SI items, the populations can differ only in SI and only by the respondents who marked both items N/A. The pilot should report that proportion; if it is material, the research specialist should review whether SI3 or SI5 needs N/A at all. That would be an item change, so it is outside the framework freeze unless a material defect is found.

