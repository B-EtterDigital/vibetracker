# VibeTRACKER — Agent Operating Rules

VibeTRACKER is a universal AI-usage tracker: an `npx` CLI + per-provider adapters that
normalise usage/credits/spend across LLM, coding, image, video, music, audio and 3D
platforms, plus a Viberank-derived leaderboard site for opt-in upload.

## Built with SMARCH

This repository is built and maintained with **SMARCH** (SMA Gen3), the open
agent-architecture layer: <https://github.com/B-EtterDigital/SMARCH>. The Gen3
classifier is vendored in this repo (`scripts/sma-gen3.mjs` + `sma.gen3.json`),
so every contributor can run the full lane process with plain `pnpm` — no
private tooling required.

**Compliance is not optional.** Contributions produced outside the SMA Gen3
process described below are declined, regardless of quality. 100% strict.

## SMA Gen3 is the operating standard (CRITICAL)

- Use `$sma-gen3` as the single SMA + Gen3 operating skill. It is standalone.
- `sma.gen3.json` is the source of truth for module ownership, shared hot paths,
  Practical-Max concurrency tiers, and cost policy.
- **Required first moves, every task:**
  1. `git status --short --branch` — treat existing changes as user/peer work; never
     `git stash`, `git reset --hard`, `git checkout -- <file>`, or bulk-restore.
  2. Identify the files/module you intend to own.
  3. Prefer the module Graphify graph before broad manual reads.
  4. Classify the lane: `pnpm sma:gen3 -- --changed-file <path>` (single file) or
     `pnpm sma:gen3:json` (current changeset).
  5. Follow the lane output before editing.

## Lanes

| Lane | Meaning | Rule |
| --- | --- | --- |
| `single-module` | Inside one owned module | Fast lane; parallel only when paths don't overlap |
| `multi-module` | Several modules touched | Split by module; run affected gates before done |
| `shared-hot-path` | core contract, telemetry, pricing, auth/verification, package, CI, SMA control plane | **One active owner**; merge-queue / release-train thinking |
| `unmapped` | No owner | Single-agent until mapped; then update `sma.gen3.json` |

**Never** dispatch parallel agents into the same shared hot path. Adapters are
partitioned per provider (`packages/adapters/src/<provider>/**`) so different
providers can be built in parallel — but never two agents in one provider dir.

## Modules & ownership (see sma.gen3.json for exact globs)

- `cli` — `packages/cli/**` — command surface, config, keychain, local store, output.
- `adapters` — `packages/adapters/**` — per-provider adapters (partitioned).
- `web` — `packages/web/**` — Viberank-derived leaderboard/profile site (excludes auth/submit).
- `backend` — `supabase/**`, `packages/backend/**` — migrations & edge functions.

Shared hot paths: `packages/core/**` (schema/store/adapter contract), telemetry,
pricing tables, auth-and-verification (upload signing / OAuth / RLS), package surface,
CI workflows, and the SMA control plane.

## Telemetry — VTRS (no silent failure, CRITICAL)

100% agent-maintainable requires actionable telemetry.
- Every real error is captured with context (area, severity, diagnostics) via the VTRS
  telemetry facade in `packages/core/src/telemetry/`.
- **No empty `catch {}`, no `.catch(() => {})`, and `vtrs-ignore` is banned.**
- Run `pnpm telemetry:audit:strict` for touched code — it must report zero violations.

## Gates before claiming done

1. Re-run `git status --short --branch`.
2. `pnpm sma:gen3:check` (config valid).
3. Lane gates: `pnpm typecheck`, `pnpm telemetry:audit:strict`, `pnpm test:scripts`.
4. Shared-hot-path / release surfaces: `pnpm sma:release-gate`.
5. Attach real runtime proof for product behaviour, or state the blocker.
6. End clean, pushed (only if asked), or with a classified dirty-tree handoff.

## Cost policy

Free-local-first. Paid acceleration (Blacksmith, Depot, Nx Cloud, Vercel remote cache)
is **manual-only** — never enable without an explicit user request.

## Portfolio (maintainers)

After changing module boundaries / manifests / build-release / agent rules,
maintainers refresh their local SMARCH portfolio layer with the lease-wrapped
`scan:safe` / `state:safe` / `gen3:dashboard` runs. Do not report portfolio
numbers from stale scans. Graphify project id: `000-vibetracker`.

## Foundation note — Viberank

The `web` + `backend` modules build on the existing Viberank codebase
(Next.js 16 + Supabase + NextAuth + GitHub OAuth, a `packages/viberank-cli`,
a `packages/viberank-mcp-server`, and a `002_multi_tool.sql` migration);
maintainers hold the reference checkout. Reuse it; do not rebuild the
leaderboard from scratch. The hard new problem is **verified, multi-platform**
ingestion.

## Web deploys — guarded protocol only (CRITICAL, incident 2026-07-15)

A second agent session once deployed a stale checkout over fresh production work (five untitled
`netlify deploy` runs, no branch/commit metadata) and silently reverted the live profile. Standing
rules for EVERY agent, local or remote:

- **Deploy ONLY via `pnpm deploy:web -- "<message>"`** (`scripts/deploy-web.mjs`). Raw
  `netlify deploy` against the vibeusage site (`4c8f274c-…`) is FORBIDDEN.
- The guard: refuses while another deploy runs, takes an atomic lock, stamps the build
  (`public/deploy-stamp.json`), always builds fresh, and after deploy VERIFIES production serves
  this exact stamp — a stale overwrite fails loudly instead of pretending success.
- **Canonical tree: `~/DEV/Projects/000_VibeTRACKER`.** Never deploy the web app from a copy,
  scratchpad, or worktree; sync your changes into the canonical tree first.
- Before deploying, check `curl -s https://vibeusage.c0vibe.app/deploy-stamp.json` — if the live
  stamp is one you don't recognise, someone shipped after you; re-read their changes before you
  overwrite them.

### Production is LOCKED (2026-07-15, after a second overwrite)
The overwriting deploys were traced to an ephemeral repo snapshot (`/tmp/vibeusage-account-custody/`,
self-deleting after each run) that redeployed an hours-old tree. Production is now **pinned with a
Netlify deploy lock**: stale deploys still build but can never publish. `pnpm deploy:web` handles the
cycle automatically (unlock → deploy → verify stamp → re-lock). NEVER `netlify api unlockDeploy`
manually and walk away — an unlocked site is an unprotected site. If your tree is a copy/snapshot,
your profile-UI files are probably stale: sync from the canonical tree before shipping anything.

### Deploy guard v2 — SMARCH engine adopted (2026-07-15, supersedes the paragraphs above)
The repo is now git (`feat/c0vibe-integration`) and the deploy path is the vendored SMARCH deploy
guard: **`pnpm deploy:web -- "why"`** → `tools/sma-deploy-guard.mjs` + `sma.deploy.json` (spec:
`~/DEV/SMARCH/docs/SMA_DEPLOY_GUARD.md`). It mechanically REFUSES: non-canonical trees (snapshots
can never pass — the config names the absolute canonical path), dirty trees, unpushed HEADs, and
non-fast-forward deploys (production serving work your tree lacks → integrate first). Stamps
record the exact commit. The Netlify platform lock is retired — the fast-forward rule supersedes
it. `scripts/deploy-web.mjs` is BREAK-GLASS for the cron watchdog only (auto-restore on stale
production; works on dirty trees, still refuses snapshot trees). Raw `netlify deploy` remains
forbidden.
