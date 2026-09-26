# 3. Framework Structure, Current/Desired Design and Scoring Independence

## 3.1 Side-by-side design comparison

The OCAI column describes the instrument's publicly documented design (Cameron & Quinn, *Diagnosing and Changing Organizational Culture*, based on the Competing Values Framework of Quinn & Rohrbaugh, 1983). No OCAI item text is reproduced.

| Design element | OCAI (as publicly described) | ROHA v1 (as implemented) | Assessment |
|---|---|---|---|
| **What is measured** | Four culture *types* derived from two competing-values axes | Six organizational-health *constructs*, each as a level | Different constructs |
| **Role of the "six" units** | Six content areas (e.g. dominant characteristics, leadership, management of employees, organizational glue, strategic emphases, criteria of success), each a vehicle for measuring the four types | Six dimensions that *are* the measured constructs | Different function; same count |
| **Role of the "four" units** | Four alternative statements per content area, one per culture type | Four items per dimension, each a facet of that dimension | Different function; same count |
| **Item form** | Descriptive vignettes contrasting culture types | Single-attribute agreement statements | Different |
| **Response format** | Ipsative: divide 100 points among the four alternatives | Normative: independent 1–5 Likert rating per item, plus N/A | Different |
| **Time perspectives** | "Now" and "Preferred" | "Current state" and "Desired state" | Similar concept |
| **Scoring** | Average points per culture type across content areas → four type scores | ((rating − 1) / 4) × 100 → item, dimension and index scores; gap = desired − current | Different |
| **Output** | Culture profile across four types, plotted on a four-quadrant diagram | Six-dimension levels, overall health index, gaps, distributions, privacy-screened subgroups | Different |
| **Interpretation** | Dominant culture type, congruence, type shifts | Descriptive level bands, gap magnitude, strengths and development areas | Different |

**Where the designs converge:** (1) the counts six and four; (2) rating the same content for a present and a future perspective. Both originated in the client brief. Neither involves reproducing OCAI expression, but together they give an architecture-level resemblance (24 statements, two perspectives) that a reader familiar with the OCAI may notice. The rest of this section documents why each element serves ROHA's own objectives, so that the design stands on its own rationale.

## 3.2 Is the six-by-four structure appropriate for ROHA?

**Six dimensions.** The brief defines six organizational health domains. They correspond to widely studied areas of organizational functioning (leadership, climate, engagement, operations, innovation, strategy). Six is a content-coverage decision, not a borrowed number. A research specialist may reasonably ask whether any dimension is too broad (Organizational Culture combines four distinct climate qualities) or whether a domain is missing (e.g. communication, which is currently spread across LE2 and SA3). These are empirical questions for the pilot.

**Four items per dimension.**

| Consideration | Implication |
|---|---|
| Reliability | Four items is a practical minimum for estimating internal consistency (ω/α) for a short scale; fewer items usually give unstable estimates. |
| Factor model identification | Three or more indicators per factor identify a confirmatory model; four provide a degree of freedom per factor for local fit checks. |
| Content coverage | Four facets per domain match the brief's four named topics per section. |
| Respondent burden | 24 items × 2 ratings = 48 responses; about 10–15 minutes, appropriate for all-employee surveys. |
| Equal counts | Simplifies presentation and equal weighting; **not** a psychometric requirement. |

**Conclusion:** the structure is appropriate for version 1 on ROHA's own measurement grounds. Structural changes should follow evidence, not cosmetic differentiation. Examples of evidence-led change: dropping an item that is redundant (e.g. SA4 if it is nearly collinear with SA2), or adding an item where reliability or content coverage is weak (e.g. procedural clarity in Operational Effectiveness).

## 3.3 Does the current-versus-desired method serve ROHA's objectives?

**Objective served.** ROHA aims to show leaders where employees perceive the largest distance between today's organization and the one they want: a prioritization signal. Discrepancy (gap) measurement is a general technique used widely in organizational and service research. Examples include importance–performance analysis (Martilla & James, 1977) and person–environment fit research. It is not unique to the OCAI.

**Design concern — ceiling effects.** Every ROHA item describes something unambiguously desirable (trust, clarity, recognition, efficiency). For such items most respondents are expected to rate the desired state 4–5. The consequences:

- Desired scores will have low variance and carry limited information.
- The gap is then driven almost entirely by the current rating (gap ≈ constant − current), so it largely re-expresses the current score.
- Negative gaps, which the methodology correctly says should not be read automatically as problems, will be rare. When they occur, they may reflect misreading rather than a genuine preference for less.
- For self-experience items (EE1, SA1, SA4) the desired perspective is semantically awkward.

The synthetic demonstration data was *generated* with high desired values, so it is not evidence either way. This is a hypothesis to test in the pilot.

**Options for the research specialist (for a future version; do not change v1):**

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Keep desired rating (status quo) | 48 ratings | Matches brief; simple | Ceiling risk; gap ≈ inverted current |
| B. Replace desired with **importance / priority** | "How important is this to improving the organization?" | Enables importance–performance analysis; more variance; clearly ROHA's own method | Changes the brief's specification; different interpretation |
| C. Desired rating at **dimension level only** | 24 current item ratings + 6 desired dimension ratings | Shorter; retains the gap concept | Item-level gaps are lost |
| D. Keep desired rating, add a pilot test of informativeness | Decide after data | Evidence-led | Delays decision |

**Recommendation:** option D for launch, since v1 is already implemented and tested. Pre-register a pilot criterion, e.g. if the median within-item SD of desired ratings is below about 0.6 scale points, or if gap scores correlate above about −0.9 with current scores, move to option B or C in version 2. Thresholds are for the research specialist to set.

## 3.4 Is the scoring engine independent of the Competing Values Framework?

**Yes.** Evidence from `src/lib/scoring/engine.ts` and scoring rules v1 (`scoring_rule_versions.config`):

1. **Input:** independent integer ratings 1–5 or N/A per item and perspective. There is no allocation across alternatives, and ratings are not constrained to sum to a total.
2. **Normalization:** `((rating − scaleMin) / (scaleMax − scaleMin)) × 100`, a linear rescaling of each rating.
3. **Aggregation:** question score = normalized mean of valid ratings; dimension score = weighted mean (equal by default) of question scores; overall index = weighted mean (equal by default) of dimension scores.
4. **Gap:** desired minus current at item, dimension and index level, categorized by configurable magnitude thresholds (10 / 20 points) into aligned / notable / substantial.
5. **Validity rule:** a response counts when it has at least 12 numeric current ratings.
6. **Descriptive bands:** 0 / 40 / 60 / 80 cut points, explicitly labeled as interpretive aids, not validated thresholds.
7. **Privacy layer:** minimum group size 5, complementary suppression, one-attribute filtering.

The engine has no concepts of culture types, axes, quadrants, dominance, congruence or profile shape. A repository-wide scan found none of those terms in scoring, reporting or presentation code (document 4). The two-axis, four-type model and its profile plot are the core of the Competing Values Framework; they are absent from ROHA.

**Configurability and versioning.** Scoring rules are stored as versioned JSON (`scoring_rule_versions`). Published versions are immutable (database trigger), and campaigns pin the version used. This is recorded in the database, tested (`src/test/survey.integration.test.ts`: "historical results are unchanged after a new assessment version is published") and documented in the README.

## 3.5 Other methodology observations

- **Equal weighting** is a reasonable default, but the research specialist should confirm it after checking dimension reliabilities.
- **Descriptive bands** (0–39, 40–59, 60–79, 80–100) are arbitrary conventions. They are correctly disclosed as such everywhere they appear (framework page, how-it-works page, PDF, scoring rules notes).
- **The 12-rating validity threshold** (half the items) is a policy choice and should be justified in the technical manual.
- **Minimum group size of 5** is a privacy threshold, not a measurement-precision threshold. Group means from 5 respondents have wide uncertainty, so reports could show a precision caveat for small n.
