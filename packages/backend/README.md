# @vibetracker/backend

Supabase backend for the leaderboard/upload layer (Viberank-derived). Owns the ingest
and connector logic that isn't part of the Next.js app.

- Migrations live in `/supabase/migrations`, edge functions in `/supabase/functions`.
- `verify-*` functions and `*verification*` migrations are the **auth-and-verification
  shared hot path** (serialized) — see PLAN §7.
- RLS on every table; secrets in Supabase secrets, never committed.
- Per repo rules, deploy with `supabase db push` / `supabase functions deploy` as part of
  the task — do not leave migration/deploy for the user.
