# Good First Adapter Tasks

This list turns planned coverage into scoped open-source work. Pick one provider, keep the
diff inside `packages/adapters/src/<provider-id>/**`, and leave the registry status honest.

## Ledger Or Billing API

Best first choices when the provider has a documented usage endpoint:

| Provider | Why it is good | Acceptance |
| --- | --- | --- |
| `deepseek` | Narrow LLM billing/balance surface | Fixture, balance/usage normalizer, telemetry on auth errors |
| `mistral` | European LLM provider with clear account billing | USD or token rows with category `llm` |
| `together` | Common OpenAI-compatible provider | Usage API rows plus proxy guidance |
| `stability` | Image/video credits are easy to reason about | Credit balance or generation rows |
| `deepgram` | Audio usage maps cleanly to minutes/characters | Audio category records and fixture |

## Feed Reconstruction

Use this only when provider billing is not available but generated assets can be listed.

| Provider | Acceptance |
| --- | --- |
| `pika` | Feed fixture, skipped failed generations, low/medium confidence |
| `ideogram` | Image feed fixture, model/category inference |
| `seaart` | Cookie/feed warning in README, no secret preservation |
| `tensorart` | Credit multiplier documented and low confidence |

## Local And Proxy Providers

These are good for contributors without paid accounts.

| Provider | Acceptance |
| --- | --- |
| `llama-cpp` | OpenAI-compatible proxy sample and `$0` local records |
| `vllm` | Proxy capture fixture with model names |
| `text-generation-webui` | Local endpoint notes plus proxy capture |
| `automatic1111` | Local history parser or documented output manifest |

## Claim Shape

1. Run `vibetracker adapter scaffold <provider-id> --dry-run`.
2. Generate the scaffold.
3. Replace the fixture with a redacted real sample.
4. Add normalizer tests for success, zero/failed rows, and malformed input.
5. Run `pnpm test:unit`, `pnpm typecheck`, and `pnpm telemetry:audit:strict`.
6. Only then update the registry status and method text.

Provider tasks are intentionally independent, so future contributors can work in parallel
without touching shared contracts.
