-- Aggregate-only provider-native creation metrics. These answer what a media operation produced
-- without changing its operation count or persisting events, prompts, asset URLs, or raw records.

create table if not exists public.vibetracker_submission_native_metrics (
  id                uuid primary key default gen_random_uuid(),
  submission_id     uuid not null references public.vibetracker_submissions(id) on delete cascade,
  provider          text not null check (char_length(provider) between 1 and 64),
  category          text not null check (char_length(category) between 1 and 24),
  output_unit       text not null check (output_unit in ('track', 'image', 'clip', 'file')),
  outputs           numeric not null default 0 check (outputs >= 0),
  duration_seconds  numeric not null default 0 check (duration_seconds >= 0),
  created_at        timestamptz not null default now(),
  unique (submission_id, provider, category, output_unit)
);

create index if not exists vibetracker_sub_native_metrics_idx
  on public.vibetracker_submission_native_metrics(submission_id, category);

alter table public.vibetracker_submission_native_metrics enable row level security;

drop policy if exists "vt read native media aggregates" on public.vibetracker_submission_native_metrics;
create policy "vt read native media aggregates"
  on public.vibetracker_submission_native_metrics for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.

comment on table public.vibetracker_submission_native_metrics is
  'Aggregate provider-native output counts and durations; no operations, prompts, assets, or raw events.';
