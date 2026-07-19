// Vibe Categories — the creator-facing grouping over the primitive Category.
//
// The primitive Category ("llm" | "coding" | "image" | ...) stays the record-
// level source of truth that adapters emit. This layer maps each primitive to a
// creator-facing vibe: a stable id, a display label ("AI Coding"), a short form,
// and a color. Identity, specialization, and provider tags render off this so
// the whole product speaks one vocabulary ("AI Image Creation", not "image").

import type { Category } from "./schema/record.ts";

export type VibeCategoryId =
  | "coding"
  | "image"
  | "video"
  | "music"
  | "voice"
  | "threed"
  | "research"
  | "tooling";

export interface VibeCategory {
  id: VibeCategoryId;
  label: string; // full creator-facing name, e.g. "AI Coding"
  short: string; // compact form for chips/tags, e.g. "Coding"
  color: string; // on-palette hex, distinct per vibe
}

export const VIBE_CATEGORIES: Record<VibeCategoryId, VibeCategory> = {
  coding: { id: "coding", label: "AI Coding", short: "Coding", color: "#2ee8d6" },
  image: { id: "image", label: "AI Image Creation", short: "Image", color: "#ff4fd8" },
  video: { id: "video", label: "AI Video Creation", short: "Video", color: "#9f7cff" },
  music: { id: "music", label: "AI Music", short: "Music", color: "#ffc64d" },
  voice: { id: "voice", label: "AI Voice & Audio", short: "Voice", color: "#4de0b3" },
  threed: { id: "threed", label: "AI 3D", short: "3D", color: "#3ec9ff" },
  research: { id: "research", label: "AI Chat & Research", short: "Research", color: "#36e39b" },
  tooling: { id: "tooling", label: "AI Automation", short: "Automation", color: "#7a8a93" },
};

// Primitive Category -> vibe id. Every primitive maps to exactly one vibe;
// unknown/legacy primitives fall back to tooling so nothing renders blank.
const FROM_PRIMITIVE: Record<Category, VibeCategoryId> = {
  coding: "coding",
  llm: "research",
  image: "image",
  video: "video",
  music: "music",
  audio: "voice",
  "3d": "threed",
  other: "tooling",
};

/** Resolve any primitive category string to its vibe category (tooling fallback). */
export function vibeCategoryFor(primitive: string | null | undefined): VibeCategory {
  const id = FROM_PRIMITIVE[(primitive ?? "other") as Category] ?? "tooling";
  return VIBE_CATEGORIES[id];
}

/** Creator-facing label for a primitive category, e.g. "image" -> "AI Image Creation". */
export function vibeLabel(primitive: string | null | undefined): string {
  return vibeCategoryFor(primitive).label;
}

/** On-palette color for a primitive category. */
export function vibeColor(primitive: string | null | undefined): string {
  return vibeCategoryFor(primitive).color;
}
