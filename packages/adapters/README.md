# @vibetracker/adapters

One adapter per provider, each implementing the `Adapter` contract from
`@vibetracker/core`. Every provider is an **SMA work partition**
(`packages/adapters/src/<provider>/**`) so different providers can be built in
parallel — but never two agents inside one provider directory.

## Acquisition tiers (best → worst; see PLAN §3–4)
1. **ledger** — real transaction history (Higgsfield MCP `transactions`, Replicate, OpenAI Costs).
2. **balance_delta** — poll balance, diff over time.
3. **log** — parse local logs (Claude Code JSONL).
4. **feed_recon** — generation feed × known credits/op (Suno, Udio).
5. **proxy** — intercept MCP/CLI calls (cross-cutting).

## Providers (scaffolded)
| Dir | Tier | Auth | Notes |
| --- | --- | --- | --- |
| `higgsfield/` | ledger | mcp | `transactions` + `balance` already available |
| `claude-code/` | log | localLogs | ccusage-style `~/.claude/projects/**/*.jsonl` |
| `openai/` | ledger | apiKey | Usage + Costs API (org) ⚠ verify |
| `replicate/` | ledger | apiKey | `/v1/predictions` + billing, per-sec GPU ⚠ verify |
| `elevenlabs/` | ledger | apiKey | `/v1/user/subscription` ⚠ verify |
| `falai/` | ledger/balance | apiKey | usage API ⚠ verify |
| `suno/` | feed_recon | cookie | Clerk session; ToS-gray; label estimated |
| `udio/` | feed_recon | cookie | no official API; ToS-gray; label estimated |

`_shared/` holds cross-adapter helpers (http, glob-match, credit→usd mapping stubs).
All USD figures are estimates derived from the pricing surface, never source of truth.
