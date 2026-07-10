import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStats } from "../commands/stats.ts";
import type { Stats } from "../../../core/src/stats.ts";
import type { AggRow } from "../../../core/src/aggregate.ts";

const row = (key: string, count: number, raw: number, usd?: number, credits = 0): AggRow => ({
  key,
  count,
  raw,
  usd,
  credits,
});

test("renderStats opens with a stats deck and preserves breakdown tables", () => {
  const stats: Stats = {
    range: { from: "2026-07-01T00:00:00Z", to: "2026-07-05T00:00:00Z" },
    totals: { count: 9, providers: 3, credits: 12, usd: 42.5 },
    byProvider: [row("higgsfield", 4, 400, 30, 12), row("ollama", 3, 300, 0), row("openai", 2, 200, 12.5)],
    byCategory: [row("video", 4, 400, 30, 12), row("llm", 5, 500, 12.5)],
    byModel: [row("canvas", 4, 400, 30, 12), row("llama", 3, 300, 0)],
    byAccount: [row("studio", 5, 500, 32, 12), row("personal", 4, 400, 10.5)],
    byProfile: [row("client-a", 4, 400, 30, 12), row("local-lab", 3, 300, 0), row("main", 2, 200, 12.5)],
    byTeam: [row("creative", 4, 400, 30, 12), row("solo", 5, 500, 12.5)],
    topModels: [row("canvas", 4, 400, 30, 12), row("llama", 3, 300, 0)],
    byDay: [
      row("2026-07-01", 1, 10, 1),
      row("2026-07-02", 2, 20, 2),
      row("2026-07-03", 3, 30, 3),
      row("2026-07-04", 1, 10, 1),
      row("2026-07-05", 2, 20, 2),
    ],
    localSavingsUsd: 7.25,
  };

  const output = renderStats(stats);

  assert.match(output, /VTK:\/\/STATS-DECK\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/STATS\/\/VIBERS-UNITE/);
  assert.match(output, /top rail \[HF\] Higgsfield/);
  assert.match(output, /surprise cadence: queue -> scan beat -> checkpoint encore/);
  assert.match(output, /range 2026-07-01 → 2026-07-05/);
  assert.match(output, /provider lead higgsfield 4 ops \$30\.00/);
  assert.match(output, /category lead video 4 ops \$30\.00/);
  assert.match(output, /model lead canvas 4 ops \$30\.00/);
  assert.match(output, /provider race: branded spend and volume/);
  assert.match(output, /\[HF\] Higgsfield \$30\.00/);
  assert.match(output, /\[OL\] Ollama \$0\.00/);
  assert.match(output, /\[OA\] OpenAI \$12\.50/);
  assert.match(output, /scope rail accounts:2 profiles:3 teams:2/);
  assert.match(output, /account lead studio 5 ops \$32\.00/);
  assert.match(output, /profile lead client-a 4 ops \$30\.00/);
  assert.match(output, /team lead creative 4 ops \$30\.00/);
  assert.match(output, /team\/org separation is USAGE ONLY; trust stays sidecar/);
  assert.match(output, /viber lanes creator:4 builder:5 ops:0/);
  assert.match(output, /all AI work counts: creator \+ builder \+ local \+ infra/);
  assert.match(output, /local savings \$7\.25 · providers 3/);
  assert.match(output, /GitHub-scale heatline: daily usage rhythm/);
  assert.match(output, /days 07\/01 07\/02 07\/03 07\/04 07\/05/);
  assert.match(output, /heat ▒ ▓ █ ▒ ▓\s+9 ops \$9\.00/);
  assert.match(output, /legend · none ░ low ▒ medium ▓ high █ peak/);
  assert.match(output, /heatline is USAGE ONLY; trust rails never light cells/);
  assert.match(output, /14d signal/);
  assert.match(output, /privacy: local ledger first · publish only after dry-run/);
  assert.match(output, /USAGE STATS  \(2026-07-01 → 2026-07-05\)/);
  assert.match(output, /By provider/);
  assert.match(output, /higgsfield\s+4\s+12\s+\$30\.00/);
  assert.match(output, /By account/);
  assert.match(output, /studio\s+5\s+12\s+\$32\.00/);
  assert.match(output, /By profile/);
  assert.match(output, /client-a\s+4\s+12\s+\$30\.00/);
  assert.match(output, /By team\/org/);
  assert.match(output, /creative\s+4\s+12\s+\$30\.00/);
  assert.match(output, /Top models/);
});

test("renderStats gives a no-data stats deck", () => {
  const output = renderStats({
    range: {},
    totals: { count: 0, providers: 0, credits: 0 },
    byProvider: [],
    byCategory: [],
    byModel: [],
    byAccount: [],
    byProfile: [],
    byTeam: [],
    topModels: [],
    byDay: [],
    localSavingsUsd: 0,
  });

  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/STATS\/\/VIBERS-UNITE/);
  assert.match(output, /top rail none yet/);
  assert.match(output, /range no data/);
  assert.match(output, /provider lead none yet/);
  assert.match(output, /provider race waiting for usage/);
  assert.match(output, /scope rail waiting: add --account --profile --team/);
  assert.match(output, /multi-account\/team split lights when scoped/);
  assert.match(output, /viber lanes creator:0 builder:0 ops:0/);
  assert.match(output, /GitHub-scale heatline waiting for daily usage/);
  assert.match(output, /heatline is USAGE ONLY; trust rails never light cells/);
  assert.match(output, /14d signal no day history yet/);
  assert.match(output, /By provider\n  \(none\)/);
  assert.match(output, /By account\n  \(none\)/);
  assert.match(output, /By profile\n  \(none\)/);
  assert.match(output, /By team\/org\n  \(none\)/);
});
