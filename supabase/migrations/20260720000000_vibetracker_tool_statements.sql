-- Short profile-owner statements about the tools they use. Statements are identity-scoped,
-- independent from submission history, and writable only by the service-role ingest path.

create table public.vibetracker_identity_tool_statements (
  identity_id  uuid not null references public.vibetracker_identities(id) on delete cascade,
  tool_id      text not null check (char_length(tool_id) between 1 and 64),
  statement    text not null check (char_length(statement) between 1 and 280),
  updated_at   timestamptz not null default now(),
  primary key (identity_id, tool_id)
);

alter table public.vibetracker_identity_tool_statements enable row level security;

create policy "vt read identity tool statements"
  on public.vibetracker_identity_tool_statements
  for select
  to anon, authenticated
  using (true);

grant select on public.vibetracker_identity_tool_statements to anon, authenticated;

comment on table public.vibetracker_identity_tool_statements is
  'Identity-owned public tool statements; writes are restricted to the service-role ingest path.';
