-- VibeTRACKER token breakdown + cross-provider agent (delegation) aggregates for the profile.
--
-- Aggregate-only, derived by the service-role ingest function: no prompts, raw records, or keys.
-- Token breakdown = the input / output / cache-read / cache-creation split (total + per provider).
-- Agents = the coding-agent CLIs that produced the usage (codex, claude, hermes, …) by active days
-- and cost — the cross-provider orchestration surface for SMOA-style delegation.

alter table public.vibetracker_submissions
  add column if not exists total_tokens bigint not null default 0;
alter table public.vibetracker_submissions
  add column if not exists cross_provider_days integer not null default 0;

create table if not exists public.vibetracker_submission_tokens (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  scope           text not null check (char_length(scope) between 1 and 64),   -- 'total' or a provider id
  input           bigint not null default 0 check (input >= 0),
  output          bigint not null default 0 check (output >= 0),
  cache_read      bigint not null default 0 check (cache_read >= 0),
  cache_creation  bigint not null default 0 check (cache_creation >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, scope)
);
create index if not exists vibetracker_sub_tokens_idx on public.vibetracker_submission_tokens(submission_id);

create table if not exists public.vibetracker_submission_agents (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  agent           text not null check (char_length(agent) between 1 and 64),
  active_days     integer not null default 0 check (active_days >= 0),
  cost            numeric not null default 0 check (cost >= 0),
  tokens          bigint not null default 0 check (tokens >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, agent)
);
create index if not exists vibetracker_sub_agents_idx on public.vibetracker_submission_agents(submission_id);

alter table public.vibetracker_submission_tokens enable row level security;
alter table public.vibetracker_submission_agents enable row level security;

drop policy if exists "vt read token aggregates" on public.vibetracker_submission_tokens;
create policy "vt read token aggregates"
  on public.vibetracker_submission_tokens for select using (true);

drop policy if exists "vt read agent aggregates" on public.vibetracker_submission_agents;
create policy "vt read agent aggregates"
  on public.vibetracker_submission_agents for select using (true);
-- No write policies. Only the service-role ingest edge function writes rows.
