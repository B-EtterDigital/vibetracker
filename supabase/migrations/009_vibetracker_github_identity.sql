-- GitHub-first identity for VibeTRACKER.
--
-- A GitHub-authenticated CLI can join the attested identity lane without first creating a
-- C0VIBE/WorkOS account. The immutable GitHub user id is the identity key; login/avatar are
-- display metadata. Raw GitHub credentials and OAuth tokens are never persisted. Later, a
-- service-role link operation can attach the same identity, tokens, and historical submissions
-- to a proven WorkOS/Supabase user without creating a second leaderboard profile.

create table if not exists public.vibetracker_identities (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null check (provider in ('github')),
  provider_subject  text not null,
  provider_login    text not null check (provider_login ~ '^[A-Za-z0-9-]{1,39}$'),
  canonical_handle  text not null unique check (canonical_handle ~ '^[a-z0-9_.-]{1,64}$'),
  display_name      text,
  avatar_url        text,
  user_id           uuid references auth.users(id) on delete set null,
  verified_at       timestamptz not null default now(),
  linked_at         timestamptz,
  last_seen_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (provider, provider_subject)
);

create unique index if not exists vibetracker_identities_user_provider_idx
  on public.vibetracker_identities(user_id, provider)
  where user_id is not null;
create index if not exists vibetracker_identities_login_idx
  on public.vibetracker_identities(provider, lower(provider_login));

alter table public.vibetracker_cli_auth
  add column if not exists identity_id uuid references public.vibetracker_identities(id) on delete set null;

alter table public.vibetracker_cli_tokens
  alter column user_id drop not null;
alter table public.vibetracker_cli_tokens
  add column if not exists identity_id uuid references public.vibetracker_identities(id) on delete cascade;

alter table public.vibetracker_cli_tokens
  drop constraint if exists vibetracker_cli_tokens_has_identity;
alter table public.vibetracker_cli_tokens
  add constraint vibetracker_cli_tokens_has_identity
  check (user_id is not null or identity_id is not null) not valid;
alter table public.vibetracker_cli_tokens
  validate constraint vibetracker_cli_tokens_has_identity;

create index if not exists vibetracker_cli_tokens_identity_idx
  on public.vibetracker_cli_tokens(identity_id)
  where identity_id is not null;

alter table public.vibetracker_submissions
  add column if not exists identity_id uuid references public.vibetracker_identities(id) on delete set null;
create index if not exists vibetracker_submissions_identity_idx
  on public.vibetracker_submissions(identity_id)
  where identity_id is not null;

alter table public.vibetracker_identities enable row level security;
-- No table policies: only service-role code can write or read the private account link.

create or replace view public.vibetracker_public_identities
with (security_invoker = false) as
  select i.id, i.provider, i.provider_login, i.canonical_handle, i.display_name, i.avatar_url,
         i.verified_at, i.created_at, (i.user_id is not null) as account_linked,
         coalesce(h.is_premium, false) as is_premium,
         coalesce(h.verified_kind::text, 'none') as verified_kind
  from public.vibetracker_identities i
  left join public.user_handles h on h.user_id = i.user_id;

grant select on public.vibetracker_public_identities to anon, authenticated;

-- Validate a pending VibeTRACKER device code and atomically issue an identity-bound CLI token.
-- The route verifies the short-lived GitHub access token against api.github.com first; this RPC
-- receives only sanitized public profile fields plus hashes of VibeTRACKER secrets.
create or replace function public.vibetracker_verify_github_device(
  p_device_code_hash text,
  p_token_hash text,
  p_provider_subject text,
  p_provider_login text,
  p_display_name text default null,
  p_avatar_url text default null
) returns table(identity_id uuid, linked_user_id uuid, canonical_handle text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth public.vibetracker_cli_auth%rowtype;
  v_identity public.vibetracker_identities%rowtype;
  v_handle text;
begin
  select * into v_auth
  from public.vibetracker_cli_auth
  where device_code_hash = p_device_code_hash
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invalid or expired device code' using errcode = '22023';
  end if;

  v_handle := lower(p_provider_login);
  if exists (
    select 1 from public.vibetracker_identities i
    where i.canonical_handle = v_handle
      and not (i.provider = 'github' and i.provider_subject = p_provider_subject)
  ) then
    v_handle := left(v_handle, 57) || '-' || right(p_provider_subject, 6);
  end if;

  insert into public.vibetracker_identities (
    provider, provider_subject, provider_login, canonical_handle,
    display_name, avatar_url, verified_at, last_seen_at, updated_at
  ) values (
    'github', p_provider_subject, p_provider_login, v_handle,
    p_display_name, p_avatar_url, now(), now(), now()
  )
  on conflict (provider, provider_subject) do update set
    provider_login = excluded.provider_login,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    verified_at = now(),
    last_seen_at = now(),
    updated_at = now()
  returning * into v_identity;

  insert into public.vibetracker_cli_tokens (token_hash, user_id, identity_id)
  values (p_token_hash, v_identity.user_id, v_identity.id);

  update public.vibetracker_cli_auth
  set status = 'claimed', user_id = v_identity.user_id, identity_id = v_identity.id,
      issued_token = null
  where device_code_hash = p_device_code_hash;

  return query select v_identity.id, v_identity.user_id, v_identity.canonical_handle;
end;
$$;

revoke all on function public.vibetracker_verify_github_device(text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.vibetracker_verify_github_device(text, text, text, text, text, text)
  to service_role;

-- Link after both sides are proven: the caller route verifies the WorkOS/Supabase session and
-- GitHub token, then invokes this service-role-only operation. Historical rows keep their stable
-- identity id while also gaining the C0VIBE user id, so ranks and profile URLs do not fork.
create or replace function public.vibetracker_link_github_identity(
  p_user_id uuid,
  p_provider_subject text,
  p_provider_login text,
  p_display_name text default null,
  p_avatar_url text default null
) returns table(identity_id uuid, canonical_handle text, migrated_submissions integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_identity public.vibetracker_identities%rowtype;
  v_handle text;
  v_migrated integer := 0;
  v_identity_exists boolean := false;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invalid account user' using errcode = '22023';
  end if;

  select * into v_identity
  from public.vibetracker_identities
  where provider = 'github' and provider_subject = p_provider_subject
  for update;
  v_identity_exists := found;

  if v_identity_exists and v_identity.user_id is not null and v_identity.user_id <> p_user_id then
    raise exception 'GitHub identity is already linked to another account' using errcode = '23505';
  end if;

  v_handle := lower(p_provider_login);
  if not v_identity_exists and exists (
    select 1 from public.vibetracker_identities i where i.canonical_handle = v_handle
  ) then
    v_handle := left(v_handle, 57) || '-' || right(p_provider_subject, 6);
  end if;

  insert into public.vibetracker_identities (
    provider, provider_subject, provider_login, canonical_handle, display_name, avatar_url,
    user_id, verified_at, linked_at, last_seen_at, updated_at
  ) values (
    'github', p_provider_subject, p_provider_login, v_handle, p_display_name, p_avatar_url,
    p_user_id, now(), now(), now(), now()
  )
  on conflict (provider, provider_subject) do update set
    provider_login = excluded.provider_login,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    user_id = excluded.user_id,
    verified_at = now(),
    linked_at = coalesce(public.vibetracker_identities.linked_at, now()),
    last_seen_at = now(),
    updated_at = now()
  returning * into v_identity;

  update public.vibetracker_cli_tokens t
  set user_id = p_user_id, identity_id = v_identity.id
  where t.identity_id = v_identity.id or (t.user_id = p_user_id and t.identity_id is null);

  update public.vibetracker_submissions s
  set user_id = p_user_id, identity_id = v_identity.id
  where s.identity_id = v_identity.id or (s.user_id = p_user_id and s.identity_id is null);
  get diagnostics v_migrated = row_count;

  insert into public.vibetracker_members (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  return query select v_identity.id, v_identity.canonical_handle, v_migrated;
end;
$$;

revoke all on function public.vibetracker_link_github_identity(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.vibetracker_link_github_identity(uuid, text, text, text, text)
  to service_role;

-- Latest submission per proven identity. GitHub-first and later-linked rows collapse onto the
-- same identity key. A blue check means identity proof only; usage_tier still states whether the
-- aggregate was provider-fetched ('verified') or uploaded by the proven CLI ('attested').
create or replace view public.vibetracker_leaderboard_attested
with (security_invoker = false) as
  select distinct on (coalesce(s.user_id, i.user_id, s.identity_id)::text)
    coalesce(i.canonical_handle, h.handle::text, u.display_name, 'user') as handle,
    coalesce(h.is_premium, false) as is_premium,
    coalesce(h.verified_kind::text, 'none') as verified_kind,
    s.total_usd, s.total_credits, s.record_count, s.created_at,
    s.tier as usage_tier,
    coalesce(i.provider, 'c0vibe') as identity_provider,
    true as identity_verified,
    i.id as identity_id
  from public.vibetracker_submissions s
  left join public.vibetracker_identities i on i.id = s.identity_id
  left join public.users u on u.id = coalesce(s.user_id, i.user_id)
  left join public.user_handles h on h.user_id = coalesce(s.user_id, i.user_id)
  where s.tier in ('attested', 'verified')
    and (s.user_id is not null or (i.id is not null and i.verified_at is not null))
  order by coalesce(s.user_id, i.user_id, s.identity_id)::text, s.created_at desc;

create or replace view public.vibetracker_leaderboard_self_reported
with (security_invoker = false) as
  select distinct on (coalesce(s.user_id::text, s.handle))
    coalesce(s.handle, 'anonymous') as handle,
    s.total_usd, s.total_credits, s.record_count, s.created_at,
    s.tier as usage_tier,
    null::text as identity_provider,
    false as identity_verified,
    null::uuid as identity_id
  from public.vibetracker_submissions s
  where s.tier = 'self_reported'
  order by coalesce(s.user_id::text, s.handle), s.created_at desc;
