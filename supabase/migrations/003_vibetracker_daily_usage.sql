-- VibeTRACKER public daily usage aggregates for profile heatgrids.
--
-- Stores aggregate-only rhythm data derived by the service-role ingest function.
-- No prompts, raw records, model names, API keys, or individual usage events are stored here.

create table if not exists public.vibetracker_submission_daily_usage (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  day             date not null,
  ops             integer not null default 0 check (ops >= 0),
  credits         numeric not null default 0 check (credits >= 0),
  usd             numeric not null default 0 check (usd >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, day)
);

create index if not exists vibetracker_sub_daily_submission_day_idx
  on public.vibetracker_submission_daily_usage(submission_id, day);

alter table public.vibetracker_submission_daily_usage enable row level security;

drop policy if exists "vt read daily usage aggregates" on public.vibetracker_submission_daily_usage;
create policy "vt read daily usage aggregates"
  on public.vibetracker_submission_daily_usage for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.
