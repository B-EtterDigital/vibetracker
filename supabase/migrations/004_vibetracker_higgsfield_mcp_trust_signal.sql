-- Add a separate Higgsfield MCP connection trust signal.
-- This is public context only: it never changes usage totals, spend, credits, rank, or verified tier.

alter table public.vibetracker_submission_trust_signals
  drop constraint if exists vibetracker_submission_trust_signals_kind_check;

alter table public.vibetracker_submission_trust_signals
  add constraint vibetracker_submission_trust_signals_kind_check
  check (kind in ('github_activity', 'creator_activity', 'higgsfield_mcp'));
