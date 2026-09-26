-- ROHA Migration 003: reference data — roles, plans, the ROHA Organizational
-- Health Framework (assessment version 1), scoring rules v1, and the initial
-- AI reporting instructions.
--
-- All assessment wording below is original to ROHA / Rodrik Consulting LLC.

insert into public.roles (key, name, description, permissions, rank) values
  ('owner',  'Organization Owner',
   'Full control of the organization workspace, including billing, team management, data export and deletion.',
   array['org.read','org.update','org.delete','org.export','team.manage','billing.manage','campaign.manage','results.read','reports.generate','audit.read'], 30),
  ('admin',  'Organization Administrator',
   'Creates and manages assessment campaigns, views results and generates executive reports.',
   array['org.read','org.update','campaign.manage','results.read','reports.generate','audit.read'], 20),
  ('viewer', 'Executive Viewer',
   'Read-only access to privacy-screened results and executive reports.',
   array['org.read','results.read'], 10);

insert into public.plans (key, name, tagline, description, price_cents, billing_interval, sort_order,
                          max_campaigns, max_responses_per_campaign, max_admins, access_months, features, marketing_bullets) values
  ('discover', 'ROHA Discover', 'Free',
   'A first look at your organization''s health with one assessment campaign.',
   0, 'free', 1, 1, 25, 1, null,
   '{"segment_comparisons": false, "ai_report": "basic", "pdf_export": false, "historical_comparisons": false, "recurring_assessments": false, "advanced_dashboards": false, "access_codes": false, "consulting": false}',
   array['One assessment campaign', 'Up to 25 employee responses', 'Basic organizational dashboard', 'Basic executive summary']),
  ('professional', 'ROHA Professional', '$499 per assessment',
   'A comprehensive assessment with advanced reporting and AI-generated organizational analysis.',
   49900, 'one_time', 2, 1, 100, 2, 12,
   '{"segment_comparisons": true, "ai_report": "full", "pdf_export": true, "historical_comparisons": false, "recurring_assessments": false, "advanced_dashboards": false, "access_codes": true, "consulting": false}',
   array['Comprehensive assessment', 'Up to 100 employee responses', 'Advanced reporting', 'Departmental comparisons', 'Executive PDF report', 'AI-generated organizational analysis']),
  ('enterprise', 'ROHA Enterprise', '$199 per month',
   'Ongoing organizational intelligence with recurring assessments and historical comparisons.',
   19900, 'month', 3, null, 1000, 10, null,
   '{"segment_comparisons": true, "ai_report": "full", "pdf_export": true, "historical_comparisons": true, "recurring_assessments": true, "advanced_dashboards": true, "access_codes": true, "consulting": false}',
   array['Recurring assessments', 'Historical comparisons', 'Advanced organizational dashboards', 'Multiple administrators', 'Ongoing executive intelligence']),
  ('strategic', 'ROHA Strategic', 'Custom consulting engagement',
   'A Rodrik Consulting engagement combining ROHA with professional organizational diagnosis.',
   null, 'custom', 4, null, null, null, null,
   '{"segment_comparisons": true, "ai_report": "full", "pdf_export": true, "historical_comparisons": true, "recurring_assessments": true, "advanced_dashboards": true, "access_codes": true, "consulting": true}',
   array['Professional organizational diagnosis', 'Executive interviews', 'Strategic recommendations', 'Transformation roadmap', 'Rodrik Consulting engagement']);

-- ---------------------------------------------------------------------------
-- ROHA Organizational Health Framework — version 1
-- ---------------------------------------------------------------------------

do $$
declare
  v_template uuid;
  v_version  uuid;
  d_le uuid; d_oc uuid; d_ee uuid; d_oe uuid; d_ia uuid; d_sa uuid;
begin
  insert into public.assessment_templates (key, name, description)
  values ('roha_core', 'ROHA Organizational Health Assessment',
          'The ROHA six-dimension organizational health framework measuring current and desired states.')
  returning id into v_template;

  insert into public.assessment_versions (template_id, version_number, status, title, change_notes)
  values (v_template, 1, 'draft', 'ROHA Organizational Health Assessment — Version 1',
          'Initial release of the six-dimension ROHA framework (24 core items, 3 optional open-ended items).')
  returning id into v_version;

  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'leadership', 'LE', 'Leadership Effectiveness',
     'How employees experience the integrity, direction, accountability and decision-making of organizational leadership.', 1)
    returning id into d_le;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'culture', 'OC', 'Organizational Culture',
     'The working environment and the shared behavioral expectations that shape how people treat one another.', 2)
    returning id into d_oc;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'engagement', 'EE', 'Employee Engagement',
     'The relationship employees have with their work and with the organization.', 3)
    returning id into d_ee;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'operations', 'OE', 'Operational Effectiveness',
     'The degree to which processes, tools, coordination and clarity enable people to do their work well.', 4)
    returning id into d_oe;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'innovation', 'IA', 'Innovation and Adaptability',
     'How open the organization is to new ideas and how effectively it adapts and improves.', 5)
    returning id into d_ia;
  insert into public.dimensions (version_id, key, code, name, description, sort_order) values
    (v_version, 'strategy', 'SA', 'Strategic Alignment',
     'Whether employees understand organizational priorities and can connect their work to them.', 6)
    returning id into d_sa;

  insert into public.questions (version_id, dimension_id, key, focus, prompt, allow_na, sort_order) values
    -- Leadership Effectiveness
    (v_version, d_le, 'LE1', 'Leadership integrity and trust',
     'I trust senior leaders to be honest with employees.', false, 1),
    (v_version, d_le, 'LE2', 'Clarity of organizational direction',
     'Leadership has communicated a clear direction for where the organization is heading.', false, 2),
    (v_version, d_le, 'LE3', 'Management accountability and consistency',
     'Managers are held to the same standards of accountability as the people they lead.', true, 3),
    (v_version, d_le, 'LE4', 'Confidence in leadership decisions',
     'I have confidence in the decisions made by leadership.', false, 4),
    -- Organizational Culture
    (v_version, d_oc, 'OC1', 'Collaboration and teamwork',
     'People here work together effectively to accomplish shared goals.', false, 1),
    (v_version, d_oc, 'OC2', 'Respect and inclusion',
     'Employees are treated as valued members of the organization regardless of their background or position.', false, 2),
    (v_version, d_oc, 'OC3', 'Psychological safety',
     'I can speak up about problems or concerns without fear of negative consequences.', false, 3),
    (v_version, d_oc, 'OC4', 'Values and behavior alignment',
     'The way people actually behave here reflects the organization''s stated values.', false, 4),
    -- Employee Engagement
    (v_version, d_ee, 'EE1', 'Sense of purpose',
     'My work gives me a sense of purpose.', false, 1),
    (v_version, d_ee, 'EE2', 'Recognition and appreciation',
     'I receive meaningful recognition when I do good work.', false, 2),
    (v_version, d_ee, 'EE3', 'Professional development',
     'I have access to opportunities to grow professionally.', false, 3),
    (v_version, d_ee, 'EE4', 'Commitment to the organization',
     'I feel committed to helping this organization succeed.', false, 4),
    -- Operational Effectiveness
    (v_version, d_oe, 'OE1', 'Process efficiency',
     'Our work processes allow tasks to be completed without unnecessary steps or delays.', false, 1),
    (v_version, d_oe, 'OE2', 'Tools and technology',
     'I have the tools and technology I need to do my job well.', false, 2),
    (v_version, d_oe, 'OE3', 'Interdepartmental coordination',
     'Departments coordinate effectively when work depends on more than one team.', true, 3),
    (v_version, d_oe, 'OE4', 'Clarity of responsibilities and procedures',
     'It is clear who is responsible for each part of the work I am involved in.', false, 4),
    -- Innovation and Adaptability
    (v_version, d_ia, 'IA1', 'Openness to new ideas',
     'New ideas are welcomed here, even when they challenge established ways of working.', false, 1),
    (v_version, d_ia, 'IA2', 'Responsiveness to change',
     'The organization adapts effectively when circumstances change.', true, 2),
    (v_version, d_ia, 'IA3', 'Improving inefficient processes',
     'When a process is not working well, the organization takes action to improve it.', false, 3),
    (v_version, d_ia, 'IA4', 'Support for employee-driven innovation',
     'Employees receive the support they need to try out their ideas for improvement.', true, 4),
    -- Strategic Alignment
    (v_version, d_sa, 'SA1', 'Understanding of organizational goals',
     'I understand the organization''s most important goals.', false, 1),
    (v_version, d_sa, 'SA2', 'Alignment of daily work with objectives',
     'My day-to-day work directly supports the organization''s business objectives.', false, 2),
    (v_version, d_sa, 'SA3', 'Communication of strategic priorities',
     'Strategic priorities are communicated to employees on a regular basis.', false, 3),
    (v_version, d_sa, 'SA4', 'Understanding of individual contribution',
     'I understand how my individual contributions affect the organization''s success.', false, 4);

  insert into public.qualitative_questions (version_id, key, prompt, sort_order) values
    (v_version, 'does_well',    'What is one thing this organization does particularly well?', 1),
    (v_version, 'makes_harder', 'What is one thing that makes your work more difficult than it needs to be?', 2),
    (v_version, 'recommend',    'If you could recommend one organizational improvement to leadership, what would it be?', 3);

  update public.assessment_versions set status = 'published' where id = v_version;
end $$;

-- ---------------------------------------------------------------------------
-- Scoring rules — version 1
-- ---------------------------------------------------------------------------

insert into public.scoring_rule_versions (version_number, name, status, config, notes) values
  (1, 'ROHA Scoring Rules v1', 'draft',
   '{
      "scaleMin": 1,
      "scaleMax": 5,
      "normalization": "linear_0_100",
      "questionWeights": {},
      "dimensionWeights": {},
      "minValidCurrentRatings": 12,
      "minGroupSize": 5,
      "gapThresholds": { "notable": 10, "substantial": 20 },
      "bands": [
        { "min": 0,  "label": "Needs focused attention" },
        { "min": 40, "label": "Mixed perceptions" },
        { "min": 60, "label": "Generally favorable" },
        { "min": 80, "label": "Strongly favorable" }
      ]
    }'::jsonb,
   'Equal question weights within dimensions; equal dimension weights in the overall index. Normalized score = ((rating - 1) / 4) × 100. Gap = desired − current. N/A and missing ratings are excluded from averages. A response is valid when it contains at least 12 numeric current-state ratings. Descriptive bands are interpretive aids, not validated cut-offs.');
update public.scoring_rule_versions set status = 'published' where version_number = 1;

-- ---------------------------------------------------------------------------
-- AI reporting instructions — version 1
-- ---------------------------------------------------------------------------

insert into public.ai_report_instructions (version_number, name, status, system_prompt) values
  (1, 'Executive Intelligence Report v1', 'active',
$prompt$You are the ROHA Organizational Intelligence analyst, writing on behalf of Rodrik Consulting LLC for the executive team of a client organization. ROHA (Rodrik Organizational Health Assessment) is an independently developed diagnostic that measures employee perceptions across six dimensions: Leadership Effectiveness, Organizational Culture, Employee Engagement, Operational Effectiveness, Innovation and Adaptability, and Strategic Alignment. Each of 24 items is rated twice on a 1–5 agreement scale: the CURRENT state (how employees experience the organization today) and the DESIRED state (how they believe it should operate). Ratings are converted to a 0–100 descriptive index; the gap is desired minus current.

You will receive a JSON object containing the official, deterministically calculated results and, when available, privacy-screened employee comments. Write the executive report as structured JSON matching the requested schema.

Evidence rules — these are strict:
- The numbers in the input are the only official scores. Never calculate, estimate, adjust or invent any number. When you cite a figure, copy it exactly as it appears in the input (the same rounding). Prefer citing dimension-level figures over item-level figures.
- Do not invent statistics, percentages, benchmarks, industry comparisons, employee quotes, ROI estimates, or business outcomes. There are no industry benchmarks in ROHA.
- Distinguish clearly between findings (directly supported by the response data) and hypotheses (plausible explanations that leadership would need to investigate further). Put each in the field designed for it.
- A positive gap means employees would prefer a stronger presence of the measured characteristic. A negative gap means a preference for less of it; do not automatically treat negative gaps as problems.
- Scores describe perceptions of the responding employees. They do not establish organizational effectiveness, productivity, financial performance, or retention risk.
- Do not infer or speculate about employee mental health, the performance of any individual, misconduct by any specific manager, or the likelihood that anyone will resign.
- Employee comments are paraphrased themes. Never quote a comment verbatim, never attempt to identify an author, and never mention names, roles, locations or other details that could point to an individual. If comments mention a person by name, refer only to the general topic.
- If the sample is small or participation is low, say so plainly and temper conclusions accordingly.
- If data for a section is insufficient, say that the data is insufficient rather than filling the section with generic advice.

Style: Write for senior executives. Be specific, measured, and practical. Use plain professional English, short paragraphs, and no marketing language. Do not use markdown formatting inside the JSON string values. Action plan items must be realistic for the organization to investigate or implement, name an owner ROLE (never a person), and propose a success metric that the organization could actually observe (for example, a change in a future ROHA dimension score, or completion of a defined activity).$prompt$);
