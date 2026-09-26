# 3. Does the Desired-State Rating Add Information? Item-by-Item Review

**Question (owner item 6):** for each item, does rating the desired state add meaningful information beyond the current-state rating, and where is a ceiling effect likely?

**Short answer:** for **22 of 24 items** the desired state is something almost every employee will want. Desired ratings will cluster at 4–5 (a ceiling effect). The gap is then largely a mirror of the current score. For **2 items** (IA1, IA2), reasonable employees can genuinely prefer different amounts, so the desired rating is likely to carry independent information. These are predictions from item content. **They must be tested with pilot data**; the demonstration data cannot test them because it was synthetic and generated with high desired values.

## Why ceilings matter

If nearly everyone rates the desired state 5:
- Desired scores have almost no variance, so they cannot distinguish groups or organizations.
- Gap ≈ (constant − current score), so the gap re-states the current score and adds little new information.
- The gap *ranking* across dimensions stays useful for prioritization, but the same ranking could be read from current scores.
- Negative gaps become rare. When they do appear they may reflect misreading, not a preference for "less". ROHA's reports already instruct that negative gaps are not automatically problems.

## Item-by-item assessment (Version 2 wording)

**Ceiling risk:**
- *High:* the desirable pole is essentially universal, so desired ratings are expected to cluster at 4–5.
- *Moderate:* reasonable disagreement about the ideal amount is plausible.

**Interpretation check** flags items where "how true this should be" reads unnaturally in the first person. The Version 2 rating labels were reworded to help with this.

| Key | Item (v2) | Ceiling risk | Desired rating adds… | Interpretation check |
|---|---|---|---|---|
| LE1 | I trust senior leaders to be honest with employees. | High | Little; honesty is universally desired | ✓ |
| LE2 | Leadership has set a clear direction for the organization's future. | High | Little | ✓ |
| LE3 | Managers are held to the same standards of accountability as the people they lead. | High | Little | ✓ |
| LE4 | I have confidence in the decisions made by leadership. | High | Little | ✓ |
| OC1 | People here work well together to reach shared goals. | High | Little | ✓ |
| OC2 | Employees from every background receive equal respect here. | High | Little; may also attract socially desirable responding | ✓ |
| OC3 | I can speak up about problems or concerns without fear of negative consequences. | High | Little | ✓ |
| OC4 | The way people actually behave here reflects the organization's stated values. | High | Little; depends on whether respondents endorse the stated values | ✓ |
| EE1 | My work gives me a sense of purpose. | High | Little | ⚠ First-person experience; desired = "how true should this be for me" |
| EE2 | The contributions I make are acknowledged here. | High | Little | ⚠ First person |
| EE3 | This organization invests in developing my skills. | High | Some; a few employees (e.g. near retirement) may want less development investment | ✓ |
| EE4 | I feel committed to helping this organization succeed. | High | Little; asking how committed one *should* feel invites social desirability | ⚠ First-person attitude |
| OE1 | Our work processes let us get things done without unnecessary steps. | High | Little | ✓ |
| OE2 | The tools and technology available to me are well suited to my work. | High | Little | ✓ |
| OE3 | Departments work well together when a task involves more than one of them. | High | Little | ✓ |
| OE4 | It is clear who is responsible for what in the work I do. | High | Little | ✓ |
| IA1 | New ideas are welcomed here, even when they challenge established ways of working. | **Moderate** | **Yes.** Employees may differ on how far established practice should be challenged | ✓ |
| IA2 | This organization adjusts quickly when conditions change. | **Moderate** | **Yes.** Some employees may prefer stability over speed of change | ✓ |
| IA3 | When a process is not working well, the organization takes action to improve it. | High | Little | ✓ |
| IA4 | Employees receive the support they need to try out their ideas for improvement. | High | Little | ✓ |
| SA1 | I understand the organization's most important goals. | High | Little | ⚠ First-person understanding |
| SA2 | My daily work helps the organization reach its goals. | High | Little | ⚠ First person |
| SA3 | Leaders explain what the organization's priorities mean for my team. | High | Little | ✓ |
| SA4 | I understand how my own work affects the organization's success. | High | Little | ⚠ First-person understanding |

**Totals:**
- Ceiling risk: 22 items high, 2 moderate (IA1, IA2).
- First-person interpretation checks: 6 items (EE1, EE2, EE4, SA1, SA2, SA4).

## What Version 2 does about it

Consistent with the owner's decision to keep the structure, Version 2:
1. **Keeps** the desired-state rating for all 24 items.
2. **Rewords the rating labels** ("how true this is today" / "how true this should be in the future") so the desired rating reads naturally for first-person items.
3. **Does not change** scoring or reporting.

## Recommended evidence test (pilot) and decision options

Pre-register a criterion before the pilot. The thresholds below are illustrative, for the research specialist to set:

| Evidence from pilot | Interpretation |
|---|---|
| Median within-item SD of desired ratings below ≈ 0.6 scale points, or more than ≈ 80% of desired ratings at 5 | Ceiling confirmed |
| Correlation between gap and current score below ≈ −0.9 | Gap adds little beyond the current score |
| Negative gaps concentrated among fast or straight-lining respondents | Negative gaps likely reflect misreading |

If a ceiling is confirmed, the owner can choose among the following for a **future** version. Each is a methodology change requiring approval, a new scoring-rules version and engineering work; **none is part of Version 2**:
- (A) keep desired ratings and report gaps mainly as prioritization aids;
- (B) replace the desired rating with an importance/priority rating (importance–performance analysis);
- (C) collect desired ratings at dimension level only;
- (D) keep desired ratings only for items where preferences legitimately vary (e.g. IA1, IA2).

## Reporting guidance until then

Present gaps as indicators of **where employees most want improvement**, alongside current scores, not as independent findings. The existing AI reporting instructions already say that negative gaps are not automatically problems and that scores are perceptions, not outcome measures.
