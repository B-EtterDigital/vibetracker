# @vibetracker/cli

The `npx vibetracker` command surface. Local-first: nothing leaves the machine unless
the user runs `connect`/`upload`.

```
npx vibetracker                     # interactive: pick platforms, connect, show totals
npx vibetracker daily|monthly|total # merged usage tables across all providers
npx vibetracker breakdown --by provider|category|model
npx vibetracker connect <provider>  # store read-only creds in OS keychain
npx vibetracker sync                # refresh local ledger from connected adapters
npx vibetracker live                # read-only TUI: ledger, burn, proof, freshness, next moves
npx vibetracker live --once         # deterministic one-frame snapshot for scripts and logs
npx vibetracker live --budget 100   # add a monthly budget gate; refreshes every 5s in a TTY
npx vibetrack api serve --port 8765 # tokenized local API + private /life cockpit link
npx vibetracker export --json|csv
npx vibetracker upload              # opt-in push to the VibeTRACKER leaderboard
npx vibetracker login               # reuse an existing `gh auth` session; browser/C0VIBE fallback
npx vibetracker import midjourney --images 12345 # official /info lifetime total
npx vibetracker connect leonardo    # official Production API key; no cookie/user ID
npx vibetracker connect cynaps3     # scoped Musicmation usage:read token
```

- Local store: SQLite at `~/.vibetracker/db.sqlite` (git-ignored).
- Secrets: OS keychain (keytar), read-only/scoped keys preferred.
- Config: `~/.vibetracker/config.toml`.
- Local API: binds to `127.0.0.1`, protects read endpoints with an ephemeral
  bearer token, and prints a dashboard URL whose token stays in the fragment.
  The browser extension may post sanitized capture events without receiving
  access to `/records`, `/stats`, or `/insights`.
- Live console: reads the local aggregate ledger on every frame. It writes no
  usage, calls no providers, and uploads nothing. Piped/non-TTY output
  automatically emits one snapshot instead of hanging.
- Depends on `@vibetracker/core` (contract) and `@vibetracker/adapters`.

## Midjourney lifetime images

Midjourney is deliberately cookie-free. Run Midjourney's official `/info` command in Discord,
then import its Lifetime Usage image count with `vibetracker import midjourney --images N`.
The count is stored locally as manual, low-confidence image usage. Re-importing replaces the
previous lifetime snapshot, so the total never stacks or double-counts. For copied `/info` text,
use `--info path/to/midjourney-info.txt` (or `--info -` for stdin).

## Leonardo.ai image history

Connect Leonardo.ai with `vibetracker connect leonardo`, paste a Production API key from
`https://app.leonardo.ai/api-access`, then run `vibetracker sync`. VibeTRACKER resolves the
account ID through the official `/me` endpoint, walks the paginated generation feed, counts
completed image outputs, and reads the current API-token balance. The key remains in the OS
keyring. Leonardo's generation-history response does not expose historical per-generation
cost, so VibeTRACKER records exact image counts without fabricating USD or credit spend.

## Cynaps3 Musicmation ledger

Connect Cynaps3 with `vibetracker connect cynaps3`. The CLI opens the read-only
`usage:read` authorization screen, receives the result on a loopback PKCE callback, and stores
the access and rotating refresh tokens in the OS keyring. No token or cookie paste is required.
The adapter reads versioned, per-user Musicmation operations and native
credits from Cynaps3's authoritative ledger. It never receives prompts, lyrics, media URLs,
browser cookies, or a service-role key. The provider remains marked as awaiting live proof until
the producer endpoint is deployed and its OAuth, pagination, and populated-range probes pass.

The Cynaps3 producer registers the public OAuth client ID `vibeusage-cli` for
`http://127.0.0.1:8787/callback`. Operators can override that client ID with
`VT_CYNAPS3_OAUTH_CLIENT_ID` and the callback port with `--port` during staged deployments.
