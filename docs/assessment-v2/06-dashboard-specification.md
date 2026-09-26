# 6. Dashboard Specification — Five-Dimension Framework

**Status:** implemented (document 8), not published. The dashboard reads dimensions and items from each campaign's results, so most views adapt automatically to five dimensions. The "Change needed" column below records what the original specification required; the implemented behavior is described in 6.4.

## 6.1 Views

| # | View | Version 2 specification | Change needed |
|---|---|---|---|
| — | Overall health tiles | Current index, desired index, gap, participation, valid responses; add "Assessment version 2 (five dimensions)" to the methodology footnote | Footnote text only |
| — | Dimensional analysis table | 5 rows (LE, OC, EE, OE, SI); subtitle states the number of dimensions from data, not the fixed word "Six" | Subtitle text is currently hard-coded "Six dimensions…" |
| 1 | Current vs. desired radar | 5 axes (pentagon), codes LE/OC/EE/OE/SI with a legend | None (data-driven) |
| 2 | Organizational health bar chart | 5 grouped bars | None |
| 3 | Dimension gap chart | 5 diverging bars; note that negative gaps on SI can reflect a preference for stability | Add SI note |
| 4 | Response distribution | Dimension view: 5 rows; item view: 25 items grouped by dimension | None |
| 5 | Departmental comparison | Unchanged logic; 5 dimensions per group | None |
| 6 | Historical trend | **Version-aware:** points labeled with assessment version; no continuous line across a version change without a visible break and caveat; dimension-level trend offered only for LE/OC/EE/OE with a "content revised" caveat, and not for SI across versions; optional item-level trend for the 10 crosswalk items (document 5, 5.5) | **Required change:** the trend currently connects all campaigns regardless of version |
| 7 | Participation dashboard | Unchanged | None |
| 8 | Health heatmap | 5 columns | None |
| — | Item detail | 25 items grouped by dimension. Within SI, show two captions without sub-scores: "Alignment (SI1–SI2)" and "Adaptive innovation (SI3–SI5)" | Optional grouping captions |
| — | Qualitative feedback | Unchanged | None |

## 6.2 Rules

- **Privacy thresholds:** unchanged (minimum group size 5, complementary suppression, single-attribute filtering, release after close).
- **No sub-scores** are displayed for aspects of SI.
- **Mobile:** dimension codes on narrow screens with a code-to-name key; the new code is **SI**.
- **Colors:** unchanged (current = navy, desired = emerald, positive gap = amber, negative gap = violet).
- **Mixed versions:** when an organization has campaigns on both versions, every cross-campaign view shows the assessment version per campaign and applies the comparability rules in document 5 (5.5).

## 6.3 Public demonstration

The synthetic demonstration organization uses Version 1. After Version 2 is published, a synthetic Version 2 demonstration campaign can be added (clearly labeled) to show the five-dimension dashboard and a version-aware trend. This is optional and requires approval.

## 6.4 Implemented behavior (September 26, 2026)

| View | Implemented |
|---|---|
| Dimensional analysis | Subtitle counts dimensions from the data ("5 dimensions of organizational health") |
| Valid responses tile | "N excluded under the inclusion rule (see Methodology)" |
| Methodology note | Engine, rules and assessment versions; the inclusion rule in words; exclusion counts by dimension and how many involved N/A. Organization-wide only; segment views show no exclusion detail |
| Historical trend | One series per assessment version (Version 1 solid, Version 2 dashed); no line joins versions; a vertical "v2" marker where Version 2 begins; tooltip and data table show the version; dimension series are chosen per version, so no dimension is trended across versions; caveat that versions are not comparable and **no change is calculated between them** |
| History table | Version column; caveat when versions differ. Each row's gap is within its own campaign; no row-to-row change is shown |
| Radar, bars, gaps, distributions, heatmap, departmental comparison | Data-driven; verified with five dimensions |

Stricter than the original specification: dimension-level trends for LE, OC, EE and OE are **not** offered across versions (each gained an item and some items were revised).

Not implemented (optional): SI grouping captions in item detail, an SI note on the gap chart, an item-level crosswalk trend.

