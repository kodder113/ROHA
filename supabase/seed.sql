-- ROHA demonstration data
-- ----------------------------------------------------------------------------
-- Creates a CLEARLY LABELED demonstration organization populated with
-- SYNTHETIC (computer-generated) assessment responses for testing and product
-- demonstrations. None of this data describes a real organization or person.
--
-- Idempotent: re-running replaces the previous demonstration organization.
-- Run with:  psql "$DATABASE_URL" -f supabase/seed.sql
-- (supabase db reset runs it automatically for local development.)

create or replace function public.seed_demo_organization()
returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_org       uuid;
  v_version   uuid;
  v_rules     uuid;
  v_plan      uuid;
  v_campaign  uuid;
  v_resp      uuid;
  v_round     integer;
  v_n         integer;
  v_i         integer;
  v_dept      record;
  v_loc       uuid;
  v_lvl       uuid;
  v_tenure    text;
  q           record;
  v_person    double precision;
  v_cur       double precision;
  v_des       double precision;
  v_cur_na    boolean;
  v_des_na    boolean;
  v_depts     text[] := array['Operations', 'Finance', 'Human Resources', 'Information Technology', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance'];
  -- Respondents per department (Legal & Compliance intentionally < 5 to
  -- demonstrate small-group suppression).
  v_sizes     integer[];
  v_dept_off  double precision[] := array[-0.35, 0.10, 0.30, -0.10, 0.20, -0.25, 0.0];
  v_locs      text[] := array['Headquarters', 'Regional Office', 'Remote'];
  v_levels    text[] := array['Individual contributor', 'Supervisor / team lead', 'Manager', 'Senior leader'];
  v_tenures   text[] := array['lt_1', '1_2', '3_5', '6_10', 'gt_10'];
  -- Baseline current-state means per dimension for each round (round 2 shows
  -- modest improvement so the historical trend has something to display).
  v_base      jsonb := '{
     "1": {"leadership": 3.05, "culture": 3.45, "engagement": 3.30, "operations": 2.70, "innovation": 2.85, "strategy": 3.15},
     "2": {"leadership": 3.30, "culture": 3.55, "engagement": 3.40, "operations": 2.95, "innovation": 3.05, "strategy": 3.45}
  }';
  v_desired   jsonb := '{"leadership": 4.55, "culture": 4.50, "engagement": 4.40, "operations": 4.45, "innovation": 4.30, "strategy": 4.35}';
  v_comments  jsonb := '{
    "does_well": [
      "People genuinely help each other when deadlines are tight.",
      "Our commitment to customers is visible in how teams prioritize work.",
      "Colleagues on my team are knowledgeable and willing to share what they know.",
      "The organization takes safety and compliance seriously.",
      "Leadership has been more visible this year through town hall meetings.",
      "Flexible work arrangements are handled fairly.",
      "New employees are welcomed and supported during their first weeks."
    ],
    "makes_harder": [
      "Approvals require too many sign-offs, which slows routine work.",
      "Our systems do not talk to each other, so we re-enter the same information several times.",
      "Priorities change without explanation, and work gets abandoned halfway through.",
      "It is not always clear which department owns a request when it crosses teams.",
      "Information from leadership reaches frontline teams late or not at all.",
      "Outdated equipment and software slow down daily tasks.",
      "Meetings take up time that could be spent on the actual work."
    ],
    "recommend": [
      "Explain the reasoning behind major decisions, not only the decisions themselves.",
      "Simplify the approval process for routine purchases and requests.",
      "Create a clear path for employees to propose and test improvement ideas.",
      "Invest in integrated systems so teams can share information easily.",
      "Recognize good work more consistently across departments.",
      "Hold regular cross-department planning sessions.",
      "Share progress on strategic goals with all employees every quarter."
    ]
  }';
  v_body      text;
  v_arr       jsonb;
  qq          record;
  v_close     timestamptz;
begin
  perform setseed(0.4242);

  delete from public.organizations where is_demo;

  select id into v_version from public.assessment_versions where status = 'published' order by version_number desc limit 1;
  select id into v_rules from public.scoring_rule_versions where status = 'published' order by version_number desc limit 1;
  select id into v_plan from public.plans where key = 'enterprise';

  insert into public.organizations (name, slug, industry, employee_count_range, website, country, region,
                                    contact_name, contact_email, contact_title, is_demo, is_pilot, pilot_notes)
  values ('Demonstration Organization (Synthetic Data)', 'roha-demo', 'Professional services', '100-249',
          null, 'United States', 'Demonstration', 'Demonstration Contact', 'demo@example.com',
          'Demonstration only', true, true,
          'Synthetic data for product demonstration and testing. Does not describe a real organization.')
  returning id into v_org;

  insert into public.subscriptions (org_id, plan_id, status, source, notes)
  values (v_org, v_plan, 'active', 'complimentary', 'Demonstration workspace');

  for v_round in 1..2 loop
    v_close := case v_round when 1 then date_trunc('day', now()) - interval '180 days' else date_trunc('day', now()) - interval '10 days' end;
    v_sizes := case v_round when 1 then array[14, 8, 6, 9, 10, 12, 3] else array[16, 9, 6, 10, 11, 14, 4] end;

    insert into public.campaigns (org_id, assessment_version_id, scoring_rule_version_id, name, description, status,
                                  privacy_mode, opens_at, closes_at, expected_participants, response_limit)
    values (v_org, v_version, v_rules,
            case v_round when 1 then 'Organizational Health Baseline' else 'Organizational Health Follow-up' end,
            'Demonstration campaign populated with synthetic responses.',
            'draft', 'confidential', v_close - interval '21 days', v_close, 90, 1000)
    returning id into v_campaign;

    for v_i in 1..array_length(v_depts, 1) loop
      insert into public.campaign_segment_options (campaign_id, kind, label, sort_order)
      values (v_campaign, 'department', v_depts[v_i], v_i);
    end loop;
    for v_i in 1..array_length(v_locs, 1) loop
      insert into public.campaign_segment_options (campaign_id, kind, label, sort_order)
      values (v_campaign, 'location', v_locs[v_i], v_i);
    end loop;
    for v_i in 1..array_length(v_levels, 1) loop
      insert into public.campaign_segment_options (campaign_id, kind, label, sort_order)
      values (v_campaign, 'level', v_levels[v_i], v_i);
    end loop;

    update public.campaigns set status = 'open' where id = v_campaign;

    for v_dept in
      select o.id, o.sort_order from public.campaign_segment_options o
      where o.campaign_id = v_campaign and o.kind = 'department' order by o.sort_order
    loop
      for v_n in 1..v_sizes[v_dept.sort_order] loop
        select id into v_loc from public.campaign_segment_options
          where campaign_id = v_campaign and kind = 'location' order by random() limit 1;
        select id into v_lvl from public.campaign_segment_options
          where campaign_id = v_campaign and kind = 'level'
          order by (case sort_order when 1 then random() * 0.4 when 2 then random() * 0.8 when 3 then random() else random() * 3 end) limit 1;
        v_tenure := v_tenures[1 + floor(random() * 5)::int];
        v_person := (random() + random() + random() - 1.5) * 0.9;   -- individual tendency

        insert into public.responses (campaign_id, org_id, assessment_version_id, department_option_id,
                                      location_option_id, level_option_id,
                                      tenure_range, is_synthetic)
        values (v_campaign, v_org, v_version, v_dept.id,
                case when random() < 0.9 then v_loc end, case when random() < 0.85 then v_lvl end,
                case when random() < 0.9 then v_tenure end, true)
        returning id into v_resp;

        for q in
          select qu.id, qu.allow_na, d.key as dim_key from public.questions qu
          join public.dimensions d on d.id = qu.dimension_id
          where qu.version_id = v_version
        loop
          v_cur := (v_base -> v_round::text ->> q.dim_key)::double precision
                   + v_dept_off[v_dept.sort_order] + v_person + (random() - 0.5) * 1.6;
          v_des := (v_desired ->> q.dim_key)::double precision + (random() - 0.5) * 1.0;
          v_cur_na := q.allow_na and random() < 0.06;
          v_des_na := v_cur_na and random() < 0.8;
          insert into public.response_items (response_id, question_id, current_value, current_na, desired_value, desired_na)
          values (v_resp, q.id,
                  case when v_cur_na then null else greatest(1, least(5, round(v_cur)))::smallint end, v_cur_na,
                  case when v_des_na then null else greatest(1, least(5, round(v_des)))::smallint end, v_des_na);
        end loop;
      end loop;
    end loop;

    -- Synthetic comments (not linked to responses, mirroring production design).
    for qq in select id, key from public.qualitative_questions where version_id = v_version loop
      v_arr := v_comments -> qq.key;
      for v_i in 1..(case v_round when 1 then 22 else 26 end) loop
        v_body := v_arr ->> floor(random() * jsonb_array_length(v_arr))::int;
        insert into public.response_comments (campaign_id, org_id, qualitative_question_id, body, consent_to_quote, is_synthetic)
        values (v_campaign, v_org, qq.id, v_body, random() < 0.4, true);
      end loop;
    end loop;

    insert into public.campaign_daily_participation (campaign_id, day, submissions)
    select v_campaign, d::date, 0
    from generate_series(v_close - interval '21 days', v_close - interval '1 day', interval '1 day') d;
    update public.campaign_daily_participation p
       set submissions = sub.cnt
      from (
        select day, count(*)::int as cnt from (
          select (v_close - interval '21 days' + (floor(power(random(), 1.8) * 21)::int) * interval '1 day')::date as day
          from public.responses where campaign_id = v_campaign
        ) s group by day
      ) sub
     where p.campaign_id = v_campaign and p.day = sub.day;

    update public.campaigns set status = 'closed', closed_at = v_close, launched_at = v_close - interval '21 days' where id = v_campaign;
  end loop;

  insert into public.audit_logs (org_id, action, target_type, target_id, metadata)
  values (v_org, 'demo.seeded', 'organization', v_org::text, '{"synthetic": true}');

  return v_org;
end $$;

revoke all on function public.seed_demo_organization() from public, anon, authenticated;

select public.seed_demo_organization();
