import { test } from "node:test";
import assert from "node:assert/strict";
import { levelFor, CREATIVE_CREDIT_CURVE, CODING_OPS_CURVE } from "../viber-levels.ts";

test("creative traits level on credits with the 1k/5k/10k curve", () => {
  assert.equal(levelFor("video", 0, 0).level, 0);
  assert.equal(levelFor("video", 999, 0).level, 0);
  assert.equal(levelFor("video", 1_000, 0).level, 1);
  assert.equal(levelFor("video", 5_000, 0).level, 2);
  assert.equal(levelFor("video", 10_000, 0).level, 3);
  assert.equal(levelFor("video", 2_500_000, 0).level, 10);
});

test("progress interpolates toward the next threshold", () => {
  const l = levelFor("image", 3_000, 0); // between 1k (L1) and 5k (L2)
  assert.equal(l.level, 1);
  assert.equal(l.next, CREATIVE_CREDIT_CURVE[1]);
  assert.ok(Math.abs(l.progress - 0.5) < 0.01);
});

test("level 10 reports full progress and no next threshold", () => {
  const l = levelFor("coding", 0, CODING_OPS_CURVE[9]);
  assert.equal(l.level, 10);
  assert.equal(l.next, null);
  assert.equal(l.progress, 1);
});

test("coding levels on ops", () => {
  assert.equal(levelFor("coding", 0, 999_999).level, 0);
  assert.equal(levelFor("coding", 0, 1_000_000).level, 1);
  assert.equal(levelFor("coding", 0, 10_200_000_000).level, 9);
});

test("credit traits without credits fall back to ops as credit-equivalents", () => {
  const l = levelFor("image", 0, 2_800);
  assert.equal(l.measure, "ops");
  assert.equal(l.level, 1); // 2.8k generations ≈ 2.8k credit-equivalents → past the 1k floor
});

test("support traits use the lighter ops curve", () => {
  assert.equal(levelFor("research", 0, 100).level, 1);
  assert.equal(levelFor("tooling", 0, 40_000).level, 6);
});
