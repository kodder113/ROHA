# 6. Recommendations and Proposed Version-2 Draft Wording

> **Update:** the wording proposals in section 6.2 are superseded by the owner-directed Version 2 draft in [`docs/assessment-v2/`](../assessment-v2/README.md). Recommendation R6 (remove "evidence-based") has been applied there.

**Status: proposals only.** Nothing here has been applied. Assessment version 1 remains published and unchanged. Because no production data has been collected, an accepted revision can be published as **version 2 before launch**, and version 1 would then never be used for a client campaign. The platform keeps version 1 intact for audit.

## 6.1 Prioritized recommendations

| # | Priority | Recommendation | Owner | Rationale |
|---|---|---|---|---|
| R1 | Before launch | Counsel reviews this package, especially items EE2, EE3 and OE2 and the architecture-level resemblance described in document 3. | Counsel | Independent legal judgment is required; this review is not legal advice |
| R2 | Before launch | Screen all 24 items (and any v2 wording) against **licensed copies** of relevant instruments: at minimum the OCAI, Gallup Q12, published psychological-safety scales, major engagement surveys, and any instrument Rodrik Consulting has previously used or licensed. Record the results. | Research specialist / counsel | This review compared structure and recollected items only |
| R3 | Before launch | Reword **EE2, EE3 and OE2** (proposals in 6.2), then re-screen. | Research specialist | Shared phrasing patterns with Gallup Q12† |
| R4 | Before launch | **Human authorship record:** Dr. Rodriguez (or designated experts) reviews, edits and approves the final item wording, and the edits and approvals are recorded (document 7). | Rodrik Consulting | Items were AI-drafted; ownership and copyrightability questions for counsel |
| R5 | Before launch | Publish a short **Technical Note** (from document 5) on the website or on request, describing constructs, method and limitations. | Rodrik Consulting | Answers review question 7; supports credibility without validation claims |
| R6 | Before launch | Replace "evidence-based view" in the PDF "About" section with "data-informed view". | Engineering | Avoids implying validated practice |
| R7 | Before launch | Decide whether the README (or any public FAQ) should name the OCAI (document 4.4). | Counsel | Trademark / comparison considerations |
| R8 | Version 2 | Reduce LE2/SA3 overlap; fix OC2 and OE1 double-barreling; correct the OE4 focus label; make SA2 sector-neutral; simplify IA2; harmonize OE3 referents; target reading grade ≤ 8. | Research specialist | Measurement quality (document 2) |
| R9 | Version 2 (evidence-led) | Decide the future of the desired-state rating using the pilot criterion in document 3 (options A–D). | Research specialist | Ceiling-effect risk; strengthens ROHA's own methodology |
| R10 | Optional | Consider renaming "Organizational Culture" to "Workplace Climate" (or similar) to describe the items more precisely and reduce comparison with culture-typing instruments. | Rodrik Consulting | Precision; not required for independence |
| R11 | Ongoing | Keep all current disclaimers (not validated; no benchmarks; not affiliated with any other instrument). Add no validity claims until evidence exists. | Everyone | Already compliant |
| R12 | Ongoing | Keep the six-by-four structure for launch. Revisit only on pilot evidence (document 3.2). | Research specialist | Avoids cosmetic change |

## 6.2 Proposed draft wording for version 2 (for expert review and re-screening)

These proposals were written for this review. **They have not been screened against licensed instruments** and must go through R2 before adoption.

| Key | Version 1 (published) | Proposed version 2 draft | Reason |
|---|---|---|---|
| EE2 | I receive meaningful recognition when I do good work. | Contributions like mine are noticed and appreciated here. | Removes the shared "recognition … good work" pattern; keeps the construct |
| EE3 | I have access to opportunities to grow professionally. | This organization invests in developing my skills. | Removes the shared "opportunities … grow" pattern; focuses on organizational investment |
| OE2 | I have the tools and technology I need to do my job well. | The systems and equipment I use help me work efficiently. | Removes the shared "I have the … I need to do my job" pattern |
| LE2 | Leadership has communicated a clear direction for where the organization is heading. | Leadership's plans for the organization's future are clear and consistent. | Separates direction clarity from communication (SA3) |
| SA3 | Strategic priorities are communicated to employees on a regular basis. | When organizational priorities change, the reasons are explained to employees. | Distinct from LE2; measures explanation of change rather than vague frequency |
| OC2 | Employees are treated as valued members of the organization regardless of their background or position. | People of all backgrounds are treated as full members of the team here. | One basis of inclusion; hierarchical respect can be added separately if desired |
| OE1 | Our work processes allow tasks to be completed without unnecessary steps or delays. | Our work processes let us get things done without unnecessary steps. | Removes second example; lower reading level |
| OE4 | *(focus label)* Clarity of responsibilities and procedures | *(focus label)* Clarity of responsibilities | Label matches item; add a procedures item only if coverage is needed |
| SA2 | My day-to-day work directly supports the organization's business objectives. | My day-to-day work contributes directly to the organization's objectives. | Sector-neutral |
| IA2 | The organization adapts effectively when circumstances change. | When circumstances change, this organization adjusts its plans quickly. | More concrete; better matches "responsiveness"; lower reading level |
| OE3 | Departments coordinate effectively when work depends on more than one team. | Departments coordinate effectively when work depends on more than one department. | Consistent referent |

All other items: no change proposed on IP grounds. Minor readability edits may follow cognitive interviews.

## 6.3 How to implement accepted changes without affecting history

1. Super Admin → Assessments → **Create new draft version** (clones version 1).
2. Edit only the accepted items and labels in the draft. Record the approver and the reason in *change notes*.
3. Re-screen the draft wording (R2).
4. Publish version 2 and retire version 1. New campaigns use version 2; any campaign on version 1 keeps its version, scores and reports unchanged. This is enforced by database triggers and covered by an automated test.
5. If option B or C for the desired rating is adopted (document 3), that is a change to the response model and scoring. It requires a new scoring-rules version and engineering work, not only new wording.
