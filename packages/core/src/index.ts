// Public surface of @vibetracker/core — the shared contract every module depends on.
// This is a shared hot path (see sma.gen3.json → shared-contract-surface).
export * from "./schema/record.js";
export * from "./adapter.js";
export * from "./telemetry/index.js";
export * from "./verify/trust.js";
export * from "./verify/validate.js";
export * from "./capabilities/roadmap.js";
export * from "./analytics/insights.js";
export * from "./security/secrets.js";
export * from "./subscriptions/amortize.js";
export * from "./privacy/differential.js";
