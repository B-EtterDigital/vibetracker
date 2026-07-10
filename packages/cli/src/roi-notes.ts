import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface RoiNote {
  id: string;
  from: string;
  to: string;
  note: string;
  valueUsd?: number;
  tags: string[];
  createdAt: string;
}

export function loadRoiNotes(path: string): RoiNote[] {
  if (!existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return Array.isArray(parsed) ? parsed.filter((note): note is RoiNote => Boolean(note && typeof note === "object" && "id" in note)) : [];
}

export function saveRoiNotes(path: string, notes: RoiNote[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(notes, null, 2), { encoding: "utf8", mode: 0o600 });
}

export function createRoiNote(input: {
  from: string;
  to: string;
  note: string;
  valueUsd?: number;
  tags?: string[];
  createdAt?: string;
}): RoiNote {
  const from = new Date(input.from).toISOString();
  const to = new Date(input.to).toISOString();
  if (!input.note.trim()) throw new Error("ROI note cannot be empty");
  return {
    id: `roi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    note: input.note.trim().slice(0, 500),
    ...(Number.isFinite(input.valueUsd) ? { valueUsd: Number(input.valueUsd!.toFixed(2)) } : {}),
    tags: input.tags ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function renderRoiNotes(notes: RoiNote[]): string {
  if (!notes.length) return "No ROI notes yet.";
  return notes.map((note) => {
    const value = note.valueUsd != null ? ` · value $${note.valueUsd.toFixed(2)}` : "";
    const tags = note.tags.length ? ` · ${note.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    return `${note.from.slice(0, 10)} → ${note.to.slice(0, 10)}${value}${tags}\n  ${note.note}`;
  }).join("\n");
}
