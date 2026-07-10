export type ImprovementGroup =
  | "data"
  | "provider"
  | "local"
  | "creative"
  | "trust"
  | "privacy"
  | "ux"
  | "analytics"
  | "open_source"
  | "product";

export type ImprovementStage = "live" | "accepted" | "planned";

export interface AcceptedImprovement {
  number: number;
  group: ImprovementGroup;
  title: string;
  stage: ImprovementStage;
  note: string;
}

export const GROUP_LABELS: Record<ImprovementGroup, string> = {
  data: "Data coverage",
  provider: "AI provider depth",
  local: "Local AI",
  creative: "Creative AI",
  trust: "Trust signals",
  privacy: "Privacy and security",
  ux: "UX",
  analytics: "Analytics",
  open_source: "Open source",
  product: "Product power",
};

export const EXCLUDED_MARKED_IMPROVEMENT_NUMBERS = [
  5, 6, 7, 17, 19, 24, 25, 26, 27, 28, 29, 30, 31, 32, 36, 37, 38, 39, 40,
  47, 48, 59, 91, 92, 93, 94, 95,
] as const;

export const ACCEPTED_IMPROVEMENTS: readonly AcceptedImprovement[] = [
  { number: 1, group: "data", title: "Browser extension capture", stage: "live", note: "`packages/browser-extension` captures explicit AI web activity into the local `/capture` endpoint." },
  { number: 2, group: "data", title: "Desktop app activity watcher", stage: "live", note: "`vibetracker desktop scan --record` snapshots known AI desktop processes as low-confidence local activity." },
  { number: 3, group: "data", title: "Local network proxy auto-detect", stage: "live", note: "`vibetracker detect` checks common local AI endpoints and prints safe proxy/connect commands." },
  { number: 4, group: "data", title: "Per-provider OAuth where possible", stage: "live", note: "`vibetracker oauth start` runs a PKCE localhost callback and stores provider tokens when a provider exposes OAuth usage scopes." },
  { number: 8, group: "data", title: "Subscription amortization", stage: "live", note: "`vibetracker subscription add` spreads flat subscription cost into daily labelled records." },
  { number: 9, group: "data", title: "Multi-account/provider profiles", stage: "live", note: "Records carry account/profile ids and totals/stats/audits/exports can filter them." },
  { number: 10, group: "data", title: "Team/org usage separation", stage: "live", note: "Records carry team ids and CLI filters keep team usage distinct." },

  { number: 11, group: "provider", title: "More Chinese adapters", stage: "live", note: "Qwen, Doubao, Kimi, z.ai, GLM/Zhipu, and proxy/manual paths are live; endpoints marked ⚠ still need provider proof." },
  { number: 12, group: "provider", title: "More EU adapters", stage: "live", note: "Mistral, Aleph Alpha, LightOn, and manual/proxy paths are live; endpoints marked ⚠ still need provider proof." },
  { number: 13, group: "provider", title: "OpenAI-compatible provider auto-detection", stage: "live", note: "`vibetracker detect --target <base-url>` checks `/v1/models` and prints a proxy recorder command." },
  { number: 14, group: "provider", title: "Hugging Face usage/import", stage: "live", note: "Hugging Face has a built usage adapter plus manual/import fallback; endpoint shape is still labelled ⚠ until provider-verified." },
  { number: 15, group: "provider", title: "Poe usage/import", stage: "live", note: "Poe is tracked through manual credit/subscription ledgers and clearly labelled manual-only until a stable public usage API exists." },
  { number: 16, group: "provider", title: "Perplexity usage/import", stage: "live", note: "Perplexity has a built usage/balance adapter plus manual subscription fallback; endpoint shape is labelled ⚠ until provider-verified." },
  { number: 18, group: "provider", title: "Canva/Midjourney-style manual ledgers", stage: "live", note: "`vibetracker add` and `subscription add` support no-API tools while staying low-confidence/self-reported." },
  { number: 20, group: "provider", title: "Provider capability freshness checks", stage: "live", note: "`vibetracker providers check` flags built adapters needing proof, proxy-ready providers, manual paths, and planned work." },

  { number: 21, group: "local", title: "Ollama live usage monitor", stage: "live", note: "`vibetracker detect` and `vibetracker proxy --provider ollama` capture local calls as local usage." },
  { number: 22, group: "local", title: "LM Studio proxy recorder", stage: "live", note: "`vibetracker detect` and `vibetracker proxy --provider lmstudio` capture local OpenAI-compatible calls." },
  { number: 23, group: "local", title: "ComfyUI workflow cost model", stage: "live", note: "ComfyUI history is mapped; richer workflow cost modelling remains planned." },

  { number: 33, group: "creative", title: "Music/audio generation tracker", stage: "live", note: "Suno, Udio, ElevenLabs, and audio providers share the same normalized ledger." },
  { number: 34, group: "creative", title: "Voice clone usage tracking", stage: "live", note: "`vibetracker add` accepts `--minutes`, `--characters`, and `--operation voice_clone` for audio/voice ledgers." },
  { number: 35, group: "creative", title: "3D asset generation tracking", stage: "live", note: "3D is a first-class category in the registry, filters, manual ledgers, and Higgsfield records." },

  { number: 41, group: "trust", title: "GitHub heatgrid polish", stage: "live", note: "Official GitHub colors are rendered as a not-usage trust signal." },
  { number: 42, group: "trust", title: "Separate creator trust signals", stage: "live", note: "`vibetracker trust add` stores creator/public activity as separate not-usage evidence." },
  { number: 43, group: "trust", title: "YouTube posting cadence signal", stage: "live", note: "`vibetracker trust add youtube --metric uploads --count N` attaches YouTube cadence evidence." },
  { number: 44, group: "trust", title: "X/LinkedIn publishing cadence", stage: "live", note: "`vibetracker trust add x|linkedin` attaches publishing cadence evidence." },
  { number: 45, group: "trust", title: "Hugging Face contribution signal", stage: "live", note: "`vibetracker trust add huggingface` attaches model/dataset/space activity evidence." },
  { number: 46, group: "trust", title: "npm/PyPI package signal", stage: "live", note: "`vibetracker trust add npm|pypi` attaches package publishing evidence." },
  { number: 49, group: "trust", title: "Verifiable signed bundles", stage: "live", note: "`vibetracker bundle sign` writes an Ed25519 signed upload bundle; `bundle verify` checks it." },
  { number: 50, group: "trust", title: "Public not-usage labels everywhere", stage: "live", note: "Trust signals stay visibly separate from spend, credits, and provider data." },

  { number: 51, group: "privacy", title: "Local-only mode badge", stage: "live", note: "`vibetracker privacy`, GUI copy, and upload preview state the local-only default." },
  { number: 52, group: "privacy", title: "Redaction preview before upload", stage: "live", note: "`vibetracker upload --dry-run` previews endpoint, record count, trust signals, fingerprint, and secret scan." },
  { number: 53, group: "privacy", title: "Secret scanner before bundle export", stage: "live", note: "Export and upload run a secret scanner and block suspicious payloads by default." },
  { number: 54, group: "privacy", title: "Differential privacy option", stage: "live", note: "`vibetracker export --private --epsilon N` emits noisy aggregates without raw records." },
  { number: 55, group: "privacy", title: "Encrypted local store", stage: "live", note: "Set `VT_STORE_PASSPHRASE` to use `~/.vibetracker/records.jsonl.enc` with AES-256-GCM encryption." },
  { number: 56, group: "privacy", title: "Passkey login", stage: "live", note: "`/passkeys` uses browser WebAuthn for local account proof; deployed C0VIBE auth remains the server-side identity authority." },
  { number: 57, group: "privacy", title: "Signed CLI releases", stage: "live", note: "`vibetracker release sign` signs the built CLI file hash; `release verify` checks file and signature." },
  { number: 58, group: "privacy", title: "Tamper-evident local ledger", stage: "live", note: "`vibetracker ledger seal` stores the current chain hash and `ledger verify` detects later local changes." },
  { number: 60, group: "privacy", title: "What leaves my machine screen", stage: "live", note: "The privacy command documents local data, uploads, secrets, and trust boundaries." },

  { number: 61, group: "ux", title: "Better first-run GUI wizard", stage: "live", note: "The local GUI wizard keeps the terminal aesthetic and guided connection flow." },
  { number: 62, group: "ux", title: "Inline terminal inside GUI", stage: "live", note: "The GUI includes an inline terminal pane with concrete commands." },
  { number: 63, group: "ux", title: "Animated provider connection cards", stage: "live", note: "Provider cards have animated, branded connection states." },
  { number: 64, group: "ux", title: "Provider brand color system", stage: "live", note: "CLI/web provider pills use provider-specific color variables." },
  { number: 65, group: "ux", title: "Beautiful empty states", stage: "live", note: "`profile`, `stats`, and `total` show command-rich first-run guidance instead of dead ends." },
  { number: 66, group: "ux", title: "Real-time sync progress", stage: "live", note: "Provider syncs use per-provider spinners and result lines." },
  { number: 67, group: "ux", title: "Per-provider error recovery", stage: "live", note: "Sync/connect failures print provider-specific recovery commands when auth, network, window, or rate-limit issues are detected." },
  { number: 68, group: "ux", title: "Fix this connection buttons", stage: "live", note: "GUI provider cards include copyable connect/sync/proxy/manual commands for actionable recovery." },
  { number: 69, group: "ux", title: "Guided manual entry", stage: "live", note: "Manual add flows exist and stay labelled low-confidence/self-reported." },
  { number: 70, group: "ux", title: "C0VIBE-ready mobile profile page", stage: "live", note: "Generated profile/life dashboards are full viewport-aware HTML and web pages build responsively." },

  { number: 71, group: "analytics", title: "Daily/weekly/monthly trends", stage: "live", note: "`vibetracker insights` computes daily, weekly, and monthly spend trends." },
  { number: 72, group: "analytics", title: "Cost forecast", stage: "live", note: "`vibetracker insights` projects 30-day spend from trailing usage." },
  { number: 73, group: "analytics", title: "Burn-rate alerts", stage: "live", note: "`vibetracker insights --budget N` warns when projected spend exceeds budget." },
  { number: 74, group: "analytics", title: "Token/category mix", stage: "live", note: "Breakdowns by category, model, day, source, and provider already exist." },
  { number: 75, group: "analytics", title: "Model leaderboard", stage: "live", note: "`vibetracker stats` and profile surfaces rank top models." },
  { number: 76, group: "analytics", title: "Provider overlap detection", stage: "live", note: "`vibetracker insights` lists categories served by multiple providers." },
  { number: 77, group: "analytics", title: "Most expensive workflows", stage: "live", note: "`vibetracker insights` ranks provider/category/operation workflows by spend." },
  { number: 78, group: "analytics", title: "Cheapest equivalent provider", stage: "live", note: "`vibetracker insights` reports cheapest observed provider per category from local evidence." },
  { number: 79, group: "analytics", title: "Local savings dashboard", stage: "live", note: "`vibetracker stats` and `vibetracker insights` show local source savings." },
  { number: 80, group: "analytics", title: "AI productivity ROI notes", stage: "live", note: "`vibetracker roi add/list` stores outcome notes separately from usage records." },

  { number: 81, group: "open_source", title: "Adapter SDK", stage: "live", note: "`vibetracker adapter scaffold` and `docs/ADAPTER_SDK.md` define the custom-provider path." },
  { number: 82, group: "open_source", title: "Provider adapter templates", stage: "live", note: "The scaffold creates client, normalizer, adapter factory, fixture, test, and README files." },
  { number: 83, group: "open_source", title: "Fixture generator", stage: "live", note: "`vibetracker fixture redact` turns raw provider JSON into secret-redacted fixtures." },
  { number: 84, group: "open_source", title: "Golden test harness", stage: "live", note: "Scaffolded adapters include deterministic normalizer tests, and release gates run unit tests." },
  { number: 85, group: "open_source", title: "Public adapter status board", stage: "live", note: "`/providers` exposes built/proxy/manual/planned coverage from the provider registry." },
  { number: 86, group: "open_source", title: "Good-first-adapter issues", stage: "live", note: "`docs/GOOD_FIRST_ADAPTERS.md` turns planned providers into scoped contributor tasks." },
  { number: 87, group: "open_source", title: "Plugin marketplace path", stage: "live", note: "`packages/plugins` contains the plugin manifest schema and `vibetracker plugins path` exposes it." },
  { number: 88, group: "open_source", title: "Docs for custom providers", stage: "live", note: "`docs/ADAPTER_SDK.md` documents custom/private provider adapters and graduation rules." },
  { number: 89, group: "open_source", title: "Anonymous telemetry opt-in", stage: "live", note: "`vibetracker telemetry opt-in/out/status/preview` keeps aggregate telemetry disabled by default." },
  { number: 90, group: "open_source", title: "Contributor profile badges", stage: "live", note: "`/contributors` publishes badge paths for adapter, fixture, trust, privacy, and local-AI contributors." },

  { number: 96, group: "product", title: "Obsidian/Notion export", stage: "live", note: "Markdown export is usable in Obsidian and Notion imports." },
  { number: 97, group: "product", title: "JSON/CSV/Parquet export", stage: "live", note: "`vibetracker export --format json|csv|markdown|parquet` writes local export files; Parquet requires `--out`." },
  { number: 98, group: "product", title: "API for other tools", stage: "live", note: "`vibetracker api serve` exposes local `/records`, `/stats`, `/insights`, and `/capture` endpoints." },
  { number: 99, group: "product", title: "Public leaderboard with trust tiers", stage: "live", note: "Verified and self-reported surfaces are separated on the leaderboard." },
  { number: 100, group: "product", title: "AI life dashboard", stage: "live", note: "`vibetracker life` generates the all-aspects local dashboard with usage, trust, integrity, and ROI notes." },
] as const;

export function roadmapGroups(): Array<{ group: ImprovementGroup; label: string; items: AcceptedImprovement[] }> {
  return (Object.keys(GROUP_LABELS) as ImprovementGroup[]).map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: ACCEPTED_IMPROVEMENTS.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length > 0);
}

export function roadmapSummary() {
  return {
    total: ACCEPTED_IMPROVEMENTS.length,
    live: ACCEPTED_IMPROVEMENTS.filter((item) => item.stage === "live").length,
    accepted: ACCEPTED_IMPROVEMENTS.filter((item) => item.stage === "accepted").length,
    planned: ACCEPTED_IMPROVEMENTS.filter((item) => item.stage === "planned").length,
    groups: roadmapGroups().length,
  };
}

export function roadmapHighlights(limit = 8): AcceptedImprovement[] {
  const priority = new Set([1, 4, 13, 21, 41, 52, 61, 70, 72, 81, 96, 100]);
  return ACCEPTED_IMPROVEMENTS.filter((item) => priority.has(item.number)).slice(0, limit);
}
