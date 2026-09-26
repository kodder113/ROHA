# ROHA Prelaunch Review — Intellectual Property and Methodological Independence

- **Prepared for:** Rodrik Consulting LLC — for review by (a) intellectual property counsel and (b) an organizational research / psychometrics specialist
- **Subject:** ROHA — Rodrik Organizational Health Assessment, assessment version 1, scoring rules version 1
- **Review date:** September 26, 2026
- **Repository state reviewed:** branch `claude/build-roha-saas-w95xsg`, commit `1b2751a` (assessment content introduced in commit `b76d5fa`)

> **Important limitations of this review.** This package is a technical and methodological review prepared to support professional advice. It is **not legal advice** and does **not** establish that ROHA is legally cleared, free of infringement, or registrable. It does **not** establish that ROHA is scientifically or psychometrically validated. Comparisons with third-party instruments below are made from their publicly described structure and from recollection of widely published items; the reviewer did **not** have licensed copies of those instruments. Counsel and the research specialist should verify every comparison against authoritative sources before relying on it.

## Contents

| # | Document | Primary audience |
|---|---|---|
| 1 | [Executive summary and findings on the seven review questions](01-executive-summary.md) | Both |
| 2 | [Item-by-item review of all 24 questions](02-item-review.md) | Both |
| 3 | [Framework structure, current/desired design and scoring independence](03-structure-and-scoring.md) | Research specialist, counsel |
| 4 | [Audit of product materials: UI, seed data, reports, AI prompts, marketing, graphics](04-materials-audit.md) | Counsel |
| 5 | [Methodology documentation status and draft construct specification](05-methodology-specification.md) | Research specialist |
| 6 | [Recommendations and proposed version-2 draft wording](06-recommendations.md) | Both |
| 7 | [Provenance record and open questions for each reviewer](07-provenance-and-questions.md) | Counsel |
| A | [Item inventory (CSV)](appendix-item-inventory.csv) | Both |

## What was inspected

- Assessment content as stored in the database: `supabase/migrations/20260926000300_reference_data.sql` (6 dimensions, 24 items, 3 open-ended prompts, scale labels, scoring rules v1, AI reporting instructions v1), loaded into a clean PostgreSQL database and queried directly.
- Demonstration seed data: `supabase/seed.sql` (synthetic organization, synthetic comments).
- Scoring engine and privacy layer: `src/lib/scoring/*`, `src/lib/results/*`, `src/lib/privacy/*`.
- AI reporting: `src/lib/ai/*` (report schema, input snapshot, rules-based generator, Anthropic request, numeric validator) and the active system prompt.
- Executive PDF: `src/lib/reports/pdf/*`.
- Survey experience: `src/components/survey/survey-app.tsx`.
- Dashboard and charts: `src/components/dashboard/*`.
- Public website and legal templates: `src/app/(marketing)/*`, `src/components/marketing/*`, `src/lib/brand.ts`.
- Documentation: `README.md`.
- Automated text scans across the repository for third-party instrument names and framework vocabulary (see document 4).

## What was not changed

Nothing in the application, the database content, the published assessment version, or any historical result was modified by this review. All proposed wording appears only in document 6 as a **draft for review**. The platform's versioning (published versions are immutable; campaigns keep their launch version) means any accepted changes should be introduced as a new draft version through the super-admin portal.
