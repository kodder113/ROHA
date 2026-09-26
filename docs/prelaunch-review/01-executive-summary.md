# 1. Executive Summary

## Overall assessment

On the evidence in the repository, ROHA version 1 is **not a rewritten or rebranded implementation of the Organizational Culture Assessment Instrument (OCAI)**. It differs from the OCAI in what it measures, how items are written, how respondents answer, and how results are scored and presented. No OCAI item wording, culture-type vocabulary, scoring procedure, profile graphic or report content was found anywhere in the application.

The review did identify issues that should be resolved **before launch**, none of which requires altering historical data (no production data exists yet):

| Priority | Issue | Nature |
|---|---|---|
| **High** | Three items (EE2, EE3, OE2) share phrasing patterns with items in the Gallup Q12 engagement survey, a separate proprietary instrument unrelated to the OCAI. | IP (third-party instrument) |
| **High** | The 24 items were drafted with an AI system from a topic list in the client brief. Human authorship, review and ownership should be documented. | IP (authorship / ownership) |
| **High** | The architecture-level resemblance to the OCAI (six sections × four statements, rated for two time perspectives) originated in the brief. It is not a copying of expression, but it is the element most likely to prompt a comparison, and the reasons for it should be documented independently. | IP (perception) / methodology |
| Medium | The "desired state" rating of positively worded items is likely to cluster near the top of the scale (ceiling effect). That limits the information in desired scores and gaps. | Measurement design |
| Medium | Construct overlap between LE2 (clear direction) and SA3 (communication of priorities). There is also possible redundancy among the three self-understanding items in Strategic Alignment. | Measurement design |
| Medium | Minor item-writing issues: two items partly double-barreled (OC2, OE1), one focus label broader than its item (OE4), mixed referents across items, and reading level above target for several items. | Measurement design |
| Low | One phrase in the PDF ("evidence-based view") could be read as a validation claim. The README names the OCAI in a disclaimer. | Claims / presentation |
| Gap | No technical manual documents construct definitions, the item-development process, the research foundation and the validation plan. A draft specification is provided in document 5. | Documentation |

## Findings on the seven review questions

| # | Question | Finding | Confidence |
|---|---|---|---|
| 1 | Are the 24 questions independently written rather than OCAI paraphrases? | **Yes, with respect to the OCAI.** OCAI items are descriptive vignettes, one per culture type, among which respondents divide 100 points. ROHA items are single-attribute agreement statements with no culture-type content. No ROHA item corresponds to an OCAI item in structure or wording. **Separate concern:** EE2, EE3 and OE2 resemble Gallup Q12 phrasing and should be reworded (document 2). | High for the OCAI; moderate for other instruments (not screened against licensed copies) |
| 2 | Do the six dimensions measure independently defined constructs rather than renamed OCAI culture categories? | **Yes.** The OCAI's six "dimensions" are content areas (e.g. leadership, strategic emphases, criteria of success), each used to measure four culture types. The OCAI therefore measures four constructs. ROHA's six dimensions *are* the constructs: six facets of organizational health, scored as levels, not types. Two dimension topics (leadership, strategy) share subject matter with OCAI content areas, but measure different things (document 3). | High |
| 3 | Does the current-versus-desired method serve ROHA's own objectives? | **Partly.** Gap measurement supports ROHA's purpose (identifying where employees want change). Discrepancy measurement is a general technique, not specific to the OCAI. However, for unambiguously positive items the desired rating adds limited information, and negative gaps are rarely meaningful. An importance/priority rating or dimension-level desired ratings may serve ROHA better; this should be decided with pilot data (documents 3 and 6). | Moderate — an empirical question |
| 4 | Is the scoring engine independent of the Competing Values Framework and four-culture classification? | **Yes.** The engine linearly normalizes absolute Likert ratings, averages items into dimensions and dimensions into an index, and subtracts current from desired. There is no ipsative allocation, culture typing, quadrant or axis model, or profile shape. The code contains no such concepts (document 3). | High |
| 5 | Has any proprietary assessment language, graphic, explanation or report content been reproduced? | **None found.** No OCAI or Competing Values Framework vocabulary appears in product code, seed data, AI prompts, the PDF or marketing pages. Charts are generic forms (six-axis radar, bars, heatmap); none reproduces the four-quadrant culture-profile plot. The logo is an original hexagon mark (document 4). | High for the OCAI; see item 1 for other instruments |
| 6 | Does the application imply affiliation with or endorsement by the OCAI or its developers? | **No.** The public site never names the OCAI. The independence statement disclaims affiliation with, endorsement by or derivation from *any* other instrument. The only explicit OCAI mention is a disclaimer in the internal README; counsel should decide whether naming it is advisable (document 4). | High |
| 7 | Are ROHA's research foundation, limitations and scoring methodology documented? | **Scoring and limitations: yes.** Public framework page, PDF methodology and limitations sections, README, and notes stored with the scoring rules. **Research foundation and development process: no.** A draft construct specification with literature anchors (to be verified) and a validation plan is supplied in document 5. | High |

## On the six-by-four structure

The structure was specified in the client brief. From a measurement-design standpoint it is **defensible but not required**:

- Four items per construct is a common short-form minimum. It permits internal-consistency estimates and an identified factor model per dimension, while keeping the survey to about 10–15 minutes.
- Six dimensions is justified by content coverage of the brief's organizational health domains.
- An equal item count per dimension is a convenience, not a psychometric requirement.

**Recommendation:** keep six dimensions × four items for version 1. Do not alter it for cosmetic differentiation. Let pilot evidence (reliability, factor structure, item redundancy) decide whether any dimension should gain or lose items in a later version. Record the design rationale in the technical manual so that the structure rests on ROHA's own measurement objectives rather than on resemblance to any other instrument (documents 3 and 5).

## What this review does not conclude

It does not conclude that ROHA is legally cleared, non-infringing, registrable, or owned by any particular party. It does not conclude that ROHA is valid or reliable as a measurement instrument. Those determinations belong to counsel and to empirical validation research respectively.
