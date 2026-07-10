# VibeTRACKER Adapter SDK

Adapters turn provider-specific usage, billing, logs, feeds, or local history into
`NormalizedRecord` rows. They must be small, deterministic, and honest about confidence.

## Create a Starter Adapter

```bash
vibetracker adapter scaffold <provider-id>
```

Use `--dry-run` to inspect the files first, `--dir <repo>` to target another checkout, and
`--force` only when intentionally replacing an existing scaffold.

The scaffold creates:

| File | Purpose |
| --- | --- |
| `client.ts` | Provider client interface plus fixture client |
| `normalize.ts` | Pure response-to-record conversion |
| `index.ts` | Adapter factory implementing the core adapter contract |
| `__fixtures__/usage.sample.json` | Redacted starter fixture |
| `__tests__/normalize.test.ts` | Golden normalizer test |
| `README.md` | Adapter-specific checklist |

## Adapter Contract

An adapter returns `NormalizedRecord[]` from `getUsage(range, ctx)`.

Required rules:

- Never return prompts, private content, API keys, cookies, or raw provider secrets.
- Reject or skip free, failed, duplicate, and negative rows unless the provider explicitly
  bills them.
- Set `verified: false` in CLI adapters. Only server-side provider re-fetch can promote
  usage to verified.
- Set `source` honestly: `ledger`, `balance_delta`, `feed`, `local`, `proxy`, or `manual`.
- Use `confidence: "high"` only when the provider returns authoritative billing usage.
- Capture real provider failures through the telemetry facade; do not silently swallow them.

## Fixture And Golden Tests

Every adapter needs at least one redacted fixture and a deterministic normalizer test.

Generate a safe fixture from a raw provider response:

```bash
vibetracker fixture redact raw-provider-response.json \
  --out packages/adapters/src/<provider-id>/__fixtures__/usage.sample.json
```

```bash
node --test packages/adapters/src/<provider-id>/__tests__/normalize.test.ts
pnpm telemetry:audit:strict
pnpm typecheck
```

Good golden tests prove:

- Date parsing is stable.
- Spend/credits/tokens are converted consistently.
- Zero-cost/free/failed rows do not inflate totals.
- Unknown models/categories degrade to safe defaults.
- Secrets and user content are not preserved in records.

## Registry Graduation

Do not mark an adapter `built` in `packages/adapters/src/registry.ts` until these are true:

- Endpoint and auth scope are confirmed from the provider docs or a real account.
- Fixtures are redacted and representative.
- Normalizer tests pass.
- Error paths report useful telemetry.
- README notes exactly what is verified and what is still approximate.

If the provider has no stable API, keep it as `manual`, `proxy`, or `planned` and document
the evidence path instead of pretending it is live.
