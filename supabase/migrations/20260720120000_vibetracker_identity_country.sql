-- Optional ISO 3166-1 alpha-2 country selected by an attested VibeTRACKER identity.
-- The CLI sends lowercase values and the ingest function validates them again before writing.
alter table public.vibetracker_identities
  add column if not exists country text
  check (country ~ '^[a-z]{2}$' or country is null);

-- Keep private account linkage out of the public surface while exposing the profile metadata
-- needed by the leaderboard. The new column is appended so CREATE OR REPLACE preserves the
-- existing view column order.
create or replace view public.vibetracker_public_identities
with (security_invoker = false) as
  select i.id, i.provider, i.provider_login, i.canonical_handle, i.display_name, i.avatar_url,
         i.verified_at, i.created_at, (i.user_id is not null) as account_linked,
         coalesce(h.is_premium, false) as is_premium,
         coalesce(h.verified_kind::text, 'none') as verified_kind,
         i.country
  from public.vibetracker_identities i
  left join public.user_handles h on h.user_id = i.user_id;

grant select on public.vibetracker_public_identities to anon, authenticated;
