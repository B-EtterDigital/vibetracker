-- VibeTRACKER per-provider daily usage aggregates for the interactive profile chart.
--
-- Stores aggregate-only per-provider daily rollups derived by the service-role ingest
-- function, powering the profile's "click a provider into the big chart" + all-together
-- overlay. No prompts, raw records, model names, API keys, or individual events are stored.

create table if not exists public.vibetracker_submission_provider_daily (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  provider        text not null check (char_length(provider) between 1 and 64),
  day             date not null,
  ops             integer not null default 0 check (ops >= 0),
  credits         numeric not null default 0 check (credits >= 0),
  usd             numeric not null default 0 check (usd >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, provider, day)
);

create index if not exists vibetracker_sub_provider_daily_idx
  on public.vibetracker_submission_provider_daily(submission_id, provider, day);

alter table public.vibetracker_submission_provider_daily enable row level security;

drop policy if exists "vt read provider daily aggregates" on public.vibetracker_submission_provider_daily;
create policy "vt read provider daily aggregates"
  on public.vibetracker_submission_provider_daily for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.
