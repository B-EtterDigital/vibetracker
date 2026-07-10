# VibeTRACKER Trust & Injection-Defense Model

VibeTRACKER ingests data from many third-party AI APIs and (per PLAN §6–7) will accept
user-uploaded usage for a public leaderboard. **All of that is untrusted input.** This
document is the first-class security design; the defenses are implemented in
`packages/core/src/verify/` and enforced at the sync/ingest boundary.

## First principle: content is DATA, never instructions
No field from an adapter response or an upload is ever executed, `eval`'d, followed as an
instruction, or rendered without sanitization. This is the same posture that contained the
2026-07 subagent incident: **trust disk + gates, not text.** An AI feature that later
summarizes usage must treat field content as inert data, not prompts.

## Untrusted boundaries
1. **Adapter API responses** — a provider (or a MITM, or a compromised account) can return
   hostile `display_name` / `model` / `operation` strings and absurd numbers.
2. **Uploaded payloads** — a user can fabricate, inflate, or booby-trap usage JSON to climb
   a leaderboard or attack whoever/whatever renders it.

Both funnel through `ingestRecords(records, { untrustedSource: true })` before storage or
display. Rejected records are **reported, never silently dropped** (VTRS rule).

## Defenses (implemented + tested — `verify/validate.ts`)
| Threat | Defense |
|---|---|
| Terminal/ANSI injection via a field (hijack the CLI, spoof output) | Strip ESC + all C0/C1 control chars and CSI sequences from every text field |
| Oversized fields (DoS, layout break, storage abuse) | Length caps (provider 64, model 128, etc.) |
| Absurd/negative/non-finite amounts (corrupt cost math) | Reject non-finite, negative, or `> 1e13`; `NaN`/`Infinity`/strings rejected |
| Prototype pollution (`__proto__`/`constructor`/`prototype`) | Reject records carrying those own keys; rebuild from whitelisted fields only |
| Unknown enum values (`category`/`source`/`unit`) | Coerce to safe defaults (`other`/`manual`/`request`) |
| Unknown/extra fields smuggled through | Output is rebuilt from a fixed field set — extras never survive |
| Timestamp abuse | Reject unparseable or out-of-range (year < 2000 or > 2200) |

## Trust tiers (`verify/trust.ts`) — the anti-spoof core for uploads
- **verified** — the *backend* fetched it from the provider (OAuth / read-only key). Only
  the backend may set this. **The CLI/uploader can NEVER self-certify `verified`** —
  `untrustedSource: true` forces it to `false`.
- **attested** — device-signed CLI output over local logs (tamper-evident; requires the
  signature to be meaningful).
- **self_reported** — unverified upload / manual / feed reconstruction. Spoofable.

Ranked leaderboards default to **verified-only** (`RANKABLE`). This is exactly what fixes
viberank's core weakness (unverified CLI submissions).

## Upload path (backend, future work)
Beyond per-record validation: payload size + record-count limits; server-side
re-derivation of totals from the provider where possible; signed submissions +
transparency log; corroboration before a claim is promoted; per-account rate limits and
sybil resistance. See PLAN §7.

## C0VIBE integration — no self-promotion, and what we store
VibeUsage rides on the C0VIBE account system (shared Supabase, WorkOS auth; a VibeUsage
profile *is* a C0VIBE profile with the trial not started). Two hard guarantees:

**No self-promotion without paying.** The leaderboard tables (`vibetracker_*` in the C0VIBE
DB) are **RLS public-read only — there are no client write policies.** The *only* write path
is the `vibetracker-ingest` edge function (service role), which:
- sets `tier` from *verified auth* (`attested` if the session verifies, else
  `self_reported`) — the client's `payload.tier` is ignored; an upload can never be `verified`;
- derives any promotion/badge (`is_premium`, `verified_kind`) from the **payment-controlled
  `user_handles`** row, never from anything a free user can set.
So a free user has no path to inflate their tier, rank, or badge. Ranking is by real spend;
`self_reported` (spoofable, anonymous) is a separate board and never mixed with real accounts.

**Is the data safe? Yes — aggregates only, minimized.** The DB stores **per-provider rollups
+ totals** (provider, ops, credits, usd) and nothing else. It never stores or transmits for
storage: individual usage records, prompts/content, model names, or **API keys** (keys stay
local to the CLI). `handleIngest` returns only aggregates by construction (`ingest.ts`),
uploads carry usage metadata only, RLS scopes reads, and Supabase encrypts at rest. Handles
match `^[a-zA-Z0-9_.-]{1,64}$`; providers `^[a-z0-9_-]{1,40}$`.

## Why this is here
The threat model that hit our *build process* (injected instructions masquerading as
results) is the same class the *product* faces at runtime. Encoding the defense in code +
tests — not just prose — is the point.
