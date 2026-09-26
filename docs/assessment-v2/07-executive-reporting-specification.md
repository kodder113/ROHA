# 7. Executive Reporting Specification — Five-Dimension Framework

Covers the AI-generated executive report, the rules-based summary and the executive PDF for Version 2 campaigns. Version 1 campaigns keep their current six-dimension report format.

## 7.1 Report sections (A–L retained)

The brief's twelve report sections are kept. Sections D–I map to dimensions as follows:

| Section | Title | Version 1 source | Version 2 source |
|---|---|---|---|
| A | Executive summary | All | All |
| B | Organizational strengths | Dimensions | Dimensions (5) |
| C | Development opportunities | Dimensions | Dimensions (5) |
| D | Leadership analysis | LE | LE (5 items, including LE5 communication of priorities) |
| E | Cultural analysis | OC | OC (5 items, including OC5 learning from mistakes) |
| F | Employee engagement | EE | EE (5 items, including EE5 autonomy) |
| G | Operational effectiveness | OE | OE (5 items, including OE5 procedural clarity) |
| H | Innovation readiness | IA dimension | **SI dimension, adaptive-innovation aspects (SI3–SI5)**, item-level |
| I | Strategic alignment | SA dimension | **SI dimension, alignment aspects (SI1–SI2)**, item-level, with LE2/LE5 as leadership context |
| J | Qualitative themes | Comments | Comments (unchanged) |
| K | Organizational priorities | All | All |
| L | 30/60/90-day action plan | All | All; action items reference one of the 5 dimension keys |

**Rules for H and I (Version 2):**
- The official figure for both sections is the **SI dimension score**, shown once, with its gap.
- H and I discuss item-level results for their aspects; **no sub-scores are computed or quoted**.
- Section I includes the pattern interpretation from the framework (document 1, 1.2). Any pattern reading (e.g. "clear direction pursued rigidly") must be presented as a **hypothesis to investigate**, not a finding.
- Negative gaps on SI3 or SI4 may indicate a preference for stability and must not be presented as problems.

## 7.2 Data sent to the AI provider (unchanged principles)

Aggregate-only snapshot: organization name and profile fields, campaign name, methodology versions, participation counts, overall index, dimension results (5), item results (25), comment counts and identifier-scrubbed comments. No demographics, subgroup results or individual responses. The snapshot builder is already structure-agnostic.

## 7.3 AI reporting instructions v2 (draft)

Created as a **draft** by the Version 2 loader and not activated. Changes from v1:
1. Describes ROHA as "an independently developed organizational health assessment, in its initial release and not yet empirically validated". This replaces "diagnostic", the correction pending from the claims review.
2. Describes the framework version-neutrally: dimensions are taken from the input (v1: six × four; v2: five × five).
3. Adds an instruction to discuss aspects of an integrated dimension, such as Strategic Alignment & Innovation, using item-level figures rather than inventing sub-scores.

All v1 evidence rules are unchanged: no invented statistics, findings distinguished from hypotheses, no inferences about mental health, individual performance, misconduct or resignation.

## 7.4 Executive PDF

| PDF section | Version 2 specification |
|---|---|
| Cover, contents, running headers | Unchanged |
| 2. Assessment methodology | States "five dimensions × five items (25 items; 50 ratings)", rules v2, equal 20% weights. States that most desired ratings are expected to be high and that the desired rating's value is being evaluated |
| 5. Organizational profile | Title from data ("Five-dimensional organizational profile"); pentagon radar |
| 6. Current vs. desired | 5 dimension bars; 25-item table grouped by dimension |
| 8. Development opportunities and analyses D–I | H and I per 7.1 |
| 12. Methodological limitations | Adds: new integrated SI dimension not yet tested for unidimensionality; results not directly comparable with Version 1 campaigns (document 5, 5.5) |
| 13. About Rodrik Consulting | Unchanged; independence statement already updated |

## 7.5 Rules-based summary (Discover plan and fallback)

Same logic, driven by the dimensions present in the results. The fixed phrase "among the highest of the six dimensions" becomes "…of the N dimensions". For Version 2, sections H and I are generated from SI item-level results as in 7.1.
