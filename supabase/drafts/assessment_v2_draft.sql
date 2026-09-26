-- ============================================================================
-- ROHA Assessment Version 2 — DRAFT FOR OWNER REVIEW
-- ============================================================================
--
-- STATUS: PROPOSED. NOT APPROVED. NOT PUBLISHED.
--
-- This script is deliberately stored OUTSIDE supabase/migrations so that it is
-- never applied automatically by `supabase db push` or `supabase db reset`.
--
-- What it does when run (only after Rodrik Consulting approval):
--   * Creates assessment version 2 with status 'draft' by cloning version 1.
--   * Applies the revised wording documented in docs/assessment-v2/.
--   * Leaves version 1, every campaign, response and result untouched.
--
-- What it does NOT do:
--   * It does not publish version 2 (drafts are invisible to organizations and
--     cannot be used by campaigns). Publishing is a separate, explicit step in
--     Super Admin → Assessments after review.
--   * It does not modify scoring rules, AI instructions or historical data.
--
-- Safe to run once: it aborts if a version 2 already exists.
-- Tested by src/test/assessment-v2-draft.integration.test.ts.
-- ============================================================================

do $$
declare
  v_template uuid;
  v_v1       uuid;
  v_v2       uuid;
begin
  select id into v_template from public.assessment_templates where key = 'roha_core';
  select id into v_v1 from public.assessment_versions where template_id = v_template and version_number = 1;
  if v_v1 is null then
    raise exception 'ROHA v2 draft: version 1 not found';
  end if;
  if exists (select 1 from public.assessment_versions where template_id = v_template and version_number = 2) then
    raise exception 'ROHA v2 draft: version 2 already exists — not creating a duplicate';
  end if;

  insert into public.assessment_versions (template_id, version_number, status, title, current_label, desired_label, change_notes)
  values (
    v_template, 2, 'draft',
    'ROHA Organizational Health Assessment — Version 2 (draft for review)',
    'Current state — how true this is today',
    'Desired state — how true this should be in the future',
    'Draft prepared for owner review (September 26, 2026). Structure unchanged: six dimensions × four items, current and desired ratings. '
    || 'Revised items: LE2, OC1, OC2, EE2, EE3, OE1, OE2, OE3, OE4, IA2, SA2, SA3, SA4. '
    || 'Reasons: independent expression (EE2, EE3, OE2); LE2/SA3 construct overlap; one concept per item (OC2, OE1); OE4 wording/label alignment; clarity and reading level. '
    || 'Rating labels reworded so the desired rating reads naturally for first-person items. '
    || 'See docs/assessment-v2/ for the item-by-item comparison. Requires licensed-instrument screening before publication.'
  )
  returning id into v_v2;

  -- Dimensions: cloned, with definitions updated where item content changed.
  insert into public.dimensions (version_id, key, code, name, description, sort_order)
  select v_v2, d.key, d.code, d.name,
         case d.key
           when 'operations' then 'The degree to which processes, tools and technology, coordination between departments, and clarity of responsibilities enable people to do their work well.'
           when 'strategy'   then 'Whether employees understand the organization''s goals, see how their own work connects to them, and hear from leaders what current priorities mean for their team.'
           else d.description
         end,
         d.sort_order
  from public.dimensions d
  where d.version_id = v_v1;

  -- Questions: cloned from version 1, with the approved-for-review revisions.
  insert into public.questions (version_id, dimension_id, key, focus, prompt, allow_na, sort_order)
  select v_v2, d2.id, q.key,
         coalesce(r.focus, q.focus),
         coalesce(r.prompt, q.prompt),
         q.allow_na,
         q.sort_order
  from public.questions q
  join public.dimensions d1 on d1.id = q.dimension_id
  join public.dimensions d2 on d2.version_id = v_v2 and d2.key = d1.key
  left join (values
    ('LE2', null, 'Leadership has set a clear direction for the organization''s future.'),
    ('OC1', null, 'People here work well together to reach shared goals.'),
    ('OC2', null, 'Employees from every background receive equal respect here.'),
    ('EE2', null, 'The contributions I make are acknowledged here.'),
    ('EE3', null, 'This organization invests in developing my skills.'),
    ('OE1', null, 'Our work processes let us get things done without unnecessary steps.'),
    ('OE2', null, 'The tools and technology available to me are well suited to my work.'),
    ('OE3', null, 'Departments work well together when a task involves more than one of them.'),
    ('OE4', 'Clarity of responsibilities', 'It is clear who is responsible for what in the work I do.'),
    ('IA2', null, 'This organization adjusts quickly when conditions change.'),
    ('SA2', null, 'My daily work helps the organization reach its goals.'),
    ('SA3', null, 'Leaders explain what the organization''s priorities mean for my team.'),
    ('SA4', null, 'I understand how my own work affects the organization''s success.')
  ) as r(key, focus, prompt) on r.key = q.key
  where q.version_id = v_v1;

  -- Open-ended questions: unchanged (wording specified by Rodrik Consulting).
  insert into public.qualitative_questions (version_id, key, prompt, sort_order)
  select v_v2, key, prompt, sort_order
  from public.qualitative_questions
  where version_id = v_v1;

  raise notice 'ROHA assessment version 2 created as DRAFT (%). Version 1 unchanged. Not published.', v_v2;
end $$;
