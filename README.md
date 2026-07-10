# VibeTRACKER

Track **all** your AI usage and spend — coding agents, LLM APIs, and generative media
(image / video / music / audio / 3D) — in one CLI. Like `ccusage` + `viberank`, but universal.

## Quick start
```bash
npx vibetrack init --gui    # terminal-style GUI wizard with inline command pane
npx vibetrack demo --compact # offline proof/scan showcase; no provider calls or upload
npx vibetrack demo --html --out ~/vibetracker-showcase.html # static GUI showcase, no server
npx vibetrack badge --out ./vibetracker-badge.svg --markdown # local SVG usage badge
npx vibetrack doctor        # local health cockpit + Higgsfield/Codex surprise preview
npx vibetrack surprises --provider higgsfield,codex-cli,ollama # safe animated scan reel
npx vibetrack surprises --html --out ~/vibetracker-surprise-reel.html # static GUI reel
npx vibetrack cockpit --html --out ~/vibetracker-command-cockpit.html # static command cockpit
npx vibetrack studio --out ~/vibetracker-studio # offline GUI pack, no dev server
npx vibetrack launch-kit --out ~/vibetracker-launch-kit # full offline demo pack
npx vibetrack providers --all
npx vibetrack sync --demo   # try it: your Claude Code logs + sample data
npx vibetrack sync --demo --receipt --out ~/vibetracker-sync-receipt # local black-box receipt
npx vibetrack receipts --html --out ~/vibetracker-receipts.html # local receipt vault index
npx vibetrack audit         # source mix, freshness, coverage gaps, fingerprint, trust signals
npx vibetrack stats --domain ai   # deep breakdown by provider/category/model/day
npx vibetrack insights --budget 200  # trends, forecast, alerts, overlap, expensive workflows
npx vibetrack detect        # Ollama/LM Studio/ComfyUI/llama.cpp/Jan/GPT4All/vLLM local radar
npx vibetrack detect --html --out ~/vibetracker-local-ai-radar.html # static local radar GUI
npx vibetrack adapter scaffold my-provider --dry-run
npx vibetrack providers check  # adapter freshness and contributor next actions
npx vibetrack oauth start huggingface --auth-url https://provider/oauth/authorize --token-url https://provider/oauth/token --client-id app
npx vibetrack export --private --epsilon 1
npx vibetrack export --format parquet --out ~/vibetracker.parquet
npx vibetrack api serve --port 8765  # local API + browser extension capture endpoint
npx vibetrack life        # full AI-life dashboard with usage, trust, integrity, ROI
npx vibetrack roadmap       # 73 selected improvements from the marked product list
npx vibetrack privacy       # exactly what stays local and what upload sends
npx vibetrack ledger seal   # store a local chain hash; later run ledger verify
```
Published to npm as **`vibetrack`**; installs the **`vibetracker`** command.
Bundled to a single CLI file — needs only **Node ≥ 18**; Parquet export loads the packaged
`parquetjs-lite` dependency only when `--format parquet` is used.
Or install it globally: `npm i -g vibetrack`.

## Track real providers
```bash
export VT_REPLICATE_TOKEN=r8_...
vibetracker connect replicate        # or: vibetracker connect replicate --set token=r8_...
vibetracker sync
vibetracker total --by category
```
Credentials are read from `VT_*` env vars or stored in `~/.vibetracker/config.json`
(chmod 600). **Nothing leaves your machine** unless you run `vibetracker upload`.

## Coverage
154 services are mapped across hosted AI APIs, creator tools, coding agents, local runners,
dev infrastructure, and manual subscriptions. Built adapters are clearly separated from
proxy/manual/planned coverage, so the catalog is useful without pretending everything is
fully verified.

Examples: Higgsfield, Claude Code, Replicate, fal.ai, Runway, OpenAI, Anthropic, ElevenLabs,
Luma, Kling, Suno, Udio, OpenRouter, ComfyUI, Ollama, LM Studio, Qwen/DashScope, Doubao,
Kimi/Moonshot, DeepSeek, Mistral, Aleph Alpha, RunPod, Browserbase, Cursor, Antigravity,
Windsurf, Aider, Poe, Midjourney, Adobe Firefly, Krea, Topaz, HeyGen, Synthesia,
Zapier AI, and many more.

## Built with SMARCH

VibeTRACKER is built and maintained with **SMARCH** (SMA Gen3), the open
agent-architecture layer: <https://github.com/B-EtterDigital/SMARCH>. Modules,
ownership, shared hot paths, and gates are declared in `sma.gen3.json`, and the
lane classifier ships with the repo (`scripts/sma-gen3.mjs`), so the whole
process runs offline with plain `pnpm`.

Contributions must be 100% SMA Gen3 compliant — lane classification before
editing, VTRS telemetry (no silent catches), and the full gate run before a PR.
Non-compliant PRs are declined; see `CONTRIBUTING.md` and
`docs/compliance/SMA_GEN3.md`.

## Accepted roadmap
`vibetracker roadmap` contains the 73 non-crossed items from the marked improvement list:
browser/desktop capture, OAuth imports, subscription amortization, multi-account/team
separation, Chinese/EU/Poe/Perplexity/Hugging Face coverage, Ollama/LM Studio/ComfyUI
local tracking, creator trust signals, privacy hardening, C0VIBE-ready mobile profiles,
analytics, adapter SDKs, exports, APIs, and the AI life dashboard. Crossed-out items are
kept out of that accepted list.

New live foundations from that list:
- `vibetracker detect` finds common local AI endpoints and prints the matching proxy/connect command.
- `vibetracker subscription add <provider> --usd N --from YYYY-MM-DD --to YYYY-MM-DD`
  amortizes flat subscriptions into daily low-confidence records.
- `--account`, `--profile`, and `--team` can be attached to manual/subscription records
  and used as filters in totals, stats, audit, export, and insights.
- `vibetracker upload --dry-run` previews exactly what would leave the machine.
- `vibetracker export` and `upload` run secret scans before data leaves or is written out.
- `vibetracker ledger seal` and `ledger verify` make the local JSONL ledger tamper-evident.
- `vibetracker badge --out ./vibetracker-badge.svg --markdown` writes a static,
  self-contained local usage badge for READMEs and profiles. Trust rails remain
  labelled **not usage**.
- `vibetracker bundle sign` writes an Ed25519 signed upload bundle; `bundle verify` checks it.
- `vibetracker release sign` signs the built CLI file hash; `release verify` checks it.
- `vibetracker oauth start <provider> ...` runs a PKCE localhost OAuth flow for providers that expose usage scopes.
- `vibetracker export --private --epsilon N` emits differentially private aggregates without raw records.
- `vibetracker export --format parquet --out usage.parquet` writes a local Parquet file for data lakes.
- Set `VT_STORE_PASSPHRASE` to use the encrypted `records.jsonl.enc` local store.
- `vibetracker telemetry opt-in/out/status/preview` keeps anonymous aggregate telemetry opt-in only.
- `vibetracker api serve` exposes local `/records`, `/stats`, `/insights`, and `/capture` endpoints for tools and the browser extension.
- `vibetracker providers check` reports adapter proof freshness and contributor next actions.
- `vibetracker fixture redact` creates secret-redacted fixtures from provider responses.
- `vibetracker roi add/list` stores productivity/outcome notes separately from usage totals.
- `vibetracker insights` reports trends, 30-day forecast, burn alerts, provider overlap,
  expensive workflows, cheapest observed providers, and local savings.
- `vibetracker adapter scaffold <id>` creates a custom-provider starter adapter with a
  fixture, golden test, and adapter README. See `docs/ADAPTER_SDK.md`.
- The web app includes `/providers`, a public adapter status board for built, proxy,
  manual, and planned coverage.
- `/passkeys` provides a browser WebAuthn account-proof surface; deployed C0VIBE auth
  remains the server-side identity authority.
- `/contributors` exposes public contributor badge paths for adapter, fixture, trust,
  privacy, and local-AI work.
- `packages/browser-extension` is an unpacked extension that captures explicit hosted-AI
  web activity into the local `/capture` endpoint.

## Visual credits
The local GUI wizard includes offline ASCII motion for provider scans and surprise moments
around the **Vibers Unite** motto and `c0vibe.app`.

- [`ascii-globe`](https://github.com/jcubic/ascii-globe) by Jakub T. Jankiewicz, MIT:
  used to render the rotating provider-scan globe locally.
- [`cli-spinners`](https://github.com/sindresorhus/cli-spinners) by Sindre Sorhus, MIT:
  used for terminal-style scan and pulse frames.
- [`drawille`](https://github.com/madbence/node-drawille) by Bence Dányi, MIT:
  used for Unicode braille signal fields during provider scan beats.
- Reference bench, credited in the home ASCII Motion Lab:
  [`Charm VHS`](https://github.com/charmbracelet/vhs) for scripted terminal demo discipline,
  [`Durdraw`](https://github.com/cmang/durdraw) for Linux ANSI/Unicode frame-art workflow,
  [`termdot`](https://github.com/ahmadawais/termdot) for braille dot-canvas inspiration,
  and [`Asciimatics`](https://github.com/peterbrittain/asciimatics) for full-screen
  terminal scene patterns. These are design references, not bundled runtime dependencies.
- Provider scan beats render across four labelled hooks: queue, scan, checkpoint, and
  recap. Higgsfield MCP prism turns, Codex/builder cubes, local-lab sonar, creator run
  meters, and the **Vibers Unite // c0vibe.app** flash all stay visual feedback only.
  Disable them with `VT_NO_SURPRISES=1` or `VT_NO_ANIM=1` for automation.
- `vibetracker doctor` reuses the same terminal-art system as a safe preview: no provider
  calls, no uploads, and no secret reads.
- `vibetracker surprises` opens the same scan reel on purpose. Use `--provider a,b`,
  `--static`, `--json`, or `--html --out surprise-reel.html`; it never reads providers,
  writes records, uploads, or scans secrets. The HTML reel is self-contained and script-free,
  with a GUI scan director that keeps queue, scan, checkpoint, and recap rails visible.
- `vibetracker cockpit --html --out command-cockpit.html` writes a script-free command
  cockpit for first run, doctor, surprise reel, local detection, sync, audit, dry-run,
  and publish. It is a static guide only; commands run only when the user runs them.
- `vibetracker studio --out vibetracker-studio` writes a local offline GUI pack with
  `index.html`, showcase, surprise reel, command cockpit, and manifest. It carries the
  terminal theatre into a browsable folder; it still makes no provider calls, writes no
  records, uploads nothing, and reads no secrets.
- `vibetracker launch-kit --out vibetracker-launch-kit` writes a full offline demo pack:
  studio, demo sync receipt, receipt vault, README, and manifest. It uses labelled demo
  data only; it makes no provider calls, writes no usage records, uploads nothing, and
  reads no secrets. The launch index includes a proof-first operator dossier with every
  safety flag visible before the user runs a real command.
- `vibetracker sync --receipt --out vibetracker-sync-receipt` writes a local black-box
  receipt after real collection. The receipt is honest about provider calls and local
  usage writes, but shows uploads, prompt export, output export, and secret export as no.
  Its static GUI includes a receipt replay flight recorder from provider call to local
  ledger, without prompts, outputs, keys, or media files.
- `vibetracker receipts --html --out vibetracker-receipts.html` turns local receipt JSON
  files into a script-free receipt vault. It reads receipt files only; it makes no provider
  calls, performs no usage writes, uploads nothing, and exports no prompts, outputs, or secrets.

## Trust & privacy
Every provider response and every upload passes an untrusted-data ingest boundary (ANSI/
control-byte strip, numeric bounds, prototype-pollution rejection, whitelist rebuild)
before it is stored — see `docs/compliance/TRUST_MODEL.md`. Uploads are `self_reported` by
construction; only the (upcoming) backend can mark data `verified`.

GitHub contribution stats are collected as a separate trust signal when the authenticated
`gh` CLI is available. They are labelled **not usage**, excluded from spend/credit totals,
and stored separately from provider records.

Poe and other no-public-usage-API tools stay **manual-only**: they are trackable through
`vibetracker add` and `subscription add`, but they are not represented as verified API data.

## Commands
`providers` · `connect <provider> [--set field=value]` · `sync [--demo] [--receipt]` · `receipts [--html]` ·
`doctor` · `surprises` · `cockpit` · `studio` · `launch-kit` · `total [--by provider|category|model|day]` · `audit [--json]` · `insights` ·
`detect` · `providers check` · `adapter scaffold <id>` · `fixture redact` ·
`api serve` · `desktop scan` · `browser-extension path` · `plugins path` ·
`badge [--out badge.svg] [--handle h] [--markdown]` ·
`bundle sign|verify` · `release sign|verify` · `ledger seal|verify` ·
`telemetry opt-in|opt-out|preview` · `roi add|list` · `life` · `roadmap` · `privacy` ·
`oauth start <provider>` · `export [--format json|csv|markdown|parquet] [--out path]` · `gui` ·
`upload [--handle <name>] [--url <endpoint>]`

MIT
