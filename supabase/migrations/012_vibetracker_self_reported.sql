-- Self-reported truths a viber declares that the usage data genuinely cannot reveal: how many
-- agents they run in parallel, and their real subscription stack. Set with `vibetracker profile
-- --parallel-agents N --subs "..."`. Shown on the profile as SELF-REPORTED (a distinct tier from
-- both measured data and reconstructed estimates), so it never masquerades as measured.
alter table public.vibetracker_submissions
  add column if not exists self_reported_agents integer;
alter table public.vibetracker_submissions
  add column if not exists self_reported_subs text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vibetracker_submissions_self_reported_agents_check'
  ) then
    alter table public.vibetracker_submissions
      add constraint vibetracker_submissions_self_reported_agents_check
      check (self_reported_agents is null or (self_reported_agents >= 0 and self_reported_agents <= 1000));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'vibetracker_submissions_self_reported_subs_check'
  ) then
    alter table public.vibetracker_submissions
      add constraint vibetracker_submissions_self_reported_subs_check
      check (self_reported_subs is null or char_length(self_reported_subs) <= 200);
  end if;
end
$$;

comment on column public.vibetracker_submissions.self_reported_agents is
  'Optional viber-declared parallel agent count. Self-reported context only; never usage or rank.';
comment on column public.vibetracker_submissions.self_reported_subs is
  'Optional viber-declared subscription stack. Self-reported context only; never usage or rank.';
