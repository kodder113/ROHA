-- ROHA — Rodrik Organizational Health Assessment
-- Migration 001: core schema
--
-- Design notes
-- * Every tenant-owned row carries org_id so RLS can enforce isolation.
-- * Raw survey data (responses, response_items, response_comments,
--   participation_tokens) is never readable by organization users; only the
--   server (service role) reads it to compute privacy-screened aggregates.
-- * Responses carry no timestamps, no token reference, and no network data, so
--   individual submissions cannot be linked to a person by metadata.
-- * Assessment content and scoring rules are versioned; campaigns pin the
--   versions they were launched with so historical results never change.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Roles & platform administration
-- ---------------------------------------------------------------------------

create table public.roles (
  key          text primary key,
  name         text not null,
  description  text not null,
  permissions  text[] not null default '{}',
  rank         smallint not null default 0
);

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Plans & subscriptions
-- ---------------------------------------------------------------------------

create table public.plans (
  id                          uuid primary key default gen_random_uuid(),
  key                         text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name                        text not null,
  tagline                     text,
  description                 text,
  price_cents                 integer check (price_cents is null or price_cents >= 0),
  currency                    text not null default 'usd',
  billing_interval            text not null check (billing_interval in ('free', 'one_time', 'month', 'custom')),
  stripe_price_id             text,
  is_public                   boolean not null default true,
  active                      boolean not null default true,
  sort_order                  smallint not null default 0,
  -- null = unlimited. For one_time plans this is the number of campaigns
  -- granted per purchase.
  max_campaigns               integer check (max_campaigns is null or max_campaigns >= 0),
  max_responses_per_campaign  integer check (max_responses_per_campaign is null or max_responses_per_campaign > 0),
  max_admins                  integer check (max_admins is null or max_admins > 0),
  access_months               integer check (access_months is null or access_months > 0),
  features                    jsonb not null default '{}'::jsonb,
  marketing_bullets           text[] not null default '{}',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizations (tenants)
-- ---------------------------------------------------------------------------

create table public.organizations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null check (char_length(name) between 2 and 200),
  slug                   text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  industry               text,
  employee_count_range   text,
  website                text,
  country                text,
  region                 text,
  contact_name           text,
  contact_email          text,
  contact_title          text,
  contact_phone          text,
  status                 text not null default 'active' check (status in ('active', 'suspended')),
  is_pilot               boolean not null default false,
  pilot_notes            text,
  is_demo                boolean not null default false,
  data_retention_months  integer not null default 36 check (data_retention_months between 6 and 120),
  stripe_customer_id     text unique,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.organization_members (
  org_id         uuid not null references public.organizations (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  role_key       text not null references public.roles (key),
  status         text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  invited_email  text,
  invited_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

-- Registration details captured before the administrator verifies their email.
create table public.pending_registrations (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create table public.subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  org_id                      uuid not null references public.organizations (id) on delete cascade,
  plan_id                     uuid not null references public.plans (id),
  status                      text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired', 'incomplete')),
  source                      text not null check (source in ('free', 'stripe', 'complimentary', 'manual')),
  campaign_credits            integer check (campaign_credits is null or campaign_credits >= 0),
  limit_overrides             jsonb not null default '{}'::jsonb,
  started_at                  timestamptz not null default now(),
  current_period_end          timestamptz,
  stripe_subscription_id      text unique,
  stripe_checkout_session_id  text unique,
  notes                       text,
  created_by                  uuid references auth.users (id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index subscriptions_org_idx on public.subscriptions (org_id, status);

create table public.billing_events (
  id            text primary key,               -- Stripe event id (idempotency)
  type          text not null,
  org_id        uuid references public.organizations (id) on delete set null,
  payload       jsonb not null,
  processed_at  timestamptz not null default now(),
  error         text
);

-- ---------------------------------------------------------------------------
-- Assessment content (versioned)
-- ---------------------------------------------------------------------------

create table public.assessment_templates (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create table public.assessment_versions (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references public.assessment_templates (id) on delete restrict,
  version_number  integer not null check (version_number > 0),
  status          text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  title           text not null,
  current_label   text not null default 'Current state — how the organization operates today',
  desired_label   text not null default 'Desired state — how the organization should operate in the future',
  change_notes    text,
  published_at    timestamptz,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (template_id, version_number)
);

create table public.dimensions (
  id           uuid primary key default gen_random_uuid(),
  version_id   uuid not null references public.assessment_versions (id) on delete cascade,
  key          text not null check (key ~ '^[a-z][a-z_]*$'),
  code         text not null,
  name         text not null,
  description  text not null,
  sort_order   smallint not null,
  unique (version_id, key),
  unique (version_id, sort_order)
);

create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  version_id    uuid not null references public.assessment_versions (id) on delete cascade,
  dimension_id  uuid not null references public.dimensions (id) on delete cascade,
  key           text not null check (key ~ '^[A-Z]{2}[0-9]+$'),
  focus         text not null,
  prompt        text not null check (char_length(prompt) between 10 and 400),
  allow_na      boolean not null default false,
  sort_order    smallint not null,
  unique (version_id, key),
  unique (dimension_id, sort_order)
);
create index questions_dimension_idx on public.questions (dimension_id);

create table public.qualitative_questions (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references public.assessment_versions (id) on delete cascade,
  key         text not null check (key ~ '^[a-z][a-z_]*$'),
  prompt      text not null,
  sort_order  smallint not null,
  unique (version_id, key)
);

-- ---------------------------------------------------------------------------
-- Scoring rules (versioned, configurable)
-- ---------------------------------------------------------------------------

create table public.scoring_rule_versions (
  id              uuid primary key default gen_random_uuid(),
  version_number  integer not null unique check (version_number > 0),
  name            text not null,
  status          text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  config          jsonb not null,
  notes           text,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  published_at    timestamptz
);

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------

create table public.campaigns (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null references public.organizations (id) on delete cascade,
  assessment_version_id     uuid not null references public.assessment_versions (id) on delete restrict,
  scoring_rule_version_id   uuid not null references public.scoring_rule_versions (id) on delete restrict,
  subscription_id           uuid references public.subscriptions (id) on delete set null,
  name                      text not null check (char_length(name) between 2 and 160),
  description               text,
  status                    text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  privacy_mode              text not null default 'confidential' check (privacy_mode in ('confidential', 'anonymous')),
  opens_at                  timestamptz not null,
  closes_at                 timestamptz not null,
  expected_participants     integer check (expected_participants is null or expected_participants > 0),
  response_limit            integer check (response_limit is null or response_limit > 0),
  require_access_code       boolean not null default false,
  collect_levels            boolean not null default true,
  survey_token              text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  launched_at               timestamptz,
  closed_at                 timestamptz,
  created_by                uuid references auth.users (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (closes_at > opens_at)
);
create index campaigns_org_idx on public.campaigns (org_id, status);

create table public.campaign_segment_options (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  kind         text not null check (kind in ('department', 'location', 'level')),
  label        text not null check (char_length(label) between 1 and 120),
  sort_order   smallint not null default 0,
  unique (campaign_id, kind, label)
);
create index campaign_segment_options_campaign_idx on public.campaign_segment_options (campaign_id, kind);

-- Privacy-preserving participation tokens. Only an HMAC of the token is stored;
-- no response row references a token, and no submission time is recorded.
create table public.participation_tokens (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  token_hash   text not null,
  kind         text not null check (kind in ('session', 'access_code')),
  status       text not null default 'issued' check (status in ('issued', 'submitted', 'revoked')),
  issued_on    date not null default current_date,
  unique (campaign_id, token_hash)
);

-- ---------------------------------------------------------------------------
-- Survey responses (raw data — never exposed to organization users)
-- ---------------------------------------------------------------------------

create table public.responses (
  id                     uuid primary key default gen_random_uuid(),
  campaign_id            uuid not null references public.campaigns (id) on delete cascade,
  org_id                 uuid not null references public.organizations (id) on delete cascade,
  assessment_version_id  uuid not null references public.assessment_versions (id) on delete restrict,
  department_option_id   uuid references public.campaign_segment_options (id) on delete set null,
  location_option_id     uuid references public.campaign_segment_options (id) on delete set null,
  level_option_id        uuid references public.campaign_segment_options (id) on delete set null,
  tenure_range           text check (tenure_range in ('lt_1', '1_2', '3_5', '6_10', 'gt_10')),
  is_synthetic           boolean not null default false
);
create index responses_campaign_idx on public.responses (campaign_id);

create table public.response_items (
  response_id    uuid not null references public.responses (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete restrict,
  current_value  smallint check (current_value between 1 and 5),
  current_na     boolean not null default false,
  desired_value  smallint check (desired_value between 1 and 5),
  desired_na     boolean not null default false,
  primary key (response_id, question_id),
  check (not (current_na and current_value is not null)),
  check (not (desired_na and desired_value is not null))
);
create index response_items_question_idx on public.response_items (question_id);

-- Open-ended comments are stored WITHOUT a link to the response row so they
-- cannot be joined to demographics or ratings.
create table public.response_comments (
  id                        uuid primary key default gen_random_uuid(),
  campaign_id               uuid not null references public.campaigns (id) on delete cascade,
  org_id                    uuid not null references public.organizations (id) on delete cascade,
  qualitative_question_id   uuid not null references public.qualitative_questions (id) on delete restrict,
  body                      text not null check (char_length(body) between 1 and 2000),
  consent_to_quote          boolean not null default false,
  is_synthetic              boolean not null default false
);
create index response_comments_campaign_idx on public.response_comments (campaign_id);

-- Daily submission counters for the participation dashboard (counts only).
create table public.campaign_daily_participation (
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  day          date not null,
  submissions  integer not null default 0 check (submissions >= 0),
  primary key (campaign_id, day)
);

-- Cached, unsuppressed aggregates. Suppression is applied when served.
create table public.aggregated_results (
  id                       uuid primary key default gen_random_uuid(),
  campaign_id              uuid not null references public.campaigns (id) on delete cascade,
  scoring_rule_version_id  uuid not null references public.scoring_rule_versions (id) on delete restrict,
  engine_version           text not null,
  payload                  jsonb not null,
  valid_responses          integer not null,
  computed_at              timestamptz not null default now(),
  unique (campaign_id, scoring_rule_version_id)
);

-- ---------------------------------------------------------------------------
-- AI & generated reports
-- ---------------------------------------------------------------------------

create table public.ai_report_instructions (
  id              uuid primary key default gen_random_uuid(),
  version_number  integer not null unique check (version_number > 0),
  name            text not null,
  system_prompt   text not null,
  status          text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create unique index ai_report_instructions_one_active on public.ai_report_instructions (status) where status = 'active';

create table public.ai_reports (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references public.organizations (id) on delete cascade,
  campaign_id              uuid not null references public.campaigns (id) on delete cascade,
  status                   text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  report_level             text not null check (report_level in ('basic', 'full')),
  generator                text not null check (generator in ('rules', 'anthropic')),
  model                    text,
  instructions_version_id  uuid references public.ai_report_instructions (id) on delete set null,
  input_snapshot           jsonb,
  content                  jsonb,
  validation_warnings      jsonb not null default '[]'::jsonb,
  usage                    jsonb,
  error                    text,
  created_by               uuid references auth.users (id) on delete set null,
  created_at               timestamptz not null default now(),
  completed_at             timestamptz
);
create index ai_reports_campaign_idx on public.ai_reports (campaign_id, created_at desc);

create table public.generated_reports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  ai_report_id  uuid references public.ai_reports (id) on delete set null,
  format        text not null default 'pdf' check (format in ('pdf', 'json', 'csv')),
  byte_size     integer,
  sha256        text,
  generated_by  uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index generated_reports_org_idx on public.generated_reports (org_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Operations: audit trail, errors, contact, rate limiting
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id             bigint generated always as identity primary key,
  org_id         uuid references public.organizations (id) on delete set null,
  actor_user_id  uuid references auth.users (id) on delete set null,
  actor_email    text,
  scope          text not null default 'organization' check (scope in ('organization', 'platform')),
  action         text not null,
  target_type    text,
  target_id      text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs (org_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.app_errors (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  level       text not null default 'error' check (level in ('warn', 'error', 'fatal')),
  source      text not null,
  message     text not null,
  stack       text,
  context     jsonb not null default '{}'::jsonb,
  org_id      uuid references public.organizations (id) on delete set null,
  resolved    boolean not null default false
);
create index app_errors_created_idx on public.app_errors (created_at desc);

create table public.contact_inquiries (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  organization  text,
  topic         text,
  message       text not null check (char_length(message) <= 5000),
  status        text not null default 'new' check (status in ('new', 'responded', 'archived')),
  created_at    timestamptz not null default now()
);

create table public.rate_limits (
  key           text primary key,          -- HMAC of (scope, client, day); never a raw IP
  window_start  timestamptz not null,
  hits          integer not null default 0
);
