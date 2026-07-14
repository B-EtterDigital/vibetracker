export interface OrchestrationTrace {
  activityHours: number;
  wallHours: number;
  overlapRatio: number;
  peakOverlap: number;
  nightStarts: number;
  longestSpanHours: number;
  sessionFiles: number;
  windowDays: number;
  filesAvailable: number;
  filesScanned: number;
  sampledFiles: number;
  readBytes: number;
  limited: boolean;
}

function finiteNonNegative(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function normalizeOrchestration(value: unknown): OrchestrationTrace | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const activityHours = finiteNonNegative(raw.activityHours);
  const rawWallHours = finiteNonNegative(raw.wallHours);
  const rawSessionFiles = finiteNonNegative(raw.sessionFiles);
  const rawFilesScanned = finiteNonNegative(raw.filesScanned);
  if (!activityHours || !rawWallHours || !rawSessionFiles || !rawFilesScanned) return undefined;

  const wallHours = Math.min(rawWallHours, activityHours);
  const filesScanned = Math.floor(rawFilesScanned);
  const sessionFiles = Math.min(Math.floor(rawSessionFiles), filesScanned);
  if (wallHours <= 0 || filesScanned <= 0 || sessionFiles <= 0) return undefined;
  const filesAvailable = Math.max(filesScanned, Math.floor(finiteNonNegative(raw.filesAvailable) ?? filesScanned));
  return {
    activityHours,
    wallHours,
    overlapRatio: Math.round((activityHours / wallHours) * 10) / 10,
    peakOverlap: Math.min(Math.floor(finiteNonNegative(raw.peakOverlap) ?? 0), Math.max(1, sessionFiles)),
    nightStarts: Math.floor(finiteNonNegative(raw.nightStarts) ?? 0),
    longestSpanHours: Math.min(finiteNonNegative(raw.longestSpanHours) ?? 0, activityHours),
    sessionFiles,
    windowDays: Math.max(1, Math.min(31, Math.floor(finiteNonNegative(raw.windowDays) ?? 7))),
    filesAvailable,
    filesScanned,
    sampledFiles: Math.min(Math.floor(finiteNonNegative(raw.sampledFiles) ?? 0), filesScanned),
    readBytes: Math.floor(finiteNonNegative(raw.readBytes) ?? 0),
    limited: raw.limited === true || filesScanned < filesAvailable,
  };
}
