# 4. Desired-State Methodology Review (completed before any scoring change)

**Question:** does the desired-state rating add meaningful information for each Version 2 item, where is a ceiling effect likely, and should the scoring engine change as a result?

**Conclusion:**
- **Review complete.** The desired rating is likely to add independent information for **3 of 25 items** (EE5, SI3, SI4). For the other **22**, desired ratings are expected to cluster at 4–5, so the gap will largely mirror the current score.
- **No scoring-engine change is recommended for Version 2.** The engine already preserves the full desired-state distributions and standard deviations needed to detect a ceiling, and changing the response model now would be premature without data.
- **Owner decision (September 26, 2026): Option A.** Current-versus-desired ratings are retained for the pilot and the scoring formula is unchanged (4.5).

These are predictions from item content. The synthetic demonstration data cannot test them, because its desired values were generated to be high.

## 4.1 Why a ceiling matters

When nearly every employee wants the ideal:
- desired scores have little variance and cannot distinguish groups;
- gap ≈ constant − current score, so the gap restates the current score;
- the gap ranking across dimensions is still useful for prioritization, but mostly duplicates the current-score ranking;
- negative gaps become rare and, when present, may reflect misreading rather than a real preference for less.

## 4.2 Item-by-item assessment

**Ceiling risk:**
- *High:* the desirable pole is essentially universal.
- *Moderate:* reasonable employees may genuinely prefer different amounts.

**Wording check** flags first-person items where "how true this should be" is less natural. The Version 2 labels ("how true this is today" / "how true this should be in the future") were chosen to help.

| Key | Item | Ceiling risk | Desired rating adds | Wording check |
|---|---|---|---|---|
| LE1 | I trust senior leaders to be honest with employees. | High | Little | ✓ |
| LE2 | Leadership has set a clear direction for the organization's future. | High | Little | ✓ |
| LE3 | Managers are held to the same standards of accountability as the people they lead. | High | Little | ✓ |
| LE4 | I have confidence in the decisions made by leadership. | High | Little | ✓ |
| LE5 | Leaders explain what the organization's priorities mean for my team. | High | Little | ✓ |
| OC1 | People here work well together to reach shared goals. | High | Little | ✓ |
| OC2 | Employees from every background receive equal respect here. | High | Little; social desirability likely | ✓ |
| OC3 | I can speak up about problems or concerns without fear of negative consequences. | High | Little | ✓ |
| OC4 | The way people actually behave here reflects the organization's stated values. | High | Little | ✓ |
| OC5 | When mistakes happen here, the focus is on learning from them. | High | Little | ✓ |
| EE1 | My work gives me a sense of purpose. | High | Little | ⚠ first person |
| EE2 | The contributions I make are acknowledged here. | High | Little | ⚠ first person |
| EE3 | This organization invests in developing my skills. | High | Some (e.g. employees near retirement) | ✓ |
| EE4 | I feel committed to helping this organization succeed. | High | Little; social desirability likely | ⚠ first-person attitude |
| **EE5** | I have appropriate freedom to decide how to accomplish my work. | **Moderate** | **Yes:** some employees prefer defined methods; "appropriate" invites a considered level rather than the maximum | ✓ |
| OE1 | Our work processes let us get things done without unnecessary steps. | High | Little | ✓ |
| OE2 | The tools and technology available to me are well suited to my work. | High | Little | ✓ |
| OE3 | Departments work well together when a task involves more than one of them. | High | Little | ✓ |
| OE4 | It is clear who is responsible for what in the work I do. | High | Little | ✓ |
| OE5 | The procedures I am expected to follow in my work are clear. | High | Little | ✓ |
| SI1 | I understand the organization's most important goals. | High | Little | ⚠ first-person understanding |
| SI2 | My daily work helps the organization reach its goals. | High | Little | ⚠ first person |
| **SI3** | This organization adapts effectively when circumstances change. | **Moderate** | **Possibly:** "effectively" is harder to want less of than "quickly", so the ceiling risk is higher than in the earlier draft; preferences about how much change to absorb still differ | ✓ |
| **SI4** | New ideas are welcomed here, even when they challenge established ways of working. | **Moderate** | **Yes:** views differ on challenging established practice | ✓ |
| SI5 | Employees receive the support they need to try out their ideas for improvement. | High | Little | ✓ |

**Totals:**
- Ceiling risk: 22 high, 3 moderate (EE5, SI3, SI4).
- Wording check: 5 items flagged (EE1, EE2, EE4, SI1, SI2).

**Note for Strategic Alignment & Innovation.** Two of its five items (SI3, SI4) are expected to show real variation in desired ratings. Desired-state results for this dimension may therefore be more informative than for the others. A negative gap on SI3 or SI4 can legitimately indicate a preference for more stability and should not be reported as a problem.

## 4.3 What the scoring engine already provides

- Separate current and desired distributions (counts at 1–5), n, N/A counts, mean and standard deviation for every item, preserved in stored aggregates.
- Gaps and gap categories at item, dimension and overall level.
- Versioned scoring rules, so any future change to the response model is recorded and historical results stay reproducible.

A ceiling can therefore be diagnosed from existing outputs, with no engine change.

## 4.4 Pilot test (pre-register before data collection)

Illustrative thresholds, to be set by the research specialist:

| Evidence | Interpretation |
|---|---|
| For an item, ≥ 80% of desired ratings are 5, or the desired SD is < 0.6 | Ceiling confirmed for that item |
| Across items, gap and current score correlate < −0.9 | Gap adds little beyond the current score |
| Desired variance is materially higher for EE5, SI3 and SI4 than for other items | Supports item-specific use of the desired rating |
| Negative gaps concentrated among fast or straight-lining respondents | Negative gaps likely reflect misreading |

## 4.5 Decision options for the owner

| Option | Description | Engine/survey change | Recommendation |
|---|---|---|---|
| **A. Retain and test** | Keep desired ratings for all 25 items with the new labels; present gaps as priority indicators; decide after the pilot | None | **Selected by the owner for the pilot** |
| B. Importance instead of desired | Replace "desired" with "how important is this to improving the organization?" (importance–performance analysis) | Survey labels, scoring rules, dashboards and reports | Consider for a later version if the ceiling is confirmed |
| C. Desired at dimension level | 25 current ratings plus 5 desired dimension ratings | Survey, schema, scoring, reports | Shorter survey; loses item-level gaps |
| D. Desired only where preferences vary | Desired ratings only for items such as EE5, SI3 and SI4 | Survey, scoring, reports | Most efficient if the pilot confirms the predictions |

Options B–D change ROHA's response model. Each would need a new scoring-rules version, engineering work and your approval, and none is included in this draft.

## 4.6 Reporting guidance adopted in the Version 2 specifications

- Gaps are presented as indicators of **where employees most want improvement**, next to current scores, not as independent findings.
- Negative gaps are never automatically treated as problems, especially on SI3 and SI4.
- The methodology section of reports states that desired ratings for most items are expected to be high, and that the value of the desired rating is being evaluated.

## 4.7 Effect of the owner's final edits

- **EE5** ("I have appropriate freedom to decide how to accomplish my work."): the word "appropriate" frames the desired rating as the right amount of freedom, which should reduce the ceiling compared with an unqualified autonomy item.
- **SI3** ("This organization adapts effectively when circumstances change."): the ceiling risk rises, because few employees would want adaptation to be *less* effective. The earlier prediction that SI3 would show informative desired-state variation is weakened; the pilot test in 4.4 applies unchanged.

