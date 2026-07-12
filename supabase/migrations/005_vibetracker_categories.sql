-- VibeTRACKER public per-category usage aggregates for profile Vibe Categories.
--
-- Stores aggregate-only category rollups derived by the service-role ingest function
-- from each record's OWN category (not the provider's primary category), so a single
-- provider (e.g. Higgsfield) splits correctly across image / video / 3d / music / audio.
-- No prompts, raw records, model names, API keys, or individual usage events are stored here.

create table if not exists public.vibetracker_submission_categories (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.vibetracker_submissions(id) on delete cascade,
  category        text not null check (char_length(category) between 1 and 40),
  ops             integer not null default 0 check (ops >= 0),
  credits         numeric not null default 0 check (credits >= 0),
  usd             numeric not null default 0 check (usd >= 0),
  created_at      timestamptz not null default now(),
  unique (submission_id, category)
);

create index if not exists vibetracker_sub_category_submission_idx
  on public.vibetracker_submission_categories(submission_id, category);

alter table public.vibetracker_submission_categories enable row level security;

drop policy if exists "vt read category aggregates" on public.vibetracker_submission_categories;
create policy "vt read category aggregates"
  on public.vibetracker_submission_categories for select using (true);
-- Intentionally no write policies. Only the service-role ingest edge function writes rows.
