# 5. Scoring Specification — Assessment Version 2 with Scoring Rules Version 2 (draft)

**Summary:** the scoring **formula is unchanged** (owner decision, September 26, 2026). What changes is the **inclusion rule**: a respondent is included only with at least four valid current-state ratings in **every** dimension. The earlier proposal of 13 valid ratings out of 25 was not approved. Both settings are stored in scoring rules v2 (draft), which also declares that it belongs to assessment version 2. Scoring engine 1.1 supports the per-dimension rule as an optional setting, so scoring rules v1 and all Version 1 results behave exactly as before.

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

## 5.3 Inclusion rule (scoring rules v2)

**Rule.** A response is included in scoring only if it has **at least 4 numeric current-state ratings in every one of the five dimensions**. Not Applicable and blank answers do not count as ratings. This implies at least 20 of 25 overall.

| Setting | Rules v1 | Rules v2 (draft) | Reason |
|---|---|---|---|
| `minValidCurrentRatings` | 12 (of 24) | **20 (of 25)** | Implied by the per-dimension rule; kept so the overall minimum is explicit |
| `minValidCurrentPerDimension` | not set | **4** | Owner decision: every dimension score of an included respondent rests on at least 4 of its 5 items |
| `assessmentVersion` | not set (= 1) | **2** | Pairs the rules with assessment version 2; campaign creation picks the newest published rules for the assessment version being used |
| All other settings | — | Identical | — |

**Only the current state decides inclusion.** Desired-state ratings do not affect whether a respondent is included. For included respondents, every current and desired rating is used, as in Version 1. Excluded respondents contribute to no score, gap, distribution or count other than the exclusion counts.

**What the rule excludes in practice.** The survey requires every item to be answered with a rating or N/A before submission, so blank answers cannot occur through the survey. Exclusions therefore come only from N/A:

| Dimension | Items allowing N/A | Can the rule exclude a respondent? |
|---|---|---|
| LE | LE3 | No: at most one N/A, leaving 4 valid |
| OC, EE | none | No |
| OE | OE3 | No |
| SI | **SI3 and SI5** | **Yes: a respondent who marks both SI3 and SI5 N/A has 3 valid ratings and is excluded** |

**Owner decision needed before publication (listed in document 10):** accept that respondents answering N/A to both SI3 and SI5 are excluded from all results, or remove N/A from one of these items (an item edit requiring re-approval and, if the draft is already loaded, a new draft). Pilot data will show how often it happens.

**Transparency.** Exclusions are reported, never silent:

| Where | What is shown |
|---|---|
| Dashboard (Valid responses tile and Methodology note) | Number excluded; the inclusion rule in words; counts by dimension ("1 response had too few current-state ratings in Strategic Alignment & Innovation"); how many shortfalls involved N/A |
| PDF report (Methodology; Respondent Population and Participation; Limitations) | The same, plus a version-comparability limitation |
| AI report input | Excluded count, rule and reasons (aggregate counts only); the AI is asked to mention them in limitations using only these counts |
| Rules-based summary | A limitation stating the number excluded and the rule |
| Segment (department, location, level, tenure) views | **No exclusion detail**, to avoid revealing N/A patterns within small groups |

Engine 1.1 records `exclusions` (rule text, below-overall count, per-dimension counts, count involving N/A) with each result. Results computed by engine 1.0 do not have this detail and are displayed as before.

**Historical results.** Stored results are reused whenever they were produced by the same engine major version, so the engine update does not recompute any Version 1 result.

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

- `src/lib/scoring/engine.test.ts`: per-dimension rule (4 valid per dimension included; SI3 + SI5 N/A excluded even with 23 valid overall; exclusion breakdown by dimension and cause; rules v1 unaffected; cache compatibility across engine minor versions).
- `src/lib/scoring/pairing.test.ts`: rules are paired with their assessment version; the publication checklist accepts 6 × 4 and 5 × 5 and requires matching published rules.
- `src/test/assessment-v2-draft.integration.test.ts`: the draft creates 5 × 5 items with the approved wording and draft rules v2 (`minValidCurrentRatings` 20, `minValidCurrentPerDimension` 4, `assessmentVersion` 2; otherwise identical to v1); drafts are invisible to organizations; Version 1 content and historical scores are unchanged.
- `src/lib/ai/ai.test.ts` and `src/lib/reports/pdf/render.test.ts`: reports and PDFs for five dimensions, including exclusions.
- `e2e/v2-transition.mjs` (local database only): a Version 1 campaign, publication of rules v2 and assessment v2 through the admin portal, a Version 2 campaign with one excluded respondent, the history chart, a report and a PDF; Version 1 and demo results are byte-for-byte unchanged after publication.
