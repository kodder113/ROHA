-- ============================================================================
-- ROHA Assessment Version 2 — FIVE-DIMENSION DRAFT FOR OWNER REVIEW
-- ============================================================================
--
-- STATUS: PROPOSED. NOT APPROVED. NOT PUBLISHED.
--
-- Stored OUTSIDE supabase/migrations so it is never applied automatically.
-- Supersedes the earlier six-by-four Version 2 draft (see git history).
--
-- When run (only after Rodrik Consulting approval) it creates, all as DRAFTS:
--   * assessment version 2 — five dimensions × five items (25 items);
--   * scoring rules version 2 — v1 rules with the validity threshold
--     adjusted for 25 items (13 numeric current ratings);
--   * AI reporting instructions version 2 — version-neutral wording.
--
-- It does NOT publish or activate anything, and it does not touch version 1,
-- scoring rules v1, AI instructions v1, campaigns, responses or results.
-- Drafts are invisible to organizations and cannot be used by campaigns.
--
-- NOTE: Version 2 cannot be published until the engineering changes listed in
-- docs/assessment-v2/08-engineering-changes-before-publication.md are made.
-- The super-admin publication checklist currently requires 6 × 4 and will
-- block publication until then.
--
-- Safe to run once: aborts if any version 2 already exists.
-- Tested by src/test/assessment-v2-draft.integration.test.ts.
-- ============================================================================

do $$
declare
  v_template uuid;
  v_v1       uuid;
  v_v2       uuid;
  d_le uuid; d_oc uuid; d_ee uuid; d_oe uuid; d_si uuid;
begin
  select id into v_template from public.assessment_templates where key = 'roha_core';
  select id into v_v1 from public.assessment_versions where template_id = v_template and version_number = 1;
  if v_v1 is null then
    raise exception 'ROHA v2 draft: version 1 not found';
  end if;
  if exists (select 1 from public.assessment_versions where template_id = v_template and version_number = 2)
     or exists (select 1 from public.scoring_rule_versions where version_number = 2)
     or exists (select 1 from public.ai_report_instructions where version_number = 2) then
    raise exception 'ROHA v2 draft: a version 2 already exists — not creating a duplicate';
  end if;

  -- --------------------------------------------------------------------------
  -- Assessment version 2 (draft)
  -- --------------------------------------------------------------------------
  insert into public.assessment_versions (template_id, version_number, status, title, current_label, desired_label, change_notes)
  values (
    v_template, 2, 'draft',
    'ROHA Organizational Health Assessment — Version 2 (five-dimension draft for review)',
    'Current state — how true this is today',
    'Desired state — how true this should be in the future',
    'Owner-directed restructure (September 26, 2026): five dimensions × five items (25 items). '
    || 'Strategic Alignment and Innovation and Adaptability are replaced by one integrated dimension, Strategic Alignment & Innovation. '
    || 'Of the 24 v1 items: 10 retained, 12 revised, 2 retired (SA4, IA3); 3 new items (OC5, EE5, OE5). '
    || 'Rating labels reworded for first-person items. See docs/assessment-v2/. '
    || 'Requires licensed-instrument screening and owner approval before publication.'
  )
  returning id into v_v2;

  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_v2, 'leadership', 'LE', 'Leadership Effectiveness',
     'How employees experience senior leadership''s integrity, direction-setting, accountability, decision-making and communication of priorities.', 1)
    returning id into d_le;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_v2, 'culture', 'OC', 'Organizational Culture',
     'The quality of everyday working relationships and shared norms: collaboration, equal respect, safety to speak up, learning from mistakes, and consistency between stated values and behavior.', 2)
    returning id into d_oc;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_v2, 'engagement', 'EE', 'Employee Engagement',
     'The individual''s connection to their work and to the organization: meaning, acknowledgement, development, autonomy and commitment.', 3)
    returning id into d_ee;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_v2, 'operations', 'OE', 'Operational Effectiveness',
     'The degree to which processes, procedures, tools and technology, coordination between departments, and clarity of responsibilities enable people to do their work well.', 4)
    returning id into d_oe;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_v2, 'strategy_innovation', 'SI', 'Strategic Alignment & Innovation',
     'The organization''s capacity to connect people to a shared direction and to renew how it pursues that direction: employees understand the goals and see their work advance them, and the organization adapts to change and welcomes and supports new ideas.', 5)
    returning id into d_si;

  insert into public.questions (version_id, dimension_id, key, focus, prompt, allow_na, sort_order) values
    -- Leadership Effectiveness
    (v_v2, d_le, 'LE1', 'Leadership integrity and trust',
     'I trust senior leaders to be honest with employees.', false, 1),
    (v_v2, d_le, 'LE2', 'Clarity of organizational direction',
     'Leadership has set a clear direction for the organization''s future.', false, 2),
    (v_v2, d_le, 'LE3', 'Management accountability and consistency',
     'Managers are held to the same standards of accountability as the people they lead.', true, 3),
    (v_v2, d_le, 'LE4', 'Confidence in leadership decisions',
     'I have confidence in the decisions made by leadership.', false, 4),
    (v_v2, d_le, 'LE5', 'Communication of priorities',
     'Leaders explain what the organization''s priorities mean for my team.', false, 5),
    -- Organizational Culture
    (v_v2, d_oc, 'OC1', 'Collaboration and teamwork',
     'People here work well together to reach shared goals.', false, 1),
    (v_v2, d_oc, 'OC2', 'Respect and inclusion',
     'Employees from every background receive equal respect here.', false, 2),
    (v_v2, d_oc, 'OC3', 'Psychological safety',
     'I can speak up about problems or concerns without fear of negative consequences.', false, 3),
    (v_v2, d_oc, 'OC4', 'Values and behavior alignment',
     'The way people actually behave here reflects the organization''s stated values.', false, 4),
    (v_v2, d_oc, 'OC5', 'Learning from mistakes',
     'When mistakes happen here, the focus is on learning from them.', false, 5),
    -- Employee Engagement
    (v_v2, d_ee, 'EE1', 'Sense of purpose',
     'My work gives me a sense of purpose.', false, 1),
    (v_v2, d_ee, 'EE2', 'Recognition and appreciation',
     'The contributions I make are acknowledged here.', false, 2),
    (v_v2, d_ee, 'EE3', 'Professional development',
     'This organization invests in developing my skills.', false, 3),
    (v_v2, d_ee, 'EE4', 'Commitment to the organization',
     'I feel committed to helping this organization succeed.', false, 4),
    (v_v2, d_ee, 'EE5', 'Autonomy in how work is done',
     'I can choose my own approach to getting my work done.', false, 5),
    -- Operational Effectiveness
    (v_v2, d_oe, 'OE1', 'Process efficiency',
     'Our work processes let us get things done without unnecessary steps.', false, 1),
    (v_v2, d_oe, 'OE2', 'Tools and technology',
     'The tools and technology available to me are well suited to my work.', false, 2),
    (v_v2, d_oe, 'OE3', 'Interdepartmental coordination',
     'Departments work well together when a task involves more than one of them.', true, 3),
    (v_v2, d_oe, 'OE4', 'Clarity of responsibilities',
     'It is clear who is responsible for what in the work I do.', false, 4),
    (v_v2, d_oe, 'OE5', 'Clarity of procedures',
     'The procedures I am expected to follow in my work are clear.', false, 5),
    -- Strategic Alignment & Innovation
    (v_v2, d_si, 'SI1', 'Understanding of organizational goals',
     'I understand the organization''s most important goals.', false, 1),
    (v_v2, d_si, 'SI2', 'Alignment of daily work with goals',
     'My daily work helps the organization reach its goals.', false, 2),
    (v_v2, d_si, 'SI3', 'Responsiveness to change',
     'This organization adjusts quickly when conditions change.', true, 3),
    (v_v2, d_si, 'SI4', 'Openness to new ideas',
     'New ideas are welcomed here, even when they challenge established ways of working.', false, 4),
    (v_v2, d_si, 'SI5', 'Support for employee-driven innovation',
     'Employees receive the support they need to try out their ideas for improvement.', true, 5);

  -- Open-ended questions: unchanged (wording specified by Rodrik Consulting).
  insert into public.qualitative_questions (version_id, key, prompt, sort_order)
  select v_v2, key, prompt, sort_order from public.qualitative_questions where version_id = v_v1;

  -- --------------------------------------------------------------------------
  -- Scoring rules version 2 (draft): identical to v1 except the validity
  -- threshold, which keeps "at least half of the current-state ratings".
  -- --------------------------------------------------------------------------
  insert into public.scoring_rule_versions (version_number, name, status, config, notes)
  select 2, 'ROHA Scoring Rules v2 (draft for five-dimension assessment)', 'draft',
         config || '{"minValidCurrentRatings": 13}'::jsonb,
         'Draft for assessment version 2 (5 dimensions × 5 items). Unchanged from v1 except minValidCurrentRatings 12 → 13 '
         || '(at least half of 25 current-state ratings). Equal item weights within dimensions; equal dimension weights (20% each). '
         || 'Normalized score = ((rating − 1) / 4) × 100; gap = desired − current; N/A excluded. See docs/assessment-v2/05-scoring-specification.md.'
  from public.scoring_rule_versions where version_number = 1;

  -- --------------------------------------------------------------------------
  -- AI reporting instructions version 2 (draft, not active): version-neutral
  -- description of the framework; "diagnostic" wording corrected.
  -- --------------------------------------------------------------------------
  insert into public.ai_report_instructions (version_number, name, status, system_prompt)
  select 2, 'Executive Intelligence Report v2 (draft, version-neutral)', 'draft',
         replace(
           replace(system_prompt,
             'ROHA (Rodrik Organizational Health Assessment) is an independently developed diagnostic that measures employee perceptions across six dimensions: Leadership Effectiveness, Organizational Culture, Employee Engagement, Operational Effectiveness, Innovation and Adaptability, and Strategic Alignment. Each of 24 items is rated twice',
             'ROHA (Rodrik Organizational Health Assessment) is an independently developed organizational health assessment, in its initial release and not yet empirically validated, that measures employee perceptions across the organizational health dimensions listed in the input (assessment version 1 has six dimensions of four items; version 2 has five dimensions of five items). Each item is rated twice'),
           'Prefer citing dimension-level figures over item-level figures.',
           'Prefer citing dimension-level figures over item-level figures. When a dimension combines related aspects (for example, Strategic Alignment & Innovation), discuss its aspects using item-level figures from the input rather than inventing sub-scores.')
  from public.ai_report_instructions where version_number = 1;

  raise notice 'ROHA v2 drafts created (assessment %, scoring rules v2, AI instructions v2). Nothing published or activated.', v_v2;
end $$;
