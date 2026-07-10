// Deep filtering over usage records — the query layer under `vibetracker stats/total`.
// Pure, no I/O.

import type { NormalizedRecord, Category, Source } from "./schema/record.ts";

export interface RecordFilter {
  from?: string;         // ISO
  to?: string;           // ISO
  providers?: string[];
  categories?: Category[];
  models?: string[];     // case-insensitive substring OR exact (see matchModel)
  sources?: Source[];
  accounts?: string[];
  profiles?: string[];
  teams?: string[];
  minUsd?: number;
}

// Resolve "30d" / "24h" / "8w" / "6mo" / an ISO date → an ISO timestamp.
export function parseSince(spec: string, now: number = Date.now()): string {
  const m = /^(\d+)\s*(h|d|w|mo|m)$/.exec(spec.trim());
  if (m) {
    const n = Number(m[1]);
    const unit = m[2];
    const ms = unit === "h" ? 3_600_000
      : unit === "d" ? 86_400_000
      : unit === "w" ? 7 * 86_400_000
      : /* mo|m */ 30 * 86_400_000;
    return new Date(now - n * ms).toISOString();
  }
  const t = Date.parse(spec);
  if (Number.isNaN(t)) throw new Error(`invalid --since value: ${spec} (use 30d, 24h, 8w, 6mo, or a date)`);
  return new Date(t).toISOString();
}

function matchModel(model: string | undefined, wanted: Set<string>): boolean {
  if (!model) return false;
  const lc = model.toLowerCase();
  for (const w of wanted) if (lc === w || lc.includes(w)) return true;
  return false;
}

export function filterRecords(records: NormalizedRecord[], f: RecordFilter): NormalizedRecord[] {
  const fromT = f.from ? Date.parse(f.from) : -Infinity;
  const toT = f.to ? Date.parse(f.to) : Infinity;
  const provs = f.providers?.length ? new Set(f.providers) : undefined;
  const cats = f.categories?.length ? new Set(f.categories) : undefined;
  const models = f.models?.length ? new Set(f.models.map((m) => m.toLowerCase())) : undefined;
  const srcs = f.sources?.length ? new Set(f.sources) : undefined;
  const accounts = f.accounts?.length ? new Set(f.accounts) : undefined;
  const profiles = f.profiles?.length ? new Set(f.profiles) : undefined;
  const teams = f.teams?.length ? new Set(f.teams) : undefined;

  return records.filter((r) => {
    const t = Date.parse(r.ts);
    if (t < fromT || t > toT) return false;
    if (provs && !provs.has(r.provider)) return false;
    if (cats && !cats.has(r.category)) return false;
    if (models && !matchModel(r.model, models)) return false;
    if (srcs && !srcs.has(r.source)) return false;
    if (accounts && !accounts.has(r.accountId ?? "")) return false;
    if (profiles && !profiles.has(r.profileId ?? "")) return false;
    if (teams && !teams.has(r.teamId ?? "")) return false;
    if (f.minUsd != null && (r.usdEst ?? 0) < f.minUsd) return false;
    return true;
  });
}
