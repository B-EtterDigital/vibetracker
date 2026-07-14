-- `ops` is the sum of normalized record quantity, not a database row count. Providers can
-- report both very large values (tokens/characters) and fractional values (seconds/credits).

begin;

alter table public.vibetracker_submission_providers
  alter column ops type numeric using ops::numeric;

alter table public.vibetracker_submission_daily_usage
  alter column ops type numeric using ops::numeric;

alter table public.vibetracker_submission_categories
  alter column ops type numeric using ops::numeric;

alter table public.vibetracker_submission_provider_daily
  alter column ops type numeric using ops::numeric;

alter table public.vibetracker_submission_provider_models
  alter column ops type numeric using ops::numeric;

commit;
