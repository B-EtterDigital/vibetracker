-- Usage quantities can legitimately exceed a signed 32-bit integer when providers report
-- tokens, characters, or other high-volume native units. Keep every public ops rollup aligned.

begin;

alter table public.vibetracker_submission_providers
  alter column ops type bigint using ops::bigint;

alter table public.vibetracker_submission_daily_usage
  alter column ops type bigint using ops::bigint;

alter table public.vibetracker_submission_categories
  alter column ops type bigint using ops::bigint;

alter table public.vibetracker_submission_provider_daily
  alter column ops type bigint using ops::bigint;

-- A failed required-provider insert in an older edge deployment could leave the submission
-- header behind. Non-empty submissions always have at least one provider aggregate.
delete from public.vibetracker_submissions as submission
where submission.record_count > 0
  and not exists (
    select 1
    from public.vibetracker_submission_providers as provider
    where provider.submission_id = submission.id
  );

commit;
