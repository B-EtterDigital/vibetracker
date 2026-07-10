# Security & Trust — `vibetrack` (VibeTRACKER CLI)

VibeTRACKER handles your AI provider keys and usage, so it's built to be auditable and
minimal. Everything below is verifiable from the published package itself.

## Why you can trust the published package
- **Zero runtime dependencies.** The published package is a **single bundled file**
  (`dist/vibetracker.js`, ~124 KB) plus `README` + `LICENSE` — 4 files, ~30 KB total. No
  transitive dependency tree, so no supply-chain surface. Verify: `npm pack vibetrack` then
  read the one file.
- **No `eval`, no dynamic code, no shell exec.** Audited: zero `eval` / `new Function` /
  `execSync`. The only process spawns are opening your browser on `login` and running the
  local `proxy` server — both user-initiated.
- **No hidden phone-home / no telemetry.** The only network destinations baked in are the AI
  provider APIs you configure, `localhost` (Ollama / LM Studio / ComfyUI / your proxy), and
  `vibeusage.c0vibe.app` — and the site is contacted **only** when you run `upload`.
- **Published with npm provenance.** Releases are built and published from CI
  (`.github/workflows/release.yml`, `npm publish --provenance`), which cryptographically ties
  the package on npm to this exact public source commit. Check the "Provenance" badge on npm.

## Your keys and data stay yours
- **Local-first.** Nothing leaves your machine unless you run `connect`/`sync`/`upload`.
- **Keys never leave.** Credentials live in `~/.vibetracker/config.json` (chmod 600) or `VT_*`
  env vars. They are **never** bundled, logged, or uploaded.
- **Uploads are aggregates only.** `upload` sends per-provider totals + rollups — never
  individual records, prompts, model names, or keys. The server re-sanitizes and can never be
  told your data is "verified" (see `docs/compliance/TRUST_MODEL.md`).
- **Untrusted-data boundary.** Every provider response is sanitized (ANSI/control-char strip,
  numeric bounds, prototype-pollution rejection, whitelist rebuild) before storage.

## Verify it yourself
```bash
npm pack vibetrack && tar -tf vibetrack-*.tgz    # exactly: dist/vibetracker.js, README, LICENSE, package.json
npm view vibetrack                                # deps: none; check provenance
```

## Reporting
Report suspected vulnerabilities privately to the maintainer (see the repo). Please do not
open a public issue for a security report.
