-- Self-reported truths a viber declares that the usage data genuinely cannot reveal — how many
-- agents they run in parallel, and their real subscription stack. Set with `vibetracker profile
-- --parallel-agents N --subs "..."`. Shown on the profile as SELF-REPORTED (a distinct tier from
-- both measured data and reconstructed estimates), so it never masquerades as measured.
alter table public.vibetracker_submissions
  add column if not exists self_reported_agents integer
  check (self_reported_agents is null or (self_reported_agents >= 0 and self_reported_agents <= 1000));
alter table public.vibetracker_submissions
  add column if not exists self_reported_subs text
  check (self_reported_subs is null or char_length(self_reported_subs) <= 200);
