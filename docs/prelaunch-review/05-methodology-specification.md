# 5. Methodology Documentation Status and Draft Construct Specification

> **Status of evidence (updated for the five-dimension Assessment Version 2 draft).** Two kinds of evidence must not be confused:
> 1. **Research on the general constructs.** Published research shows that concepts such as trust in leadership, psychological safety, engagement and role clarity are established subjects of organizational study. This supports the *choice* of ROHA's dimensions.
> 2. **Empirical validation of ROHA itself.** No reliability, factor-structure, fairness or criterion evidence yet exists for ROHA's own questions or scores. **ROHA is in its initial release and has not been empirically validated.**
>
> Section 5.4 sets out the distinction in detail.

## 5.1 What is documented today

| Topic | Where | Adequacy |
|---|---|---|
| Rating scale, two perspectives, N/A handling | Framework page, survey, README, PDF methodology | Adequate |
| Normalization, weighting, gap definition | Scoring rules v1 notes (database), README, How it Works page, PDF | Adequate |
| Interpretation bands and their non-validated status | Framework page, How it Works page, PDF, scoring rules | Adequate |
| Limitations (self-report, no benchmarks, not validated, suppression, cross-sectional) | Terms, About page, PDF limitations section, README | Adequate |
| Privacy methodology (thresholds, complementary suppression) | README, Data & privacy settings page, survey consent | Adequate |
| Versioning of content and scoring | README, super-admin portal | Adequate |
| **Construct definitions and rationale** | One-sentence definitions in the database only | **Insufficient** |
| **Research foundation (literature grounding)** | Not documented | **Missing** |
| **Item-development process and provenance** | Not documented (now in document 7) | **Missing** |
| **Validation plan (reliability, structure, fairness)** | Not documented | **Missing** |

The draft below is intended to become the first section of a **ROHA Technical Manual**, owned and completed by Rodrik Consulting's research specialist.

## 5.2 Construct specification

ROHA currently has one published version and one proposed draft:

| | Version 1 (published) | Version 2 (draft, not published) |
|---|---|---|
| Structure | 6 dimensions × 4 items (24 items, 48 ratings) | 5 dimensions × 5 items (25 items, 50 ratings) |
| Dimensions | Leadership Effectiveness; Organizational Culture; Employee Engagement; Operational Effectiveness; Innovation and Adaptability; Strategic Alignment | Leadership Effectiveness; Organizational Culture; Employee Engagement; Operational Effectiveness; **Strategic Alignment & Innovation** |
| Scoring rules | v1 (validity threshold 12) | v2 draft (validity threshold 13); method unchanged |
| Documentation | This section (5.2.1) | 5.2.2 and [docs/assessment-v2/](../assessment-v2/README.md) |

**Purpose of the instrument (both versions).** ROHA is a structured employee-perception survey. It describes how employees experience key areas of organizational functioning today, and how they believe those areas should operate. Results support leadership discussion and prioritization. ROHA is not a diagnostic of culture type, a clinical or psychometric test, a predictor of individual or organizational outcomes, or a benchmark against other organizations.

**Intended population.** Employees at all organizational levels, surveyed as a whole or as a sample. Results are interpreted at the organization level and for subgroups of at least five valid respondents.

### 5.2.1 Version 1 (published)

**Measurement model (working hypothesis, not yet tested).** Six correlated first-order factors, each indicated by four positively keyed items, with current-state ratings as the primary measure. Desired-state ratings are a second, parallel measure whose informativeness is to be established.

| Dimension | Definition (as stored) | Facets (items) | Research on the general construct (verify). Supports the choice of construct, not ROHA's measurement of it |
|---|---|---|---|
| Leadership Effectiveness | How employees experience the integrity, direction, accountability and decision-making of organizational leadership | Integrity (LE1), direction (LE2), accountability consistency (LE3), decision confidence (LE4) | Trust in leadership: Mayer, Davis & Schoorman (1995); Dirks & Ferrin (2002) |
| Organizational Culture | The working environment and the shared behavioral expectations that shape how people treat one another | Collaboration (OC1), respect/inclusion (OC2), voice safety (OC3), values integrity (OC4) | Psychological safety: Edmondson (1999); espoused vs. enacted values: Argyris & Schön (1974) |
| Employee Engagement | The relationship employees have with their work and with the organization | Meaning (EE1), recognition (EE2), development (EE3), commitment (EE4) | Engagement: Kahn (1990); meaningful work: Hackman & Oldham (1976); commitment: Meyer & Allen (1991) |
| Operational Effectiveness | The degree to which processes, tools, coordination and clarity enable people to do their work well | Process efficiency (OE1), resources (OE2), coordination (OE3), responsibility clarity (OE4) | Role ambiguity: Rizzo, House & Lirtzman (1970) |
| Innovation and Adaptability | How open the organization is to new ideas and how effectively it adapts and improves | Openness (IA1), adaptation (IA2), improvement responsiveness (IA3), support for employee innovation (IA4) | Innovation climate / support for innovation: Scott & Bruce (1994) |
| Strategic Alignment | Whether employees understand organizational priorities and can connect their work to them | Goal understanding (SA1), work alignment (SA2), priority communication (SA3), contribution line of sight (SA4) | Line of sight: Boswell (2006) |

### 5.2.2 Version 2 (proposed five-dimension draft)

**Measurement model (working hypothesis, not yet tested).** Five correlated first-order factors, each indicated by five positively keyed items. The integrated Strategic Alignment & Innovation dimension may show two correlated aspects (alignment: SI1–SI2; adaptive innovation: SI3–SI5); the pilot must test whether one dimension score is justified. Full rationale: [docs/assessment-v2/01-framework.md](../assessment-v2/01-framework.md).

| Dimension | Definition (draft) | Aspects (items) | Research on the general construct (verify). Supports the choice of construct, not ROHA's measurement of it |
|---|---|---|---|
| Leadership Effectiveness | Senior leadership's integrity, direction-setting, accountability, decision-making and communication of priorities | Integrity (LE1), direction set (LE2), accountability consistency (LE3), decision confidence (LE4), priorities explained (LE5) | Trust in leadership: Mayer, Davis & Schoorman (1995); Dirks & Ferrin (2002) |
| Organizational Culture | Everyday working relationships and shared norms: collaboration, equal respect, voice safety, learning from mistakes, values integrity | OC1–OC5 | Psychological safety: Edmondson (1999); espoused vs. enacted values: Argyris & Schön (1974) |
| Employee Engagement | Connection to work and organization: meaning, acknowledgement, development, autonomy, commitment | EE1–EE5 | Engagement: Kahn (1990); job characteristics incl. autonomy: Hackman & Oldham (1976); commitment: Meyer & Allen (1991) |
| Operational Effectiveness | Processes, procedures, tools and technology, interdepartmental coordination and clarity of responsibilities enabling work | OE1–OE5 | Role ambiguity: Rizzo, House & Lirtzman (1970) |
| Strategic Alignment & Innovation | Capacity to connect people to a shared direction and to renew how it is pursued: direction known, acted on and adapted; ideas welcomed and enabled | SI1–SI5 | Line of sight: Boswell (2006); innovation climate: Scott & Bruce (1994) |

**Design decisions to record (with rationale):**

1. Agreement (Likert) format rather than forced choice. This gives each construct an absolute level and supports subgroup comparison.
2. Positive keying only. Reverse-keyed items often reduce reliability in short forms; the trade-off is undetectable acquiescence.
3. Mixed self-referent and organization-referent items. The composition model for organization-level scores must be stated (Chan, 1998).
4. N/A permitted only where a respondent may lack a basis for judgment (v1: LE3, OE3, IA2, IA4; v2 draft: LE3, OE3, SI3, SI5).
5. Equal weights pending evidence.
6. A response is valid with at least half of its current ratings numeric (v1: 12 of 24; v2 draft: 13 of 25).
7. Privacy minimum group size of 5, a confidentiality threshold rather than a precision threshold.

## 5.3 Recommended validation program (outline for the research specialist)


| Stage | Activity | Indicative scale |
|---|---|---|
| 1 | Expert content review of definitions and items | 3–5 subject-matter experts |
| 2 | Cognitive interviews across organizational levels (comprehension, desired-state interpretation, reading level) | ~10–15 employees |
| 3 | Pilot with consenting organizations | Several hundred respondents across multiple organizations |
| 4 | Item analysis; reliability (ω/α per dimension); CFA of the six-factor model; redundancy (e.g. SA2/SA4, LE2/SA3) | Pilot data |
| 5 | Desired-state informativeness test (document 3, option D) | Pilot data |
| 6 | Measurement invariance across levels, tenure and sectors; within-group agreement for aggregation | Larger samples |
| 7 | Version 2 decisions; publish a technical manual; plan convergent/discriminant evidence | — |

Only after such work, and within its scope, could ROHA describe specific validity evidence. Until then all materials should continue to state that ROHA has not been validated.

## 5.4 Research on the general constructs versus empirical validation of ROHA

### A. What the construct research supports

The works cited in 5.5 show that each ROHA dimension corresponds to concepts studied in organizational research, often with established measures of their own. This supports:

- **Content relevance:** the six dimensions address recognized aspects of organizational functioning.
- **Rationale for inclusion:** there are theoretical reasons to expect these perceptions to matter to organizations.

It does **not** show that:

- ROHA's items measure those constructs well (ROHA's items were written independently, not adapted from the cited measures);
- ROHA's scores are reliable, or that its six-dimension structure holds in data;
- ROHA's scores relate to any outcome (performance, retention, financial results);
- findings about other instruments transfer to ROHA. Validity evidence belongs to a specific instrument used for a specific purpose, not to a construct in general.

### B. Status of empirical validation of ROHA itself

The categories follow the sources of validity evidence described in the *Standards for Educational and Psychological Testing* (AERA, APA & NCME, 2014).

| Source of evidence | What it would show | ROHA status (Version 2 draft) |
|---|---|---|
| Test content | Items represent each construct; experts agree | **Partial and internal only.** Version 1 and the Version 2 draft items were drafted from the owner's construct specifications and reviewed internally (prelaunch review; docs/assessment-v2). Independent expert review has not been conducted. |
| Response processes | Employees understand items and ratings as intended (including the desired-state rating) | **Not started.** Cognitive interviews recommended. |
| Internal structure | Factor structure (v1: six factors; v2: five, including unidimensionality of Strategic Alignment & Innovation); reliability (ω/α); item redundancy | **Not started.** No real response data exists. |
| Relations to other variables | Expected associations with established measures (convergent/discriminant) and relevant outcomes | **Not started.** |
| Fairness / measurement invariance | Items function comparably across levels, tenure, sectors and demographic groups | **Not started.** |
| Consequences of use | Results are used as intended (discussion and prioritization, not individual evaluation) | **Design safeguards only** (privacy thresholds, reporting guidance); no empirical study. |

The synthetic demonstration data is computer-generated and must never be used as evidence of reliability or validity.

### C. What may and may not be said today

| Acceptable | Not acceptable until supported by evidence |
|---|---|
| "ROHA's dimensions draw on concepts that are well established in organizational research." | "ROHA is research-based / evidence-based / scientifically validated." |
| "ROHA is in its initial release; its questions and scoring have not yet been empirically tested for reliability or validity." | "ROHA reliably measures organizational health." |
| "Scores describe how responding employees perceive their organization." | "ROHA scores predict performance, retention or financial results." |
| "Scores are calculated consistently using a documented, versioned method." | "ROHA scores can be benchmarked against other organizations." |

## 5.5 References (research on the general constructs — verify all details before citing)

- Argyris, C., & Schön, D. A. (1974). *Theory in practice: Increasing professional effectiveness.* Jossey-Bass.
- Boswell, W. R. (2006). Aligning employees with the organization's strategic objectives: Out of "line of sight", out of mind. *International Journal of Human Resource Management, 17*(9), 1489–1511.
- Cameron, K. S., & Quinn, R. E. *Diagnosing and changing organizational culture: Based on the Competing Values Framework.* (Multiple editions.) *(Cited only to describe the instrument ROHA is distinguished from.)*
- Chan, D. (1998). Functional relations among constructs in the same content domain at different levels of analysis: A typology of composition models. *Journal of Applied Psychology, 83*(2), 234–246.
- Dirks, K. T., & Ferrin, D. L. (2002). Trust in leadership: Meta-analytic findings and implications for research and practice. *Journal of Applied Psychology, 87*(4), 611–628.
- Edmondson, A. (1999). Psychological safety and learning behavior in work teams. *Administrative Science Quarterly, 44*(2), 350–383.
- Hackman, J. R., & Oldham, G. R. (1976). Motivation through the design of work: Test of a theory. *Organizational Behavior and Human Performance, 16*(2), 250–279.
- Harter, J. K., Schmidt, F. L., & Hayes, T. L. (2002). Business-unit-level relationship between employee satisfaction, employee engagement, and business outcomes: A meta-analysis. *Journal of Applied Psychology, 87*(2), 268–279. *(Cited to identify the Gallup Q12 for comparison.)*
- Kahn, W. A. (1990). Psychological conditions of personal engagement and disengagement at work. *Academy of Management Journal, 33*(4), 692–724.
- Martilla, J. A., & James, J. C. (1977). Importance-performance analysis. *Journal of Marketing, 41*(1), 77–79.
- Mayer, R. C., Davis, J. H., & Schoorman, F. D. (1995). An integrative model of organizational trust. *Academy of Management Review, 20*(3), 709–734.
- Meyer, J. P., & Allen, N. J. (1991). A three-component conceptualization of organizational commitment. *Human Resource Management Review, 1*(1), 61–89.
- Quinn, R. E., & Rohrbaugh, J. (1983). A spatial model of effectiveness criteria: Towards a competing values approach to organizational analysis. *Management Science, 29*(3), 363–377. *(Cited only to describe the framework ROHA is distinguished from.)*
- Rizzo, J. R., House, R. J., & Lirtzman, S. I. (1970). Role conflict and ambiguity in complex organizations. *Administrative Science Quarterly, 15*(2), 150–163.
- Scott, S. G., & Bruce, R. A. (1994). Determinants of innovative behavior: A path model of individual innovation in the workplace. *Academy of Management Journal, 37*(3), 580–607.
- American Educational Research Association, American Psychological Association, & National Council on Measurement in Education. (2014). *Standards for educational and psychological testing.* AERA.

These works establish that the constructs are studied in the literature. **ROHA's items were not adapted from them**, and citing them does not imply that ROHA shares their validity evidence.
