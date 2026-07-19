-- Cynaps3 derives one native output per completed track OR variation; NativeOutputUnit gained
-- "variation" (schema/record.ts), but the DB check still rejected it, failing the ENTIRE native
-- insert for any submission with variations — tracks AND audio duration disappeared with them
-- (SMOA re-audit #3, 2026-07-19). Widen the check.
alter table public.vibetracker_submission_native_metrics
  drop constraint if exists vibetracker_submission_native_metrics_output_unit_check;
alter table public.vibetracker_submission_native_metrics
  add constraint vibetracker_submission_native_metrics_output_unit_check
  check (output_unit in ('track', 'variation', 'image', 'clip', 'file'));
