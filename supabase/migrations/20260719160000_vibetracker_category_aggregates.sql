-- Aggregate-schema correction (SMOA stats audit 2026-07-19): persist each record's authoritative
-- category on the per-provider daily and per-provider model aggregates, so the profile never has
-- to GUESS categories with regexes (which misfiled models and cross-painted multi-category
-- providers' spend into every trait). Nullable: legacy submissions predate it.
alter table public.vibetracker_submission_provider_daily add column if not exists category text;
alter table public.vibetracker_submission_provider_models add column if not exists category text;
create index if not exists vibetracker_sub_pd_category_idx
  on public.vibetracker_submission_provider_daily(submission_id, category);
