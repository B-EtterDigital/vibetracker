# Contributing to VibeTRACKER

VibeTRACKER is a local-first AI usage tracker for coders, creators, researchers, and teams. Contributions should make the tracker more truthful, more useful, or more delightful without blurring proof boundaries.

Motto: **Vibers Unite.**

## SMA Gen3 compliance is mandatory (strict)

This repo is built with **SMARCH** (SMA Gen3):
<https://github.com/B-EtterDigital/SMARCH>. Every contribution — human or
agent — must follow the SMA Gen3 process, with no exceptions. PRs produced
outside it are **declined regardless of quality**.

The tooling is vendored, so this costs you one command before and a few after:

```bash
pnpm sma:gen3 -- --changed-file <path>   # classify the lane BEFORE editing
# ...make your change within the lane rules...
pnpm sma:gen3:check && pnpm typecheck && pnpm telemetry:audit:strict && pnpm test:scripts
pnpm sma:release-gate                    # if you touched shared hot paths
```

Full specialisation in `docs/compliance/SMA_GEN3.md` and `AGENTS.md`.

## Contribution Lanes

Pick the smallest lane that matches your change:

| Lane | Good Changes | Required Proof |
| --- | --- | --- |
| Provider adapter | New AI, local, creator, coding-agent, infra, or manual-source coverage | Redacted fixture, normalizer test, confidence label, no secret capture |
| CLI experience | Better terminal feedback, receipts, wizard, launch kit, diagnostics | Node tests for output, non-interactive safety, no hidden writes |
| Web experience | Better scanner/profile/provider/score/public proof UI | Route/source tests plus responsive CSS hooks |
| Trust/privacy | Stronger validation, redaction, receipts, local-only flow | Tests proving no raw prompts, outputs, secrets, or fake totals leak |
| Docs/open source | Adapter docs, first-run docs, good-first issues | Accurate commands and clear current limitations |

## Non-Negotiables

- Do not count trust signals as usage.
- Do not invent spend, credits, operations, rank, provider totals, or verified status.
- Do not upload prompts, outputs, files, secrets, tokens, or raw local ledger lines.
- Do not label a provider as built unless there is code, fixture coverage, and a visible confidence boundary.
- Do not hide side effects. Collection, sync, publish, export, and upload paths must say what they write or send.
- Keep demo data labelled as demo data everywhere it appears.

## Adapter Checklist

Before opening an adapter PR:

1. Add or update the provider in `packages/adapters/src/registry.ts`.
2. Add an adapter implementation or a clearly labelled planned/manual/source entry.
3. Add at least one redacted fixture.
4. Add deterministic parser/normalizer tests.
5. Map every record to the shared schema in `packages/core/src/schema/record.ts`.
6. Include confidence and source labels when exact usage is not provable.
7. Add provider branding in both:
   - `packages/web/src/lib/provider-brand.ts`
   - `packages/cli/src/provider-brand.ts`
8. Verify the provider appears correctly in provider/source/scanner surfaces.

Useful docs:

- `docs/ADAPTER_SDK.md`
- `docs/GOOD_FIRST_ADAPTERS.md`
- `docs/compliance/TRUST_MODEL.md`

## UX And Design Standard

The product should feel like a serious operator console, not a novelty dashboard.

- Keep terminal charm visible in the GUI.
- Prefer provider-branded surfaces over generic cards.
- Label trust, local-only, manual, publish, privacy, and usage rails separately.
- Make errors helpful: include the failed provider, likely cause, and fix path.
- Motion should communicate scanning, replay, proof, or status. No confetti-style reward effects.
- If you add an ASCII/Unicode motion reference, credit the project and license when relevant.

## Local Commands

Run focused tests for the files you touched, then run the shared gates:

```bash
pnpm typecheck
pnpm telemetry:audit:strict
pnpm sma:release-gate
pnpm --dir packages/web build
```

For adapter work, also run the relevant adapter/core tests:

```bash
node --test packages/adapters/src/**/__tests__/*.test.ts
node --test packages/core/src/**/__tests__/*.test.ts
```

For CLI experience work, run nearby CLI tests:

```bash
node --test packages/cli/src/__tests__/<feature>.test.ts
```

For web experience work, run nearby web tests:

```bash
node --test packages/web/src/lib/__tests__/<feature>.test.ts
```

## SMA GEN3

Classify changed files before broad verification:

```bash
pnpm sma:gen3 -- --changed-file path/to/file.ts
```

Respect the reported owner/lane. Keep changes scoped unless the feature truly crosses module boundaries.

## Security And Privacy

Report sensitive issues privately. See `SECURITY.md`.

When adding collection logic:

- Prefer local logs, local proxy capture, API usage endpoints, or explicit manual imports.
- Redact account IDs, tokens, paths, prompts, outputs, and secrets in fixtures.
- Keep OAuth/API-key instructions honest about required scopes.
- Make dry-run and preview paths available before upload or publish.

## Pull Request Shape

A strong PR includes:

- What changed and why.
- Which provider/source/surface it affects.
- What data leaves the machine, if any.
- Tests and gates run.
- Screenshots or HTML artifacts for UI/terminal presentation changes when useful.
- Known limitations, especially when usage is approximate, manual, planned, or confidence-limited.

## Good First Areas

- Add a redacted fixture for a planned provider.
- Improve an adapter error message with a concrete fix path.
- Add provider branding for a newly added registry entry.
- Strengthen an empty state so it never implies fake usage.
- Improve docs for local tools such as Ollama, LM Studio, ComfyUI, vLLM, or llama.cpp.
- Add attribution for a terminal/ASCII motion inspiration used by the scanner or launch kit.

Vibers Unite. Build proof people can inspect.
