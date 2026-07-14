// Reconstruct bounded agent-activity spans from local Codex and Claude session timestamps.
// Consecutive events at most 30 minutes apart form an observed span. This is useful orchestration
// evidence, but it is not exact process runtime, billing time, human effort, or proof the user was
// absent. The collector is recent-window and byte-budgeted so upload cannot trigger an all-disk scan.

import { closeSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createConsoleTelemetry, type Telemetry } from "../../core/src/telemetry/index.ts";

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

export interface CollectOrchestrationOptions {
  roots?: string[];
  telemetry?: Telemetry;
  maxFiles?: number;
  maxBytes?: number;
  windowDays?: number;
  now?: number;
}

export interface TraceCoverage {
  sessionFiles: number;
  windowDays: number;
  filesAvailable: number;
  filesScanned: number;
  sampledFiles: number;
  readBytes: number;
  limited: boolean;
}

export interface Interval { start: number; end: number }

interface SessionFile { path: string; size: number; mtimeMs: number }
interface ReadResult { content: string; bytesRead: number; sampled: boolean }

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const TS_RE = /"timestamp"\s*:\s*"([^"]+)"/g;
const BIG_FILE = 8_000_000;
const CHUNK = 131_072;
const IDLE_GAP = 1_800_000;
const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_MAX_BYTES = 768 * 1024 * 1024;

function defaultRoots(): string[] {
  const home = homedir();
  return [join(home, ".codex", "sessions"), join(home, ".claude", "projects")];
}

function plannedReadBytes(size: number): number {
  return size <= BIG_FILE ? size : Math.min(size, CHUNK * 2);
}

function readSession(file: string, size: number): ReadResult {
  if (size <= BIG_FILE) {
    return { content: readFileSync(file, "utf8"), bytesRead: size, sampled: false };
  }
  const fd = openSync(file, "r");
  try {
    const head = Buffer.alloc(CHUNK);
    const headRead = readSync(fd, head, 0, CHUNK, 0);
    const tail = Buffer.alloc(CHUNK);
    const tailRead = readSync(fd, tail, 0, CHUNK, Math.max(0, size - CHUNK));
    return {
      content: `${head.toString("utf8", 0, headRead)}\n${tail.toString("utf8", 0, tailRead)}`,
      bytesRead: headRead + tailRead,
      sampled: true,
    };
  } finally {
    closeSync(fd);
  }
}

function sessionSegments(file: string, size: number, minTime: number, maxTime: number): { intervals: Interval[]; read: ReadResult } {
  const read = readSession(file, size);
  const stamps: number[] = [];
  TS_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TS_RE.exec(read.content)) !== null) {
    const timestamp = Date.parse(match[1]);
    if (Number.isFinite(timestamp) && timestamp >= minTime && timestamp <= maxTime) stamps.push(timestamp);
  }
  if (stamps.length < 2) return { intervals: [], read };
  stamps.sort((a, b) => a - b);

  const intervals: Interval[] = [];
  let start = stamps[0];
  let previous = stamps[0];
  for (let index = 1; index < stamps.length; index += 1) {
    const timestamp = stamps[index];
    if (timestamp === previous) continue;
    if (timestamp - previous > IDLE_GAP) {
      if (previous > start) intervals.push({ start, end: previous });
      start = timestamp;
    }
    previous = timestamp;
  }
  if (previous > start) intervals.push({ start, end: previous });
  return { intervals, read };
}

function listSessionFiles(root: string, telemetry: Telemetry): SessionFile[] {
  const files: SessionFile[] = [];
  const directories = [root];
  while (directories.length) {
    const directory = directories.pop()!;
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "ENOENT" && directory === root) {
        telemetry.addBreadcrumb("cli.orchestration.root_missing", { root }, "info");
      } else {
        telemetry.captureError(error, { area: "cli.orchestration.directory", severity: "warn", directory });
      }
      continue;
    }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        directories.push(path);
      } else if (entry.isFile() && path.endsWith(".jsonl")) {
        try {
          const stat = statSync(path);
          files.push({ path, size: stat.size, mtimeMs: stat.mtimeMs });
        } catch (error) {
          telemetry.addBreadcrumb("cli.orchestration.file_vanished", { file: entry.name, error: (error as Error).message }, "info");
        }
      }
    }
  }
  return files;
}

function peakOverlap(intervals: Interval[]): number {
  const events: Array<{ timestamp: number; delta: number }> = [];
  for (const interval of intervals) {
    events.push({ timestamp: interval.start, delta: 1 });
    events.push({ timestamp: interval.end, delta: -1 });
  }
  events.sort((a, b) => a.timestamp - b.timestamp || a.delta - b.delta);
  let active = 0;
  let peak = 0;
  for (const event of events) {
    active += event.delta;
    peak = Math.max(peak, active);
  }
  return peak;
}

function unionMs(intervals: Interval[]): number {
  if (!intervals.length) return 0;
  const sorted = intervals.slice().sort((a, b) => a.start - b.start);
  let total = 0;
  let start = sorted[0].start;
  let end = sorted[0].end;
  for (let index = 1; index < sorted.length; index += 1) {
    const interval = sorted[index];
    if (interval.start <= end) {
      end = Math.max(end, interval.end);
    } else {
      total += end - start;
      start = interval.start;
      end = interval.end;
    }
  }
  return total + end - start;
}

export function summarizeIntervals(intervals: Interval[], coverage?: Partial<TraceCoverage>): OrchestrationTrace | null {
  if (!intervals.length) return null;
  let activityMs = 0;
  let longestMs = 0;
  let nightStarts = 0;
  for (const interval of intervals) {
    const duration = Math.max(0, interval.end - interval.start);
    activityMs += duration;
    longestMs = Math.max(longestMs, duration);
    const hour = new Date(interval.start).getHours();
    if (hour >= 23 || hour < 7) nightStarts += 1;
  }
  const wallMs = unionMs(intervals);
  const activityHours = activityMs / MS_PER_HOUR;
  const wallHours = wallMs / MS_PER_HOUR;
  return {
    activityHours: Math.round(activityHours * 10) / 10,
    wallHours: Math.round(wallHours * 10) / 10,
    overlapRatio: wallHours > 0 ? Math.round((activityHours / wallHours) * 10) / 10 : 0,
    peakOverlap: peakOverlap(intervals),
    nightStarts,
    longestSpanHours: Math.round((longestMs / MS_PER_HOUR) * 10) / 10,
    sessionFiles: coverage?.sessionFiles ?? intervals.length,
    windowDays: coverage?.windowDays ?? 1,
    filesAvailable: coverage?.filesAvailable ?? intervals.length,
    filesScanned: coverage?.filesScanned ?? intervals.length,
    sampledFiles: coverage?.sampledFiles ?? 0,
    readBytes: coverage?.readBytes ?? 0,
    limited: coverage?.limited ?? false,
  };
}

export function collectOrchestrationHours(options: CollectOrchestrationOptions = {}): OrchestrationTrace | null {
  const telemetry = options.telemetry ?? createConsoleTelemetry();
  const roots = options.roots ?? defaultRoots();
  const maxFiles = Math.max(1, options.maxFiles ?? 10_000);
  const maxBytes = Math.max(1, options.maxBytes ?? DEFAULT_MAX_BYTES);
  const windowDays = Math.min(31, Math.max(1, Math.floor(options.windowDays ?? DEFAULT_WINDOW_DAYS)));
  const now = options.now ?? Date.now();
  const cutoff = now - windowDays * MS_PER_DAY;

  try {
    const candidates = roots
      .flatMap((root) => listSessionFiles(root, telemetry))
      .filter((file) => file.mtimeMs >= cutoff)
      .sort((a, b) => b.mtimeMs - a.mtimeMs || a.path.localeCompare(b.path));
    const intervals: Interval[] = [];
    let filesScanned = 0;
    let sessionFiles = 0;
    let sampledFiles = 0;
    let readBytes = 0;

    for (const file of candidates) {
      if (filesScanned >= maxFiles) break;
      const plannedBytes = plannedReadBytes(file.size);
      if (filesScanned > 0 && readBytes + plannedBytes > maxBytes) break;
      try {
        const result = sessionSegments(file.path, file.size, cutoff, now + 300_000);
        filesScanned += 1;
        readBytes += result.read.bytesRead;
        if (result.read.sampled) sampledFiles += 1;
        if (result.intervals.length) {
          sessionFiles += 1;
          intervals.push(...result.intervals);
        }
      } catch (error) {
        filesScanned += 1;
        telemetry.captureError(error, { area: "cli.orchestration.session", severity: "info", file: file.path.split("/").at(-1) });
      }
    }

    const limited = filesScanned < candidates.length;
    if (limited) {
      telemetry.addBreadcrumb("cli.orchestration.coverage_limited", {
        filesAvailable: candidates.length,
        filesScanned,
        maxFiles,
        maxBytes,
      }, "warn");
    }
    if (!intervals.length) {
      telemetry.addBreadcrumb("cli.orchestration.no_activity_spans", { roots: roots.length, filesScanned }, "info");
      return null;
    }
    return summarizeIntervals(intervals, {
      sessionFiles,
      windowDays,
      filesAvailable: candidates.length,
      filesScanned,
      sampledFiles,
      readBytes,
      limited,
    });
  } catch (error) {
    telemetry.captureError(error, { area: "cli.orchestration.scan", severity: "warn" });
    return null;
  }
}
