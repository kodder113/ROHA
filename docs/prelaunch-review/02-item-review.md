# 2. Item-by-Item Review — Assessment Version 1 (all 24 items)

Source: `questions` table, assessment version 1 (status: published), as created by `supabase/migrations/20260926000300_reference_data.sql`. Each item is rated twice on a 1–5 agreement scale: **Current state** (how the organization operates today) and **Desired state** (how it should operate in the future). "N/A allowed" means respondents may mark Not Applicable, and that rating is excluded from averages.

## How to read the ratings

- **OCAI resemblance:** whether the item corresponds to an OCAI item in content, structure or wording. The OCAI uses, for each of six content areas, four descriptive statements representing four culture types, and respondents divide 100 points among them. *(Structural description only; no OCAI text is reproduced here.)*
- **Other-instrument resemblance:** notable overlap in phrasing with other widely used, proprietary or published instruments. Comparisons marked † are from recollection of widely published items and must be verified against licensed copies.
- **IP concern:** *Low* = generic concept, independently phrased. *Medium* = distinctive phrasing pattern shared with a known proprietary instrument; rewording recommended before launch. *High* = close paraphrase or reproduction (none found).
- **Literature anchors** show that the *construct* is established in the research literature; they are not sources of the wording. Citation details are listed in document 5 and must be verified.

## Summary table

| Key | Item (verbatim) | Construct | OCAI resemblance | Other resemblance | IP concern | Main measurement note |
|---|---|---|---|---|---|---|
| LE1 | I trust senior leaders to be honest with employees. | Perceived leader integrity | None | Generic trust concept | Low | Correlates with LE4 by design (facets of trust) |
| LE2 | Leadership has communicated a clear direction for where the organization is heading. | Clarity of direction | None | Generic | Low | **Overlaps SA3** |
| LE3 | Managers are held to the same standards of accountability as the people they lead. | Consistency of accountability | None | — | Low | Comparative judgment; "held by whom" implicit |
| LE4 | I have confidence in the decisions made by leadership. | Confidence in decision quality | None | Common survey phrasing | Low | Close to LE1 |
| OC1 | People here work together effectively to accomplish shared goals. | Collaboration effectiveness | None (thematic only) | Generic | Low | — |
| OC2 | Employees are treated as valued members of the organization regardless of their background or position. | Respect and inclusion | None | Generic | Low | **Two bases (background, position)** |
| OC3 | I can speak up about problems or concerns without fear of negative consequences. | Psychological safety / voice | None | Concept shared with published academic scale (Edmondson) | Low | Team-level construct asked at organization level |
| OC4 | The way people actually behave here reflects the organization's stated values. | Espoused–enacted values alignment | None | — | Low | — |
| EE1 | My work gives me a sense of purpose. | Meaningful work | None | Related theme in Gallup Q12† (different referent) | Low | Very short; strong ceiling likely on desired |
| EE2 | I receive meaningful recognition when I do good work. | Recognition | None | **Shares "recognition … doing good work" pattern with a Gallup Q12 item†** | **Medium** | Reword |
| EE3 | I have access to opportunities to grow professionally. | Development opportunity | None | **Shares "opportunities … grow" pattern with a Gallup Q12 item†** | **Medium** | Reword |
| EE4 | I feel committed to helping this organization succeed. | Affective commitment (effort-framed) | None | Generic | Low | Blends attachment and effort intention |
| OE1 | Our work processes allow tasks to be completed without unnecessary steps or delays. | Process efficiency | None (thematic only) | Generic | Low | **Two examples (steps, delays)** |
| OE2 | I have the tools and technology I need to do my job well. | Resource adequacy | None | **Shares "I have the … I need to do my job/work …" pattern with a Gallup Q12 item†** and common resource items | **Medium** | Reword |
| OE3 | Departments coordinate effectively when work depends on more than one team. | Cross-functional coordination | None | Generic | Low | Mixes "departments" and "team" |
| OE4 | It is clear who is responsible for each part of the work I am involved in. | Role / responsibility clarity | None | Construct from role-ambiguity research | Low | **Label says "and procedures"; item covers responsibilities only** |
| IA1 | New ideas are welcomed here, even when they challenge established ways of working. | Openness to new ideas | None (thematic only) | Generic | Low | — |
| IA2 | The organization adapts effectively when circumstances change. | Organizational adaptability | None | Generic | Low | Abstract; reading level high |
| IA3 | When a process is not working well, the organization takes action to improve it. | Improvement responsiveness | None | Generic | Low | Related to OE1 (state vs. response) |
| IA4 | Employees receive the support they need to try out their ideas for improvement. | Support for employee innovation | None | Construct from innovation-climate research | Low | — |
| SA1 | I understand the organization's most important goals. | Goal understanding | None | Generic | Low | Overlaps SA4 (self-understanding) |
| SA2 | My day-to-day work directly supports the organization's business objectives. | Line of sight / work alignment | None | Generic | Low | "Business" may not fit public/nonprofit sector |
| SA3 | Strategic priorities are communicated to employees on a regular basis. | Communication of priorities | None | Generic | Low | **Overlaps LE2**; measures frequency, not clarity |
| SA4 | I understand how my individual contributions affect the organization's success. | Line of sight (contribution) | None | Generic | Low | Overlaps SA1/SA2 |

**Counts:** OCAI resemblance at item level: **0 of 24**. Medium concern (other instrument): **3 of 24** (EE2, EE3, OE2). High concern: **0 of 24**.

## Detailed notes

### Dimension 1 — Leadership Effectiveness (LE)
*Definition in database:* "How employees experience the integrity, direction, accountability and decision-making of organizational leadership."

**Relationship to the OCAI.** The OCAI includes a leadership content area whose four statements characterize leadership *style* by culture type (for example, whether leaders are seen as nurturing, entrepreneurial, results-driven or coordinating). ROHA's leadership items measure *levels* of trust, clarity, accountability and confidence, and are neutral about style. There is no mapping between them.

- **LE1 — Leadership integrity and trust.** *Construct:* perceived integrity of senior leaders, a component of trust in leadership (anchors: Mayer, Davis & Schoorman, 1995; Dirks & Ferrin, 2002). *Writing:* single construct ("trust … to be honest" names the trusted attribute); clear; first-person referent. *Originality:* generic concept, independently phrased. *IP: Low.*
- **LE2 — Clarity of organizational direction.** *Construct:* clarity and communication of the organization's direction. *Writing:* clear, but present-perfect "has communicated" makes it partly an event judgment. *Overlap:* conceptually close to SA3 ("strategic priorities are communicated…") and to SA1 (understanding goals); likely to cross-load with Strategic Alignment. *IP: Low.* *Recommendation:* sharpen LE2 toward the clarity and consistency of leadership's direction, and SA3 toward the timeliness of explaining changes in priorities (document 6).
- **LE3 — Management accountability and consistency.** *Construct:* consistency of accountability standards (procedural fairness). *Writing:* requires comparing two groups, which makes it cognitively demanding, and the agent who holds managers accountable is implicit. N/A allowed, which is appropriate for respondents without visibility. *IP: Low.*
- **LE4 — Confidence in leadership decisions.** *Construct:* confidence in the quality of leadership decision-making. *Writing:* clear. *Overlap:* expected to correlate with LE1. They are distinct facets (character versus competence), which is consistent with the trust literature. *Originality:* "confidence in … leadership" is common employee-survey phrasing and is generic, not distinctive to any one instrument. *IP: Low.*

### Dimension 2 — Organizational Culture (OC)
*Definition:* "The working environment and the shared behavioral expectations that shape how people treat one another."

**Relationship to the OCAI.** The OCAI is a culture-*typing* instrument. ROHA's "Organizational Culture" dimension does not type culture; it measures four climate qualities (collaboration, respect, voice safety, values integrity) as levels. The use of the common word "culture" in a dimension name is not a reproduction of OCAI content. Counsel may nonetheless consider whether the name draws comparison. A name such as "Workplace Climate" or "Working Environment" would describe the items equally accurately (optional; see document 6).

- **OC1 — Collaboration and teamwork.** *Construct:* effectiveness of collaboration toward shared goals. *Note:* teamwork is a theme within one OCAI culture type. ROHA measures how effective collaboration is, not whether the culture is of a teamwork type. *IP: Low.*
- **OC2 — Respect and inclusion.** *Construct:* respectful, inclusive treatment. *Writing:* "background **or** position" asks about two different bases of inclusion (demographic and hierarchical), which is mildly double-barreled. "Valued members" fuses respect and inclusion. *IP: Low.* *Recommendation:* one basis per item (document 6).
- **OC3 — Psychological safety.** *Construct:* voice safety, i.e. psychological safety (anchor: Edmondson, 1999). *Other resemblance:* the published team psychological-safety scale includes an item about being able to bring up problems. OC3 shares the concept but not the wording. Academic scales are published for research use; the concept is not ownable, but counsel may wish to confirm. *Measurement:* psychological safety is primarily a team-level construct; asking at organization level ("here") is a legitimate adaptation that should be stated in the technical manual. *IP: Low.*
- **OC4 — Values and behavior alignment.** *Construct:* alignment of espoused and enacted values (anchors: Argyris & Schön's espoused theory versus theory-in-use; the enacted-versus-espoused distinction in culture research). *Writing:* clear; "actually" is slightly leading but conventional. *IP: Low.* This construct has no counterpart in the OCAI.

### Dimension 3 — Employee Engagement (EE)
*Definition:* "The relationship employees have with their work and with the organization."

**Relationship to the OCAI.** The OCAI has no engagement content. The main external comparison for this dimension is with **engagement surveys**, notably the proprietary Gallup Q12 (Harter, Schmidt & Hayes, 2002).

- **EE1 — Sense of purpose.** *Construct:* meaningfulness of work (anchors: Hackman & Oldham, 1976; Kahn, 1990). *Other resemblance†:* a Q12 item concerns the company's mission or purpose making one's job feel important. EE1's referent (one's own work) and wording differ. *IP: Low.* *Measurement:* very short and highly desirable, so a strong ceiling on the desired rating is expected.
- **EE2 — Recognition and appreciation.** *Construct:* recognition for good work. *Other resemblance†:* a Q12 item asks about receiving recognition or praise for doing good work within a recent time window. EE2 shares the distinctive "recognition … when/for doing good work" pairing, though its timeframe and qualifier differ. *IP: **Medium**.* *Recommendation:* reword to an independently phrased item before launch (document 6).
- **EE3 — Professional development.** *Construct:* availability of development opportunity. *Other resemblance†:* a Q12 item concerns having had opportunities at work to learn and grow. EE3 shares the "opportunities … grow" pattern. *IP: **Medium**.* *Recommendation:* reword (document 6).
- **EE4 — Commitment to the organization.** *Construct:* affective commitment (anchor: Meyer & Allen, 1991), framed as commitment to the organization's success. *Writing:* "helping … succeed" blends attachment with effort intention; acceptable, but the definition should say which is intended. The wording deliberately avoids intention-to-stay language so that no retention inference is invited. *IP: Low.*

### Dimension 4 — Operational Effectiveness (OE)
*Definition:* "The degree to which processes, tools, coordination and clarity enable people to do their work well."

**Relationship to the OCAI.** One OCAI culture type emphasizes efficiency and formal procedures. ROHA measures whether operations *enable work*, not whether the culture is procedural. No mapping.

- **OE1 — Process efficiency.** *Construct:* process efficiency. *Writing:* "steps **or** delays" gives two forms of inefficiency; minor double-barreling. *Overlap:* related to IA3 (improving processes). The distinction is state (OE1) versus responsiveness (IA3), and it should be documented. *IP: Low.*
- **OE2 — Tools and technology.** *Construct:* adequacy of work resources. *Other resemblance†:* a Q12 item concerns having the materials and equipment needed to do one's work right. OE2 follows the same "I have the [resources] I need to do my [job/work] [well/right]" pattern, which also appears in other employee surveys. *IP: **Medium**.* *Recommendation:* reword (document 6).
- **OE3 — Interdepartmental coordination.** *Construct:* cross-functional coordination. *Writing:* switches from "departments" to "team"; harmonize. N/A allowed, which is appropriate. *IP: Low.*
- **OE4 — Clarity of responsibilities and procedures.** *Construct:* responsibility clarity (the opposite of role ambiguity; anchor: Rizzo, House & Lirtzman, 1970). *Coverage gap:* the brief and the focus label mention procedures, but the item covers responsibilities only. This avoided a double-barreled item, but the label should be corrected, or procedural clarity measured separately in a future version. *IP: Low.*

### Dimension 5 — Innovation and Adaptability (IA)
*Definition:* "How open the organization is to new ideas and how effectively it adapts and improves."

**Relationship to the OCAI.** One OCAI culture type is characterized by innovation and entrepreneurship. ROHA measures *how open and adaptive* the organization is perceived to be, as a level applicable to any culture. No mapping.

- **IA1 — Openness to new ideas.** *Construct:* openness to ideas (innovation climate; anchor: Scott & Bruce, 1994). *Writing:* "even when they challenge…" raises item difficulty usefully. *IP: Low.*
- **IA2 — Responsiveness to change.** *Construct:* organizational adaptability. *Writing:* abstract; highest estimated reading level in the set; frontline staff may lack a basis for judgment (N/A allowed). *IP: Low.* *Recommendation:* a more concrete wording (document 6).
- **IA3 — Improving inefficient processes.** *Construct:* improvement responsiveness. *IP: Low.*
- **IA4 — Support for employee-driven innovation.** *Construct:* support for employee innovation. *Writing:* clear; N/A allowed. *IP: Low.*

### Dimension 6 — Strategic Alignment (SA)
*Definition:* "Whether employees understand organizational priorities and can connect their work to them."

**Relationship to the OCAI.** The OCAI has a content area on strategic emphases, used to classify what the organization emphasizes by culture type. ROHA's items measure employee understanding and line of sight, not strategic orientation. No mapping.

- **SA1 — Understanding of organizational goals.** *Construct:* goal understanding (anchor: "line of sight", Boswell, 2006). *IP: Low.*
- **SA2 — Alignment of daily work with objectives.** *Construct:* perceived alignment of one's work. *Writing:* "business objectives" may not suit public-sector or nonprofit respondents. *IP: Low.*
- **SA3 — Communication of strategic priorities.** *Construct:* communication of priorities. *Overlap:* with LE2 (see above). *Writing:* measures frequency ("on a regular basis") rather than clarity or usefulness; "regular" is vague. *IP: Low.*
- **SA4 — Understanding of individual contribution.** *Construct:* contribution line of sight. *Overlap:* SA1, SA2 and SA4 are all first-person understanding judgments. They may form a method factor, and SA4 may be largely redundant with SA2. Pilot data should test this. *IP: Low.*

## Cross-item observations (research specialist)

1. **Mixed referents.** 11 items are self-referent ("I …", "My …") and 13 are collective or organizational ("People here", "The organization"). Aggregating both into organization-level scores is common, but under composition models (Chan, 1998) self-referent and referent-shift items are different constructs at the aggregate level. The technical manual should state ROHA's composition model and whether within-group agreement will be checked.
2. **Reading level.** Estimated Flesch–Kincaid grade averages about 10.6 across items. The estimate is unreliable for single short sentences but directionally useful. Items above grade 12 by this estimate: LE2, OC1, OC2, OC4, EE3, SA1, SA2, SA3, SA4, IA2. Target grade 8 or lower for a workforce-wide survey; confirm with cognitive interviews.
3. **Positive keying.** All 24 items are positively keyed, so acquiescence cannot be detected. Reverse-keyed items were avoided deliberately because they often behave poorly in short forms. This trade-off should be documented.
4. **Desired-state semantics.** For self-experience items (e.g. EE1, SA1), "how the organization should operate" is less natural than for organizational items. Respondents may interpret the desired rating as "how true should this be for me". See document 3.
