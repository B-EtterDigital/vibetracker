# @vibetracker/core

The shared contract every module depends on — the **`shared-contract-surface`** hot path
(serialized, one owner). Changes here ripple everywhere.

- `src/schema/record.ts` — `NormalizedRecord`, the one row every adapter emits.
- `src/adapter.ts` — the `Adapter` interface (`getUsage`, `getBalance`, auth, capabilities).
- `src/telemetry/` — **VTRS** telemetry facade (no silent failure; enforced by audit).
- `src/pricing/` — credit/token → USD tables (versioned; USD is always an estimate).
- `src/verify/` — submission verification / anti-spoofing primitives (security-critical).

Native units are truth; `usdEst` is derived and labelled. See `PLAN.md` §2–3.
