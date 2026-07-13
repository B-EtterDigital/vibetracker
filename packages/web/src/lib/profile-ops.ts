// The real operation count for a profile.
//
// `vibetracker_submissions.record_count` is how many ROWS a bundle uploaded. Once the ingest
// rolls records up per (provider, day, model), that number is provenance, not usage: a
// 964-row bundle can carry 89,142 operations. Reading it as "ops" is what made a heavy
// Claude Code user read as 964 operations and let a low-volume source outrank them.
//
// The authoritative count is the per-provider `ops` aggregate — the ingest builds it by
// summing each record's own operation count. record_count is only the fallback, for
// submissions that predate provider rows.
export function profileOps(profile: {
  providers: ReadonlyArray<{ ops: number }>;
  latest: { record_count: number } | null;
}): number {
  let summed = 0;
  for (const provider of profile.providers) {
    if (Number.isFinite(provider.ops) && provider.ops > 0) summed += provider.ops;
  }
  return summed > 0 ? summed : (profile.latest?.record_count ?? 0);
}
