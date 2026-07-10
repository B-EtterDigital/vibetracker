# SMA Gen3 Compliance — VibeTRACKER

This project is built and maintained with **SMARCH** (SMA Gen3), the open
agent-architecture layer: <https://github.com/B-EtterDigital/SMARCH>. This doc
records how the standard is specialised here. `sma.gen3.json` is the
machine-readable source of truth, and the classifier is vendored in this repo,
so the full process runs with plain `pnpm` — no private tooling required.

**Compliance is mandatory and strict.** Contributions produced outside the
SMA Gen3 process are declined, regardless of quality.

## Control-plane files
| File | Role |
| --- | --- |
| `sma.gen3.json` | Module ownership, shared hot paths, concurrency tiers, cost policy, CI tiers |
| `scripts/sma-gen3.mjs` | Lane classifier CLI (`--changed-file`, `--json`, `check`) |
| `scripts/lib/sma-gen3.mjs` | Zero-dep classifier + validator library |
| `scripts/telemetry-audit.mjs` | VTRS audit — bans silent catches / `vtrs-ignore` |
| `scripts/typecheck.mjs` | Lenient per-package typecheck gate |
| `scripts/release-gate.mjs` | Composed release-train gate |
| `scripts/__tests__/sma-gen3.test.mjs` | Control-plane unit tests |
| `AGENTS.md` / `CLAUDE.md` | Agent rule anchors |

## Package scripts
`sma:gen3`, `sma:gen3:json`, `sma:gen3:check`, `sma:release-gate`, `telemetry:audit`,
`telemetry:audit:strict`, `typecheck`, `test:scripts`.

## Modules
- **cli** (`packages/cli/**`) — command surface, config, keychain, local SQLite store, output.
- **adapters** (`packages/adapters/**`) — per-provider adapters, partitioned per provider
  (`higgsfield`, `claude-code`, `openai`, `replicate`, `elevenlabs`, `falai`, `suno`, `udio`, …).
- **web** (`packages/web/**`) — Viberank-derived leaderboard/profile site (excludes auth/submit).
- **backend** (`supabase/**`, `packages/backend/**`) — migrations & edge functions.

## Shared hot paths (serialized, one owner)
- `shared-contract-surface` — `packages/core/**` (normalized record schema, adapter
  interface, local store). Everything depends on it → **high** risk.
- `telemetry-surface` — VTRS telemetry + audit script.
- `pricing-surface` — credit/token→USD tables (`packages/core/src/pricing/**`, `data/pricing/**`).
- `auth-and-verification-surface` — upload signing, OAuth, submission verification, RLS
  (**high** — the anti-spoofing core).
- `dependency-and-package-surface`, `ci-workflow-surface`, `sma-control-plane`.

## Telemetry (VTRS)
Every real error is captured with `{ area, severity, diagnostics }`; expected control-flow
is breadcrumbed. Silent catches and `vtrs-ignore` are banned and enforced by
`pnpm telemetry:audit:strict`.

## Lane workflow
1. `git status --short --branch`
2. `pnpm sma:gen3 -- --changed-file <path>` or `pnpm sma:gen3:json`
3. Follow the lane; run its gates; for shared/release surfaces run `pnpm sma:release-gate`.

## Graphify
Project id `000-vibetracker`. Module graphs are mandatory for module agents before broad
manual reads (per `$sma-gen3`). Maintainers refresh graphs via their local SMARCH layer.

## Portfolio registration (maintainers)
This repo is scanned by the maintainers' SMARCH portfolio layer. After
boundary/manifest/agent-rule changes, refresh with the lease-wrapped
`scan:safe` / `state:safe` / `gen3:dashboard` runs from that layer; see the
SMARCH repository for setup.
