# 7. Provenance Record and Open Questions

## 7.1 Provenance of the assessment content

| Fact | Detail |
|---|---|
| Source of the specification | Client brief from Rodrik Consulting LLC. It specified six named sections, four named topics per section, current and desired ratings on a five-point agreement scale, N/A handling, the normalization formula, the three open-ended questions verbatim, and an instruction not to reproduce OCAI material. |
| Drafting method | Item wording, dimension definitions, focus labels, scoring-rule notes and AI reporting instructions were drafted by an AI coding assistant (Anthropic's Claude, operating in Claude Code) from the brief's topic list. The drafting did not reference OCAI item text or any other instrument's text. The model's general training may include exposure to published survey items, which is why independent similarity screening (recommendation R2) matters. |
| Date and commit | Drafted and committed September 26, 2026; commit `b76d5faac2af87b743a2b1d42474c5157eafcc27` ("Stage 1: …") on branch `claude/build-roha-saas-w95xsg`. |
| Location | `supabase/migrations/20260926000300_reference_data.sql` (SHA-256 of file at review: `329f6ea2083543ebdffb369e18a99dc958ff0fd97312b3f6c63455185172b5a0`). |
| Content fingerprint | SHA-256 of the 24 items as stored (`key:prompt`, sorted by key, newline-separated): `84cf0a93608aeeee74cb1db6d6d9972bd9d28e2b470bfefc4ccb63455e12ce9e`. |
| Human review to date | None recorded beyond the client's brief. **Recommendation R4:** record expert review, edits and approval. |
| Modification since drafting | None. Version 1 is published and immutable in the database. |
| Production use | None. Only synthetic demonstration data and automated-test data exist. |

## 7.2 Questions for intellectual property counsel

1. **Architecture-level similarity.** ROHA shares with the OCAI the counts (six sections × four statements) and the practice of rating content for present and preferred/desired states. It differs in constructs, item form, response format, scoring and output (document 3.1). Does this architecture-level resemblance create any risk, and should the independent rationale in documents 3 and 5 be formalized? (Reviewers may consider, for example, the idea/expression distinction reflected in 17 U.S.C. § 102(b); that assessment is for counsel.)
2. **Third-party instrument similarity.** Do items EE2, EE3 and OE2 present concern relative to Gallup Q12 items, or relative to other instruments counsel is aware of? Is the proposed rewording (document 6.2) sufficient, subject to screening?
3. **Authorship and ownership.** Given that the item wording was AI-drafted from the client's topic specification, what human authorship, selection, editing and documentation is advisable to support Rodrik Consulting's ownership and any copyright registration? Relevant context may include U.S. Copyright Office guidance on works containing AI-generated material.
4. **Terms of AI tool use.** Are any assignments or confirmations needed regarding output generated with the AI tools used in development?
5. **Naming of the OCAI.** Should any materials name the OCAI (currently only the internal README), or should disclaimers remain generic?
6. **Trademark clearance.** Has "ROHA" (and the full name and taglines) been cleared for trademark use in the intended markets? This review did not assess trademarks.
7. **Legal templates.** The Privacy Policy and Terms are templates with placeholders ("[State]", refund policy) and need counsel review.
8. **Claims review.** Are the public statements about privacy, confidentiality, AI processing and limitations acceptable as worded?

## 7.3 Questions for the organizational research specialist

1. Are the working construct definitions in document 5 appropriate? Is "Organizational Culture" the right label for a climate-quality dimension?
2. Is the six-factor, four-indicator measurement model a reasonable starting hypothesis? Which items do you expect to cross-load (LE2/SA3, SA2/SA4, OE1/IA3)?
3. Should the desired-state rating be retained, replaced by an importance/priority rating, or collected at dimension level (document 3.3)? What pilot criterion would you pre-register?
4. What composition model should justify aggregating mixed self-referent and organization-referent items? Should within-group agreement be computed before reporting?
5. Is the 12-rating validity threshold appropriate? Should reports show uncertainty for small subgroups?
6. Are the interpretation bands (0/40/60/80) useful as descriptive aids, or should they be removed until empirical norms exist?
7. What pilot design (organizations, sample size, sectors) is feasible, and what consent language is needed for research use of pilot data?
8. Which proposed version-2 wordings (document 6.2) do you accept, revise or reject?

## 7.4 Reviewer sign-off (to be completed)

| Role | Name | Date | Decision / comments |
|---|---|---|---|
| Intellectual property counsel | | | |
| Organizational research specialist | | | |
| Rodrik Consulting LLC (approver) | Dr. Oscar A. Rodriguez, DSL | | |
