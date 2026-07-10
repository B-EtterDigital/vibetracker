-- VibeTRACKER public trust signals for the C0VIBE Supabase project.
--
-- Additive companion to the production C0X migration:
--   002-C0X-v1/supabase/migrations/20260702120000_vibetracker_usage_leaderboard.sql
--
-- Stores sanitized, aggregate-only public evidence such as GitHub contribution cadence
-- and creator posting cadence. These rows are explicitly NOT usage and cannot affect
-- spend, credits, operations, rank, or verified tier.

create table if not exists public.vibetracker_submission_trust_signals (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  kind            text not null check (kind in ('github_activity', 'creator_activity')),
  source          text not null,
  label           text not null,
  affects_totals  boolean not null default false check (affects_totals = false),
  usage_verified  boolean not null default false check (usage_verified = false),
  payload         jsonb not null,
  created_at      timestamptz not null default now()
);

create index if not exists vibetracker_sub_trust_submission_idx
  on public.vibetracker_submission_trust_signals(submission_id);
create index if not exists vibetracker_sub_trust_kind_idx
  on public.vibetracker_submission_trust_signals(kind);

alter table public.vibetracker_submission_trust_signals enable row level security;

drop policy if exists "vt read trust signals" on public.vibetracker_submission_trust_signals;
create policy "vt read trust signals"
  on public.vibetracker_submission_trust_signals for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.
