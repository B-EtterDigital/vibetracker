# CLAUDE.md — VibeTRACKER

Claude-facing mirror of `AGENTS.md`. Same rules apply; that file is authoritative.

## What this project is
Universal AI-usage tracker: `npx vibetracker` CLI + per-provider adapters that normalise
usage/credits/spend across LLM, coding, image, video, music, audio, 3D — plus a
Viberank-derived leaderboard site for opt-in upload. Built and maintained with
SMARCH (SMA Gen3): https://github.com/B-EtterDigital/SMARCH — non-compliant
contributions are declined (see AGENTS.md and CONTRIBUTING.md).

## SMA Gen3 (CRITICAL — do not bypass)
- Invoke `$sma-gen3` for coordination. `sma.gen3.json` is the source of truth.
- Start every task with `git status --short --branch`. Never `git stash` / `reset --hard`
  / `checkout -- <file>` / bulk-restore; preserve dirty work as user/peer changes.
- Classify before editing: `pnpm sma:gen3 -- --changed-file <path>` or `pnpm sma:gen3:json`.
- `single-module` = fast lane; `multi-module` = affected gates; `shared-hot-path` =
  one owner, serialized. Adapters are partitioned per provider.

## Telemetry — VTRS (CRITICAL)
Every catch reports to VTRS (`packages/core/src/telemetry/`) with area + severity. No
empty `catch {}`, no `.catch(() => {})`, no `vtrs-ignore`. Run `pnpm telemetry:audit:strict`.

## Before saying done
`git status` → `pnpm sma:gen3:check` → `pnpm typecheck` → `pnpm telemetry:audit:strict`
→ `pnpm test:scripts` → `pnpm sma:release-gate` for shared/release surfaces → real
runtime proof or a stated blocker → clean or classified dirty-tree handoff.

## Deploy / migrate
Backend is Supabase (Viberank-derived). Per global rules, run `supabase db push` for
migrations and `supabase functions deploy` for edge functions as part of the task — do
not leave deploy/migrate for the user. Enable RLS on all tables; never commit secrets.

## Cost policy
Free-local-first. Paid runners/caches are manual-only; never enable without an explicit ask.

## Status reporting
Report progress as checkbox lists — ✅ done, ⬜ open, 🔄 in flight — one line per item.

## Foundation
The site/backend build on the existing Viberank codebase (Next.js 16 + Supabase +
NextAuth + GitHub OAuth, existing CLI + MCP-server packages, multi-tool migration);
maintainers hold the reference checkout. Reuse; don't rebuild. The new hard problem
is verified multi-platform ingest.
