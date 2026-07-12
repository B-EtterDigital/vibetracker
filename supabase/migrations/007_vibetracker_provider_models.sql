-- VibeTRACKER per-provider model breakdown for the profile "click a source, see the models" list.
--
-- Aggregate-only: which models a source used, with ops/credits/usd, derived by the service-role
-- ingest function. No prompts, raw records, API keys, or individual events are stored here.

create table if not exists public.vibetracker_submission_provider_models (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  provider        text not null check (char_length(provider) between 1 and 64),
  model           text not null check (char_length(model) between 1 and 128),
  ops             bigint not null default 0 check (ops >= 0),
  credits         numeric not null default 0 check (credits >= 0),
  usd             numeric not null default 0 check (usd >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, provider, model)
);

create index if not exists vibetracker_sub_provider_model_idx
  on public.vibetracker_submission_provider_models(submission_id, provider);

alter table public.vibetracker_submission_provider_models enable row level security;

drop policy if exists "vt read provider model aggregates" on public.vibetracker_submission_provider_models;
create policy "vt read provider model aggregates"
  on public.vibetracker_submission_provider_models for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.
