# 9. Claims Review and Corrections

**Objective:** remove wording that could suggest ROHA is scientifically validated or evidence-based as an instrument, and state its present development status accurately.

## Search performed

All application source, the PDF report, brand constants, AI reporting content and documentation were searched for: *scientific, evidence-based, research-based, research-backed, validated, validation, proven, rigorous, reliable, accurate, precise, trusted, diagnostic, diagnosis, grounded in, psychometric, established research*.

**Findings:**
- No page claims ROHA is scientifically validated. Every use of "validated" appears in a disclaimer ("has not been … validated", "not validated cut-offs").
- Four passages were misleading or inconsistent and have been corrected.
- One further passage is in stored database content and is pending your approval.

## Corrections made (copy only — no features or layout changed)

| # | Location | Before | After | Why |
|---|---|---|---|---|
| 1 | `src/lib/brand.ts` — independence statement shown in the site footer, About, Framework and Terms pages and in the PDF | "ROHA is an independently developed **organizational diagnostic** … and it has not been independently validated as a psychometric instrument." | "ROHA is an **organizational health assessment** developed independently by Rodrik Consulting LLC. It is not affiliated with, endorsed by, or derived from any other assessment instrument. **ROHA is in its initial release: its dimensions draw on concepts that are well established in organizational research, but ROHA's own questions and scoring have not yet been empirically tested for reliability or validity.**" | "Diagnostic" implies clinical or validated diagnosis and contradicted the Terms ("not a clinical, diagnostic or psychometric instrument"). The new text states the actual development status and separates construct research from validation of ROHA itself. |
| 2 | Terms of Service, "Nature of the assessment" | "ROHA is an independently developed **organizational diagnostic**." | "ROHA is an independently developed **organizational health assessment in its initial release**." | Same inconsistency |
| 3 | How ROHA Works page, introduction | "…**rigorous** in how it calculates results…" | "…**consistent** in how it calculates results…" | "Rigorous" can be read as a claim of scientific rigor; the accurate claim is deterministic, consistent calculation |
| 4 | Executive PDF, "About Rodrik Consulting" | "…a clear, **evidence-based** view of how their organization is experienced…" | "…a clear, **structured** view of how their organization is experienced…" | "Evidence-based" is a term of art implying validated practice |
| 5 | `README.md`, opening statement | "…has not been independently validated as a psychometric instrument." | "…is an independently developed organizational health assessment in its initial release… Its dimensions draw on established organizational research concepts, but ROHA's own questions and scoring have not yet been empirically tested for reliability or validity." | Consistency with item 1 |

Verification: type-check, lint and the full automated test suite pass after these changes, including the PDF rendering tests.

## Pending — requires your approval (stored content, not changed)

| Location | Current text | Resolution in this draft | Status |
|---|---|---|---|
| AI reporting instructions, version 1 (active), in the database | "…an independently developed **diagnostic** that measures employee perceptions across six dimensions…" | AI reporting instructions **version 2 (draft)**, created by the Version 2 loader, says "…an independently developed **organizational health assessment, in its initial release and not yet empirically validated**…" and describes the framework version-neutrally (document 7, 7.3) | Not activated. Activating v2 is part of Version 2 publication and needs your approval; v1 stays on record for reports already generated |

## Wording retained deliberately

| Wording | Where | Reason retained |
|---|---|---|
| "Powered by AI. Grounded in Strategic Leadership." | Tagline | Supplied in the owner's brief; describes positioning, not a measurement claim |
| "Not a clinical, diagnostic or psychometric instrument"; "not a scientifically validated measure" | About, Terms, Framework | Accurate disclaimers |
| "A consistent, versioned measure that allows organizations to compare perceptions over time" | About page | Accurate: scoring is deterministic and versioned. It claims consistency of calculation, not measurement reliability. The research specialist may prefer "consistent, versioned *survey*" until reliability evidence exists. |

## Approved description of present status (for future materials)

> ROHA is an organizational health assessment developed independently by Rodrik Consulting LLC. It is in its initial release. Its six dimensions draw on concepts that are well established in organizational research, but ROHA's own questions and scoring have not yet been empirically tested for reliability or validity. Scores describe how responding employees perceive their organization; they are not benchmarks and do not predict performance, retention or financial results.
