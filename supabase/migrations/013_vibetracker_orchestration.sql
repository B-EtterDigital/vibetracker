-- Local orchestration trace reconstructed from bounded gaps between agent-session timestamps.
-- This is uploaded derived evidence, not exact process runtime, billing time, human effort, or verified concurrency.
alter table public.vibetracker_submissions
  add column if not exists orchestration jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vibetracker_submissions_orchestration_object_check'
  ) then
    alter table public.vibetracker_submissions
      add constraint vibetracker_submissions_orchestration_object_check
      check (orchestration is null or jsonb_typeof(orchestration) = 'object');
  end if;
end
$$;

comment on column public.vibetracker_submissions.orchestration is
  'Optional CLI-derived activity-span trace from session timestamps; not exact runtime, billing time, human effort, or verified concurrency.';
