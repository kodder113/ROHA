-- ROHA Migration 002: helper functions, integrity triggers, survey submission,
-- and Row Level Security.

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger plans_touch before update on public.plans for each row execute function public.touch_updated_at();
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger organization_members_touch before update on public.organization_members for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger campaigns_touch before update on public.campaigns for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER so policies can call them without
-- recursive RLS evaluation). search_path is pinned for safety.
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid());
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.org_id
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.org_id
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and o.status = 'active'
      and m.role_key = any (p_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Versioning integrity: published assessment content and scoring rules are
-- immutable so historical results can always be reproduced.
-- ---------------------------------------------------------------------------

create or replace function public.guard_assessment_content()
returns trigger language plpgsql as $$
declare
  v_version uuid := coalesce(new.version_id, old.version_id);
  v_status  text;
begin
  if tg_op = 'UPDATE' and new.version_id <> old.version_id then
    raise exception 'ROHA_IMMUTABLE: content cannot move between assessment versions';
  end if;
  select status into v_status from public.assessment_versions where id = v_version;
  -- v_status is null when the parent version is being deleted (cascade).
  if v_status is not null and v_status <> 'draft' then
    raise exception 'ROHA_IMMUTABLE: assessment version % is % and cannot be modified', v_version, v_status;
  end if;
  return coalesce(new, old);
end $$;

create trigger dimensions_guard before insert or update or delete on public.dimensions
  for each row execute function public.guard_assessment_content();
create trigger questions_guard before insert or update or delete on public.questions
  for each row execute function public.guard_assessment_content();
create trigger qualitative_questions_guard before insert or update or delete on public.qualitative_questions
  for each row execute function public.guard_assessment_content();

create or replace function public.guard_assessment_version()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'ROHA_IMMUTABLE: only draft assessment versions can be deleted';
    end if;
    return old;
  end if;
  if old.status <> 'draft' then
    if new.status = 'draft' then
      raise exception 'ROHA_IMMUTABLE: a published version cannot return to draft';
    end if;
    if new.template_id <> old.template_id or new.version_number <> old.version_number
       or new.title <> old.title or new.current_label <> old.current_label
       or new.desired_label <> old.desired_label then
      raise exception 'ROHA_IMMUTABLE: published assessment versions cannot be edited';
    end if;
  end if;
  if new.status = 'published' and old.status = 'draft' then
    if (select count(*) from public.questions q where q.version_id = new.id) = 0 then
      raise exception 'ROHA_INVALID: cannot publish a version without questions';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end $$;

create trigger assessment_versions_guard before update or delete on public.assessment_versions
  for each row execute function public.guard_assessment_version();

create or replace function public.guard_scoring_rules()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'ROHA_IMMUTABLE: only draft scoring rules can be deleted';
    end if;
    return old;
  end if;
  if old.status <> 'draft' and (new.config <> old.config or new.version_number <> old.version_number or new.status = 'draft') then
    raise exception 'ROHA_IMMUTABLE: published scoring rules cannot be edited';
  end if;
  if new.status = 'published' and old.status = 'draft' then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end $$;

create trigger scoring_rule_versions_guard before update or delete on public.scoring_rule_versions
  for each row execute function public.guard_scoring_rules();

-- Campaign lifecycle integrity.
create or replace function public.guard_campaign()
returns trigger language plpgsql as $$
begin
  if new.org_id <> old.org_id then
    raise exception 'ROHA_IMMUTABLE: campaigns cannot move between organizations';
  end if;
  if old.status <> 'draft' then
    if new.assessment_version_id <> old.assessment_version_id
       or new.scoring_rule_version_id <> old.scoring_rule_version_id
       or new.privacy_mode <> old.privacy_mode
       or new.require_access_code <> old.require_access_code
       or new.collect_levels <> old.collect_levels
       or new.survey_token <> old.survey_token
       or new.opens_at <> old.opens_at then
      raise exception 'ROHA_IMMUTABLE: launched campaign settings cannot be changed';
    end if;
  end if;
  if old.status = 'closed' and (new.status <> 'closed' or new.closes_at <> old.closes_at) then
    raise exception 'ROHA_IMMUTABLE: a closed campaign cannot be reopened';
  end if;
  if old.status = 'open' and new.status = 'draft' then
    raise exception 'ROHA_IMMUTABLE: a launched campaign cannot return to draft';
  end if;
  if new.status = 'open' and old.status = 'draft' then
    new.launched_at := coalesce(new.launched_at, now());
  end if;
  if new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := coalesce(new.closed_at, now());
  end if;
  return new;
end $$;

create trigger campaigns_guard before update on public.campaigns
  for each row execute function public.guard_campaign();

create or replace function public.guard_segment_options()
returns trigger language plpgsql as $$
declare
  v_status text;
begin
  select status into v_status from public.campaigns where id = coalesce(new.campaign_id, old.campaign_id);
  if v_status is null then
    return coalesce(new, old);  -- parent campaign is being deleted
  end if;
  if tg_op = 'INSERT' and v_status = 'closed' then
    raise exception 'ROHA_IMMUTABLE: closed campaigns cannot gain new options';
  end if;
  if tg_op in ('UPDATE', 'DELETE') and v_status <> 'draft' then
    raise exception 'ROHA_IMMUTABLE: options of a launched campaign cannot be changed or removed';
  end if;
  return coalesce(new, old);
end $$;

create trigger campaign_segment_options_guard before insert or update or delete on public.campaign_segment_options
  for each row execute function public.guard_segment_options();

-- ---------------------------------------------------------------------------
-- Survey submission (called only by the server using the service role).
-- Validates the campaign window, the privacy-preserving token, the response
-- limit, and completeness, then stores the response atomically.
-- ---------------------------------------------------------------------------

create or replace function public.submit_survey_response(
  p_survey_token  text,
  p_token_hash    text,
  p_profile       jsonb,
  p_items         jsonb,
  p_comments      jsonb
) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  c                 public.campaigns%rowtype;
  v_org_status      text;
  v_token           public.participation_tokens%rowtype;
  v_count           integer;
  v_response_id     uuid;
  v_dept            uuid;
  v_loc             uuid;
  v_level           uuid;
  v_tenure          text;
  v_expected        integer;
  v_distinct        integer;
  v_total           integer;
  v_bad             integer;
begin
  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'ROHA_TOKEN_INVALID';
  end if;

  select * into c from public.campaigns where survey_token = p_survey_token for update;
  if not found then
    raise exception 'ROHA_NOT_FOUND';
  end if;
  select status into v_org_status from public.organizations where id = c.org_id;
  if v_org_status <> 'active' then
    raise exception 'ROHA_CLOSED';
  end if;
  if c.status = 'draft' or now() < c.opens_at then
    raise exception 'ROHA_NOT_OPEN';
  end if;
  if c.status = 'closed' or now() >= c.closes_at then
    raise exception 'ROHA_CLOSED';
  end if;

  -- Token validation / duplicate prevention.
  select * into v_token from public.participation_tokens
   where campaign_id = c.id and token_hash = p_token_hash for update;
  if c.require_access_code then
    if not found or v_token.kind <> 'access_code' then
      raise exception 'ROHA_TOKEN_INVALID';
    end if;
  end if;
  if found then
    if v_token.status = 'submitted' then
      raise exception 'ROHA_DUPLICATE';
    elsif v_token.status = 'revoked' then
      raise exception 'ROHA_TOKEN_INVALID';
    end if;
  end if;

  -- Response capacity (plan entitlement snapshot taken at launch).
  if c.response_limit is not null then
    select count(*) into v_count from public.responses where campaign_id = c.id;
    if v_count >= c.response_limit then
      raise exception 'ROHA_LIMIT';
    end if;
  end if;

  -- Optional profile. Anonymous campaigns never store demographics.
  if c.privacy_mode = 'confidential' then
    v_dept   := nullif(p_profile ->> 'department_option_id', '')::uuid;
    v_loc    := nullif(p_profile ->> 'location_option_id', '')::uuid;
    v_level  := case when c.collect_levels then nullif(p_profile ->> 'level_option_id', '')::uuid end;
    v_tenure := nullif(p_profile ->> 'tenure_range', '');
    if v_dept is not null and not exists (select 1 from public.campaign_segment_options where id = v_dept and campaign_id = c.id and kind = 'department') then
      raise exception 'ROHA_INVALID_PROFILE';
    end if;
    if v_loc is not null and not exists (select 1 from public.campaign_segment_options where id = v_loc and campaign_id = c.id and kind = 'location') then
      raise exception 'ROHA_INVALID_PROFILE';
    end if;
    if v_level is not null and not exists (select 1 from public.campaign_segment_options where id = v_level and campaign_id = c.id and kind = 'level') then
      raise exception 'ROHA_INVALID_PROFILE';
    end if;
    if v_tenure is not null and v_tenure not in ('lt_1', '1_2', '3_5', '6_10', 'gt_10') then
      raise exception 'ROHA_INVALID_PROFILE';
    end if;
  end if;

  -- Item validation: every core question answered exactly once, each
  -- perspective either rated 1–5 or marked N/A (only where permitted).
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'ROHA_INCOMPLETE';
  end if;
  select count(*) into v_expected from public.questions where version_id = c.assessment_version_id;
  select count(*), count(distinct (i ->> 'question_id')) into v_total, v_distinct from jsonb_array_elements(p_items) i;
  if v_total <> v_expected or v_distinct <> v_expected then
    raise exception 'ROHA_INCOMPLETE';
  end if;

  select count(*) into v_bad
  from jsonb_array_elements(p_items) i
  left join public.questions q
    on q.id = nullif(i ->> 'question_id', '')::uuid and q.version_id = c.assessment_version_id
  where q.id is null
     -- each perspective must be exactly one of: a 1–5 rating, or N/A
     or ((i ->> 'current') is null) = (coalesce((i ->> 'current_na')::boolean, false) = false)
     or ((i ->> 'desired') is null) = (coalesce((i ->> 'desired_na')::boolean, false) = false)
     or ((i ->> 'current') is not null and (i ->> 'current')::int not between 1 and 5)
     or ((i ->> 'desired') is not null and (i ->> 'desired')::int not between 1 and 5)
     or (not q.allow_na and (coalesce((i ->> 'current_na')::boolean, false) or coalesce((i ->> 'desired_na')::boolean, false)));
  if v_bad > 0 then
    raise exception 'ROHA_INCOMPLETE';
  end if;

  insert into public.responses (campaign_id, org_id, assessment_version_id, department_option_id, location_option_id, level_option_id, tenure_range)
  values (c.id, c.org_id, c.assessment_version_id, v_dept, v_loc, v_level, v_tenure)
  returning id into v_response_id;

  insert into public.response_items (response_id, question_id, current_value, current_na, desired_value, desired_na)
  select v_response_id,
         (i ->> 'question_id')::uuid,
         (i ->> 'current')::smallint,
         coalesce((i ->> 'current_na')::boolean, false),
         (i ->> 'desired')::smallint,
         coalesce((i ->> 'desired_na')::boolean, false)
  from jsonb_array_elements(p_items) i;

  if p_comments is not null and jsonb_typeof(p_comments) = 'array' then
    insert into public.response_comments (campaign_id, org_id, qualitative_question_id, body, consent_to_quote)
    select c.id, c.org_id, qq.id, left(btrim(cm ->> 'body'), 2000), coalesce((cm ->> 'consent_to_quote')::boolean, false)
    from jsonb_array_elements(p_comments) cm
    join public.qualitative_questions qq
      on qq.id = nullif(cm ->> 'qualitative_question_id', '')::uuid and qq.version_id = c.assessment_version_id
    where char_length(btrim(coalesce(cm ->> 'body', ''))) > 0;
  end if;

  if v_token.id is not null then
    update public.participation_tokens set status = 'submitted' where id = v_token.id;
  else
    insert into public.participation_tokens (campaign_id, token_hash, kind, status)
    values (c.id, p_token_hash, 'session', 'submitted');
  end if;

  insert into public.campaign_daily_participation (campaign_id, day, submissions)
  values (c.id, current_date, 1)
  on conflict (campaign_id, day) do update set submissions = public.campaign_daily_participation.submissions + 1;

  return jsonb_build_object('ok', true);
end $$;

-- Check whether a participation token has already been used (for the
-- "you have already responded" screen). Returns issued / submitted / unknown.
create or replace function public.participation_token_status(p_survey_token text, p_token_hash text)
returns text
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce((
    select t.status from public.participation_tokens t
    join public.campaigns c on c.id = t.campaign_id
    where c.survey_token = p_survey_token and t.token_hash = p_token_hash
  ), 'unknown');
$$;

-- Counts visible to organization members (no response content).
create or replace function public.campaign_response_count(p_campaign uuid)
returns integer
language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.campaigns where id = p_campaign;
  if v_org is null then
    return null;
  end if;
  if not (public.is_org_member(v_org) or public.is_platform_admin() or auth.role() = 'service_role') then
    raise exception 'ROHA_FORBIDDEN';
  end if;
  return (select count(*)::integer from public.responses where campaign_id = p_campaign);
end $$;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Keys are HMACs computed by the server, so no
-- raw network addresses are stored.
-- ---------------------------------------------------------------------------

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
  return v_hits <= p_max;
end $$;

-- ---------------------------------------------------------------------------
-- Organization provisioning after the administrator verifies their email.
-- ---------------------------------------------------------------------------

create or replace function public.provision_organization(p_user uuid, p_email text, p_payload jsonb)
returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_org      uuid;
  v_slug     text;
  v_plan     uuid;
  v_existing uuid;
begin
  select org_id into v_existing from public.organization_members where user_id = p_user and role_key = 'owner' limit 1;
  if v_existing is not null then
    delete from public.pending_registrations where user_id = p_user;
    return v_existing;
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(coalesce(p_payload ->> 'name', 'organization')), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'organization'), 60) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);

  insert into public.organizations (name, slug, industry, employee_count_range, website, country, region,
                                    contact_name, contact_email, contact_title, contact_phone, created_by)
  values (p_payload ->> 'name', v_slug, p_payload ->> 'industry', p_payload ->> 'employee_count_range',
          nullif(p_payload ->> 'website', ''), p_payload ->> 'country', p_payload ->> 'region',
          p_payload ->> 'contact_name', coalesce(p_payload ->> 'contact_email', p_email), p_payload ->> 'contact_title',
          nullif(p_payload ->> 'contact_phone', ''), p_user)
  returning id into v_org;

  insert into public.organization_members (org_id, user_id, role_key, status)
  values (v_org, p_user, 'owner', 'active');

  select id into v_plan from public.plans where key = 'discover';
  if v_plan is not null then
    insert into public.subscriptions (org_id, plan_id, status, source, campaign_credits, created_by)
    values (v_org, v_plan, 'active', 'free', null, p_user);
  end if;

  insert into public.audit_logs (org_id, actor_user_id, actor_email, action, target_type, target_id, metadata)
  values (v_org, p_user, p_email, 'organization.registered', 'organization', v_org::text,
          jsonb_build_object('plan', 'discover'));

  delete from public.pending_registrations where user_id = p_user;
  return v_org;
end $$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------

revoke all on function public.submit_survey_response(text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.participation_token_status(text, text) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.provision_organization(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_survey_response(text, text, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.participation_token_status(text, text) to service_role;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.provision_organization(uuid, text, jsonb) to service_role;

revoke all on function public.campaign_response_count(uuid) from public, anon;
grant execute on function public.campaign_response_count(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.roles                        enable row level security;
alter table public.platform_admins              enable row level security;
alter table public.plans                        enable row level security;
alter table public.organizations                enable row level security;
alter table public.organization_members         enable row level security;
alter table public.pending_registrations        enable row level security;
alter table public.subscriptions                enable row level security;
alter table public.billing_events               enable row level security;
alter table public.assessment_templates         enable row level security;
alter table public.assessment_versions          enable row level security;
alter table public.dimensions                   enable row level security;
alter table public.questions                    enable row level security;
alter table public.qualitative_questions        enable row level security;
alter table public.scoring_rule_versions        enable row level security;
alter table public.campaigns                    enable row level security;
alter table public.campaign_segment_options     enable row level security;
alter table public.participation_tokens         enable row level security;
alter table public.responses                    enable row level security;
alter table public.response_items               enable row level security;
alter table public.response_comments            enable row level security;
alter table public.campaign_daily_participation enable row level security;
alter table public.aggregated_results           enable row level security;
alter table public.ai_report_instructions       enable row level security;
alter table public.ai_reports                   enable row level security;
alter table public.generated_reports            enable row level security;
alter table public.audit_logs                   enable row level security;
alter table public.app_errors                   enable row level security;
alter table public.contact_inquiries            enable row level security;
alter table public.rate_limits                  enable row level security;

-- Raw and operational tables: no access for browser roles at all
-- (defence in depth on top of RLS having no permissive policies).
revoke all on public.pending_registrations, public.billing_events, public.participation_tokens,
              public.responses, public.response_items, public.response_comments,
              public.aggregated_results, public.rate_limits, public.contact_inquiries
  from anon, authenticated;

-- Reference data
create policy roles_read on public.roles for select to anon, authenticated using (true);

create policy plans_read on public.plans for select to anon, authenticated
  using ((active and is_public) or public.is_platform_admin());
create policy plans_admin_write on public.plans for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy platform_admins_read on public.platform_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- Organizations: members read their own; owners/admins edit profile fields.
create policy organizations_read on public.organizations for select to authenticated
  using (public.is_org_member(id) or public.is_platform_admin());
create policy organizations_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner', 'admin']) or public.is_platform_admin())
  with check (public.has_org_role(id, array['owner', 'admin']) or public.is_platform_admin());
revoke insert, delete, update on public.organizations from anon, authenticated;
grant update (name, industry, employee_count_range, website, country, region, contact_name,
              contact_email, contact_title, contact_phone, data_retention_months)
  on public.organizations to authenticated;

create policy organization_members_read on public.organization_members for select to authenticated
  using (public.is_org_member(org_id) or public.is_platform_admin());
create policy organization_members_owner_update on public.organization_members for update to authenticated
  using (public.has_org_role(org_id, array['owner']) and user_id <> auth.uid())
  with check (public.has_org_role(org_id, array['owner']) and role_key <> 'owner');
create policy organization_members_owner_delete on public.organization_members for delete to authenticated
  using (public.has_org_role(org_id, array['owner']) and user_id <> auth.uid());
revoke insert, update on public.organization_members from anon, authenticated;
grant update (role_key, status) on public.organization_members to authenticated;

create policy subscriptions_read on public.subscriptions for select to authenticated
  using (public.is_org_member(org_id) or public.is_platform_admin());
revoke insert, update, delete on public.subscriptions from anon, authenticated;

-- Assessment content: published/retired versions are readable; platform
-- administrators manage drafts.
create policy assessment_templates_read on public.assessment_templates for select to anon, authenticated using (true);
create policy assessment_templates_admin on public.assessment_templates for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy assessment_versions_read on public.assessment_versions for select to anon, authenticated
  using (status <> 'draft' or public.is_platform_admin());
create policy assessment_versions_admin on public.assessment_versions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy dimensions_read on public.dimensions for select to anon, authenticated
  using (exists (select 1 from public.assessment_versions v where v.id = version_id and (v.status <> 'draft' or public.is_platform_admin())));
create policy dimensions_admin on public.dimensions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy questions_read on public.questions for select to anon, authenticated
  using (exists (select 1 from public.assessment_versions v where v.id = version_id and (v.status <> 'draft' or public.is_platform_admin())));
create policy questions_admin on public.questions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy qualitative_questions_read on public.qualitative_questions for select to anon, authenticated
  using (exists (select 1 from public.assessment_versions v where v.id = version_id and (v.status <> 'draft' or public.is_platform_admin())));
create policy qualitative_questions_admin on public.qualitative_questions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy scoring_rules_read on public.scoring_rule_versions for select to authenticated
  using (status <> 'draft' or public.is_platform_admin());
create policy scoring_rules_admin on public.scoring_rule_versions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Campaigns: members read; owners/admins may edit descriptive fields.
-- Creation, launch and closure run server-side after entitlement checks.
create policy campaigns_read on public.campaigns for select to authenticated
  using (public.is_org_member(org_id) or public.is_platform_admin());
create policy campaigns_update on public.campaigns for update to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']))
  with check (public.has_org_role(org_id, array['owner', 'admin']));
revoke insert, delete, update on public.campaigns from anon, authenticated;
grant update (name, description, expected_participants) on public.campaigns to authenticated;

create policy campaign_segment_options_read on public.campaign_segment_options for select to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and (public.is_org_member(c.org_id) or public.is_platform_admin())));
revoke insert, update, delete on public.campaign_segment_options from anon, authenticated;

create policy campaign_daily_participation_read on public.campaign_daily_participation for select to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and (public.is_org_member(c.org_id) or public.is_platform_admin())));
revoke insert, update, delete on public.campaign_daily_participation from anon, authenticated;

-- Reports
create policy ai_reports_read on public.ai_reports for select to authenticated
  using (public.is_org_member(org_id) or public.is_platform_admin());
revoke insert, update, delete on public.ai_reports from anon, authenticated;

create policy generated_reports_read on public.generated_reports for select to authenticated
  using (public.is_org_member(org_id) or public.is_platform_admin());
revoke insert, update, delete on public.generated_reports from anon, authenticated;

create policy ai_report_instructions_admin on public.ai_report_instructions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Audit trail: organization owners/admins see their organization's entries;
-- platform administrators see everything. Entries are append-only.
create policy audit_logs_read on public.audit_logs for select to authenticated
  using ((org_id is not null and scope = 'organization' and public.has_org_role(org_id, array['owner', 'admin']))
         or public.is_platform_admin());
revoke insert, update, delete on public.audit_logs from anon, authenticated;

create policy app_errors_admin on public.app_errors for select to authenticated using (public.is_platform_admin());
create policy app_errors_admin_update on public.app_errors for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke insert, delete on public.app_errors from anon, authenticated;
