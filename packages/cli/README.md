# @vibetracker/cli

The `npx vibetracker` command surface. Local-first: nothing leaves the machine unless
the user runs `connect`/`upload`.

```
npx vibetracker                     # interactive: pick platforms, connect, show totals
npx vibetracker daily|monthly|total # merged usage tables across all providers
npx vibetracker breakdown --by provider|category|model
npx vibetracker connect <provider>  # store read-only creds in OS keychain
npx vibetracker sync                # refresh local ledger from connected adapters
npx vibetracker live                # TUI: balances + burn rate
npx vibetracker export --json|csv
npx vibetracker upload              # opt-in push to the VibeTRACKER leaderboard
```

- Local store: SQLite at `~/.vibetracker/db.sqlite` (git-ignored).
- Secrets: OS keychain (keytar), read-only/scoped keys preferred.
- Config: `~/.vibetracker/config.toml`.
- Depends on `@vibetracker/core` (contract) and `@vibetracker/adapters`.
