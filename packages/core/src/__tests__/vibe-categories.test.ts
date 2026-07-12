import { test } from "node:test";
import assert from "node:assert/strict";
import { VIBE_CATEGORIES, vibeCategoryFor, vibeLabel, vibeColor } from "../vibe-categories.ts";

test("every primitive category maps to a creator-facing vibe", () => {
  assert.equal(vibeCategoryFor("coding").id, "coding");
  assert.equal(vibeCategoryFor("llm").id, "research");
  assert.equal(vibeCategoryFor("image").id, "image");
  assert.equal(vibeCategoryFor("video").id, "video");
  assert.equal(vibeCategoryFor("music").id, "music");
  assert.equal(vibeCategoryFor("audio").id, "voice");
  assert.equal(vibeCategoryFor("3d").id, "threed");
  assert.equal(vibeCategoryFor("other").id, "tooling");
});

test("labels are the creator-facing AI names", () => {
  assert.equal(vibeLabel("coding"), "AI Coding");
  assert.equal(vibeLabel("image"), "AI Image Creation");
  assert.equal(vibeLabel("video"), "AI Video Creation");
  assert.equal(vibeLabel("audio"), "AI Voice & Audio");
  assert.equal(vibeLabel("llm"), "AI Chat & Research");
});

test("unknown or missing primitives fall back to tooling, never blank", () => {
  assert.equal(vibeCategoryFor(null).id, "tooling");
  assert.equal(vibeCategoryFor(undefined).id, "tooling");
  assert.equal(vibeCategoryFor("nonsense").id, "tooling");
});

test("colors are distinct per vibe and non-empty", () => {
  const colors = Object.values(VIBE_CATEGORIES).map((v) => v.color);
  assert.equal(new Set(colors).size, colors.length);
  for (const c of colors) assert.match(c, /^#[0-9a-f]{6}$/i);
  assert.equal(vibeColor("image"), VIBE_CATEGORIES.image.color);
});
