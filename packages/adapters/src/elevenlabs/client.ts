// ElevenLabs data-source seam.
//   GET https://api.elevenlabs.io/v1/user/subscription     -> character_count/limit, tier
//   GET https://api.elevenlabs.io/v1/usage/character-stats -> { time[], usage: {"All":[]} }
// Auth: header `xi-api-key: <key>`.  ⚠ VERIFY field names against current docs.

export interface ElevenSubscription {
  character_count: number;
  character_limit: number;
  tier: string;
  next_character_count_reset_unix?: number;
}
export interface ElevenCharacterStats {
  time: number[];                    // unix ms per bucket (typically daily)
  usage: Record<string, number[]>;   // series keyed by breakdown, incl. "All"
}

export interface ElevenLabsClient {
  subscription(): Promise<ElevenSubscription>;
  characterStats(args: { startUnix: number; endUnix: number }): Promise<ElevenCharacterStats>;
}

export function createFixtureClient(sub: ElevenSubscription, stats: ElevenCharacterStats): ElevenLabsClient {
  return { async subscription() { return sub; }, async characterStats() { return stats; } };
}

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): ElevenLabsClient {
  const base = cfg.baseUrl ?? "https://api.elevenlabs.io";
  const headers = { "xi-api-key": cfg.apiKey };
  return {
    async subscription() {
      const res = await fetch(`${base}/v1/user/subscription`, { headers });
      if (!res.ok) throw new Error(`ElevenLabs subscription ${res.status}: ${await res.text()}`);
      return (await res.json()) as ElevenSubscription;
    },
    async characterStats({ startUnix, endUnix }) {
      const u = new URL(`${base}/v1/usage/character-stats`);
      u.searchParams.set("start_unix", String(startUnix));
      u.searchParams.set("end_unix", String(endUnix));
      const res = await fetch(u, { headers });
      if (!res.ok) throw new Error(`ElevenLabs character-stats ${res.status}: ${await res.text()}`);
      return (await res.json()) as ElevenCharacterStats;
    },
  };
}
