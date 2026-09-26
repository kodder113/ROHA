-- ============================================================================
-- Atomic publication of an assessment release.
--
-- Publishing a new assessment version needs three things to change together:
-- the assessment version, the scoring rules designed for it, and AI reporting
-- instructions that describe it correctly. This migration:
--   1. records which assessment versions each AI instructions version supports
--      (existing instructions describe version 1 only);
--   2. adds publish_assessment_release(), which validates the combination and
--      applies every change in one transaction, or none of them.
--
-- Schema and function only: no assessment content, scoring rules, results or
-- organization data are changed. Existing AI instructions receive the default
-- supported_assessment_versions = {1}, which matches their text.
-- ============================================================================

alter table public.ai_report_instructions
  add column supported_assessment_versions integer[] not null default '{1}'
  check (cardinality(supported_assessment_versions) > 0);

comment on column public.ai_report_instructions.supported_assessment_versions is
  'Assessment version numbers whose reports these instructions describe correctly.';

create or replace function public.publish_assessment_release(
  p_assessment_version_id uuid,
  p_scoring_rules_id uuid,
  p_ai_instructions_id uuid,
  p_retire_previous boolean,
  p_actor_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_version   public.assessment_versions%rowtype;
  v_rules     public.scoring_rule_versions%rowtype;
  v_ai        public.ai_report_instructions%rowtype;
  v_rules_for integer;
  v_remaining integer[];
  v_retired   integer[] := '{}';
  v_prev_ai   integer[] := '{}';
begin
  -- Lock everything this release touches, in a fixed order.
  select * into v_version from public.assessment_versions where id = p_assessment_version_id for update;
  if not found then raise exception 'ROHA_RELEASE: assessment version not found'; end if;
  select * into v_rules from public.scoring_rule_versions where id = p_scoring_rules_id for update;
  if not found then raise exception 'ROHA_RELEASE: scoring rules not found'; end if;
  select * into v_ai from public.ai_report_instructions where id = p_ai_instructions_id for update;
  if not found then raise exception 'ROHA_RELEASE: AI reporting instructions not found'; end if;
  perform 1 from public.ai_report_instructions where status = 'active' for update;

  if v_version.status <> 'draft' then
    raise exception 'ROHA_RELEASE: assessment version % is %, not draft', v_version.version_number, v_version.status;
  end if;
  if v_rules.status not in ('draft', 'published') then
    raise exception 'ROHA_RELEASE: scoring rules v% are %', v_rules.version_number, v_rules.status;
  end if;
  v_rules_for := coalesce((v_rules.config ->> 'assessmentVersion')::integer, 1);
  if v_rules_for <> v_version.version_number then
    raise exception 'ROHA_RELEASE: scoring rules v% are for assessment version %, not %',
      v_rules.version_number, v_rules_for, v_version.version_number;
  end if;
  if v_ai.status not in ('draft', 'active') then
    raise exception 'ROHA_RELEASE: AI instructions v% are %', v_ai.version_number, v_ai.status;
  end if;

  -- Versions that will remain available for new campaigns after this release.
  select coalesce(array_agg(version_number), '{}') into v_remaining
  from public.assessment_versions
  where template_id = v_version.template_id and status = 'published' and not p_retire_previous;
  v_remaining := v_remaining || v_version.version_number;
  if not (v_ai.supported_assessment_versions @> v_remaining) then
    raise exception 'ROHA_RELEASE: AI instructions v% support assessment versions %, but versions % will be in use',
      v_ai.version_number, v_ai.supported_assessment_versions, v_remaining;
  end if;

  -- 1. Scoring rules (immutable once published).
  if v_rules.status = 'draft' then
    update public.scoring_rule_versions set status = 'published' where id = v_rules.id;
  end if;

  -- 2. Assessment version (the guard trigger checks it has questions).
  update public.assessment_versions set status = 'published' where id = v_version.id;
  if p_retire_previous then
    with retired as (
      update public.assessment_versions set status = 'retired'
      where template_id = v_version.template_id and status = 'published' and id <> v_version.id
      returning version_number
    )
    select coalesce(array_agg(version_number), '{}') into v_retired from retired;
  end if;

  -- 3. AI reporting instructions (exactly one active version).
  if v_ai.status <> 'active' then
    with previous as (
      update public.ai_report_instructions set status = 'retired' where status = 'active' returning version_number
    )
    select coalesce(array_agg(version_number), '{}') into v_prev_ai from previous;
    update public.ai_report_instructions set status = 'active' where id = v_ai.id;
  end if;

  insert into public.audit_logs (actor_user_id, actor_email, scope, action, target_type, target_id, metadata)
  values (p_actor_user_id, p_actor_email, 'platform', 'assessment_release.published', 'assessment_version', v_version.id::text,
    jsonb_build_object(
      'assessment_version', v_version.version_number,
      'scoring_rules_version', v_rules.version_number,
      'ai_instructions_version', v_ai.version_number,
      'retired_assessment_versions', to_jsonb(v_retired),
      'retired_ai_instructions', to_jsonb(v_prev_ai)
    ));

  return jsonb_build_object(
    'assessment_version', v_version.version_number,
    'scoring_rules_version', v_rules.version_number,
    'ai_instructions_version', v_ai.version_number,
    'retired_assessment_versions', to_jsonb(v_retired),
    'retired_ai_instructions', to_jsonb(v_prev_ai)
  );
end $$;

revoke all on function public.publish_assessment_release(uuid, uuid, uuid, boolean, uuid, text) from public;
revoke all on function public.publish_assessment_release(uuid, uuid, uuid, boolean, uuid, text) from anon, authenticated;
grant execute on function public.publish_assessment_release(uuid, uuid, uuid, boolean, uuid, text) to service_role;
