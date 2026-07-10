const frameWidth = 72;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 3))}...` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function renderPrivacyAirlock(): string {
  return [
    "+----------------------------------------------------------------------+",
    frameLine("VTK://PRIVACY-AIRLOCK//WHAT-LEAVES//LOCAL-FIRST"),
    "|----------------------------------------------------------------------|",
    frameLine("Vibers Unite // c0vibe.app // no prompt or output upload"),
    frameLine("LOCAL: records, keys, ledgers, audits, exports, profiles"),
    frameLine("UPLOAD: accepted usage rows + aggregates + integrity hashes"),
    frameLine("TRUST: GitHub/Higgsfield/social context sidecar, NOT USAGE"),
    frameLine("BLOCK: prompts, outputs, API keys, secrets, generated media"),
    frameLine("GATE: dry-run preview -> secret scan -> explicit upload"),
    frameLine("PROOF: ledger seal + bundle sign + private aggregate export"),
    frameLine("LOCAL API: 127.0.0.1 only; browser captures require action"),
    "+----------------------------------------------------------------------+",
  ].join("\n");
}

export function renderPrivacyScreen(): string {
  return [
    renderPrivacyAirlock(),
    "",
    "VIBETRACKER PRIVACY",
    "",
    "Local-only default",
    "  - Usage records live in ~/.vibetracker/records.jsonl, or records.jsonl.enc when VT_STORE_PASSPHRASE is set.",
    "  - Provider keys live in ~/.vibetracker/config.json with mode 600.",
    "  - Sync, stats, audit, profile, roadmap, privacy, and export run locally.",
    "",
    "What leaves your machine",
    "  - Nothing leaves during normal local commands.",
    "  - `vibetracker upload` sends accepted usage records, aggregate metadata, trust signals, and integrity hashes to the configured ingest URL.",
    "  - `vibetracker login` talks to the configured site only to issue an attested CLI token.",
    "  - Provider sync commands call the providers you explicitly connect.",
    "",
    "What does not leave",
    "  - Raw prompt text is not part of the normalized usage schema.",
    "  - Secrets are not included in records, audits, profiles, exports, or upload bundles.",
    "  - GitHub activity is a separate trust signal and is not counted as usage.",
    "",
    "Trust boundary",
    "  - Uploads are self-reported unless a backend fetches data from a provider.",
    "  - Untrusted input is sanitized before storage or rendering.",
    "  - Integrity hashes help prove exactly which local records produced an audit/export.",
    "  - Upload dry-run previews the endpoint, count, trust signals, fingerprint, and secret scan before any network call.",
    "  - Export and upload run the secret scanner and block suspicious payloads by default.",
    "  - `vibetracker ledger seal` stores a local chain hash; `ledger verify` detects later ledger changes.",
    "  - `vibetracker bundle sign` signs a local upload bundle with Ed25519.",
    "  - `vibetracker release sign` signs a built CLI file hash with Ed25519.",
    "  - `vibetracker export --private` emits noisy aggregates and omits raw records.",
    "  - Anonymous telemetry is disabled unless you run `vibetracker telemetry opt-in`; preview shows aggregate-only fields.",
    "  - `vibetracker api serve` binds to 127.0.0.1 and is off unless you start it.",
    "  - Browser extension captures are explicit user actions and land as low-confidence manual records.",
    "",
    "Next privacy roadmap",
    "  - Passkey login.",
    "  - Provider OAuth imports where provider support exists.",
  ].join("\n");
}
