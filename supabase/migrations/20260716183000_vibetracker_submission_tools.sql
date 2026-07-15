-- Aggregate-only tool attribution. A tool can orchestrate a separately billed provider, so this
-- table powers "My Tools" without duplicating usage records or persisting source events.

create table if not exists public.vibetracker_submission_tools (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.vibetracker_submissions(id) on delete cascade,
  tool           text not null check (char_length(tool) between 1 and 64),
  ops            numeric not null default 0 check (ops >= 0),
  credits        numeric not null default 0 check (credits >= 0),
  usd            numeric not null default 0 check (usd >= 0),
  created_at     timestamptz not null default now(),
  unique (submission_id, tool)
);

create index if not exists vibetracker_sub_tools_idx
  on public.vibetracker_submission_tools(submission_id, ops desc);

alter table public.vibetracker_submission_tools enable row level security;

drop policy if exists "vt read tool aggregates" on public.vibetracker_submission_tools;
create policy "vt read tool aggregates"
  on public.vibetracker_submission_tools for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.

comment on table public.vibetracker_submission_tools is
  'Aggregate tool attribution independent from billing provider; no raw events or creative content.';
