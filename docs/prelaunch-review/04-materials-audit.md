# 4. Audit of Product Materials

## 4.1 Automated scans

Scans were run over all TypeScript, TSX, SQL, Markdown and script files in the repository, excluding `node_modules` and build output.

**Scan 1: third-party instrument and Competing Values vocabulary.**
Pattern: `ocai | competing values | cameron | quinn | clan | adhocracy | hierarch | market culture | culture type | ipsative | 100 points | kite | quadrant | preferred`

| Result | Location | Assessment |
|---|---|---|
| "preferred" | `src/components/dashboard/segment-utils.ts` (code comment and parameter name for a preferred filter attribute) | Unrelated usage |
| "hierarchy" | `src/app/(marketing)/features/page.tsx`: "clear hierarchy" (visual hierarchy of charts) | Unrelated usage |
| "OCAI" | `README.md` line 8: independence disclaimer naming the OCAI | See 4.4 |

No occurrences in assessment content, scoring, AI prompts, reports, PDF, survey or public pages.

**Scan 2: validation, endorsement and certification claims.**
Pattern: `validated | validation | scientific | psychometric | research-based | evidence-based | proven | benchmark | certif | endorse | affiliat`

Every hit is either a **disclaimer** (e.g. "has not been scientifically or psychometrically validated"; "interpretive aids, not validated cut-offs"; "No external benchmarks"; "not affiliated with, endorsed by, or derived from any other assessment instrument") or an unrelated use (Stripe PCI certification; a Terms clause about benchmarking the service). One exception:

- `src/lib/reports/pdf/document.tsx` (About Rodrik Consulting): "…to give leadership teams a clear, **evidence-based** view of how their organization is experienced…". Read in context this means "based on employee responses", but "evidence-based" is a term of art associated with validated practice. **Recommendation:** replace with "data-informed" or "structured" (document 6).

## 4.2 Material-by-material review

| Material | Location | Proprietary content reproduced? | Affiliation implied? | Notes |
|---|---|---|---|---|
| Assessment items, dimension names and definitions | reference-data migration | No (see document 2) | No | Three items to reword for third-party similarity (EE2, EE3, OE2) |
| Rating-scale labels | same | No; standard 5-point agreement anchors are generic | No | — |
| Open-ended prompts | same | No; wording taken from the client brief | No | — |
| Scoring rules and notes | `scoring_rule_versions` v1 | No | No | — |
| AI system prompt (reporting instructions v1) | `ai_report_instructions` | No; describes ROHA's own framework | No | States that ROHA has no benchmarks and forbids invented statistics |
| Report schema (sections A–L) | `src/lib/ai/report-schema.ts` | No; structure from the client brief | No | — |
| Rules-based report text | `src/lib/ai/rules-report.ts` | No; generated sentences from ROHA's own numbers | No | — |
| Executive PDF | `src/lib/reports/pdf/*` | No | No | Cover and "About" use only facts supplied in the brief; one wording note above |
| Survey consent and explanations | `src/components/survey/survey-app.tsx` | No | No | Accurately distinguishes confidential and anonymous modes and states limitations |
| Dashboard charts | `src/components/dashboard/*` | No | No | Generic chart forms: six-axis radar, grouped and diverging bars, stacked distributions, line trend, heatmap. None reproduces the four-quadrant profile plot associated with the Competing Values Framework. |
| Logo and brand mark | `src/components/brand/logo.tsx`, `src/app/icon.svg` | No | No | Original six-segment hexagon with an emerald core (reviewed). **Replaced on September 26, 2026** by an original abstract mark (open ring, emerald core and point) that does not depict a number of dimensions; also in the PDF mark and favicon. Trademark clearance of the new mark is not assessed |
| Home-page illustration | `src/components/marketing/illustrative-dashboard.tsx` | No | No | Labeled "Illustrative example"; shows no data |
| Public pages (Home, How it Works, Framework, Features, Pricing, About, Contact) | `src/app/(marketing)/*` | No | No | Does not name the OCAI or its authors; no testimonials, client counts or validation claims |
| Privacy Policy and Terms | same | No | No | Terms state ROHA "has not been scientifically or psychometrically validated". Both are marked as templates requiring counsel review |
| Demonstration seed data | `supabase/seed.sql` | No | No | Synthetic, labeled as such throughout; comments are generic |
| README | `README.md` | No | No (disclaims) | Names the OCAI (see 4.4) |

## 4.3 Founder and company claims

Public materials state only: Dr. Oscar A. Rodriguez, DSL (Doctor of Strategic Leadership), founder of Rodrik Consulting LLC, focused on strategic leadership and organizational development, with a link to rodrikconsulting.com. No other biography, client list, testimonial or outcome claim appears. **Action:** Dr. Rodriguez should confirm that the credential wording is exactly as he wishes it to appear.

## 4.4 Naming the OCAI in disclaimers

The public site's independence statement does not name any instrument: "not affiliated with, endorsed by, or derived from any other assessment instrument". The internal README names the OCAI explicitly.

Considerations for counsel:
- Naming a third-party instrument can pre-empt confusion, but it also invites comparison and uses the third party's name or trademark.
- The generic public wording already disclaims affiliation.
- **Question for counsel:** should the README (or any future public FAQ) name the OCAI, or keep the generic statement?

## 4.5 Conclusions on review questions 5 and 6

- **Q5 (reproduction of proprietary material):** none found for the OCAI or the Competing Values Framework. Phrasing-pattern similarity with a different proprietary instrument (Gallup Q12) was found in three items and should be remediated.
- **Q6 (implied affiliation):** no implication of affiliation with or endorsement by the OCAI or its developers. Disclaimers are present and appropriately general.
