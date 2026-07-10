import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LOCAL_ENDPOINTS, LOCAL_MANUAL_TOOLS, detectLocalEndpoints, detectOpenAICompatible, localDetectionSnapshot, renderLocalDetection, renderLocalDetectionHtml, renderOpenAICompatibleDetection } from "../detect.ts";

test("detectLocalEndpoints reports reachable local services and proxy commands", async () => {
  const statuses = await detectLocalEndpoints({
    fetchImpl: async (url: string | URL | Request) => {
      if (String(url).includes("11434")) return new Response("{}", { status: 200 });
      throw new Error("offline");
    },
  });
  const ollama = statuses.find((s) => s.id === "ollama");
  assert.equal(ollama?.reachable, true);
  assert.deepEqual(LOCAL_ENDPOINTS.map((endpoint) => endpoint.id), [
    "ollama",
    "lmstudio",
    "comfyui",
    "llama-cpp",
    "jan",
    "gpt4all",
    "vllm",
    "text-generation-webui",
    "automatic1111",
    "invokeai",
  ]);
  assert.deepEqual(LOCAL_MANUAL_TOOLS.map((tool) => tool.id), ["forge", "fooocus", "diffusers-local"]);
  const rendered = renderLocalDetection(statuses);
  assert.match(rendered, /VTK:\/\/LOCAL-SCAN\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(rendered, /LOCAL AI RADAR/);
  assert.match(rendered, /Vibers Unite/);
  assert.match(rendered, /c0vibe\.app/);
  assert.match(rendered, /\[OL\]/);
  assert.match(rendered, /\[LC\]/);
  assert.match(rendered, /\[JN\]/);
  assert.match(rendered, /\[G4\]/);
  assert.match(rendered, /MANUAL LOCAL RAILS/);
  assert.match(rendered, /Stable Diffusion WebUI Forge/);
  assert.match(rendered, /Diffusers local scripts/);
  assert.match(rendered, /#f7f7f2->#8dd3c7/);
  assert.match(rendered, /vibetracker proxy --provider ollama/);
});

test("detectLocalEndpoints recognizes current local OpenAI-compatible defaults", async () => {
  const seen: string[] = [];
  const statuses = await detectLocalEndpoints({
    fetchImpl: async (url: string | URL | Request) => {
      const value = String(url);
      seen.push(value);
      if (value.includes("8080") || value.includes("1337") || value.includes("4891")) return new Response("{}", { status: 200 });
      throw new Error("offline");
    },
  });

  assert.ok(seen.includes("http://127.0.0.1:8080/v1/models"));
  assert.ok(seen.includes("http://127.0.0.1:1337/v1/models"));
  assert.ok(seen.includes("http://127.0.0.1:4891/v1/models"));
  assert.equal(statuses.find((s) => s.id === "llama-cpp")?.reachable, true);
  assert.equal(statuses.find((s) => s.id === "jan")?.reachable, true);
  assert.equal(statuses.find((s) => s.id === "gpt4all")?.reachable, true);

  const rendered = renderLocalDetection(statuses);
  assert.match(rendered, /vibetracker proxy --provider llama-cpp --target http:\/\/127\.0\.0\.1:8080/);
  assert.match(rendered, /vibetracker proxy --provider jan --target http:\/\/127\.0\.0\.1:1337/);
  assert.match(rendered, /vibetracker proxy --provider gpt4all --target http:\/\/127\.0\.0\.1:4891/);
});

test("local detection snapshot and html expose safety rails and manual local tools", async () => {
  const statuses = await detectLocalEndpoints({
    fetchImpl: async (url: string | URL | Request) => {
      if (String(url).includes("8188")) return new Response("{}", { status: 200 });
      throw new Error("offline");
    },
  });
  const snapshot = localDetectionSnapshot(statuses, "2026-07-07T00:00:00.000Z");
  assert.equal(snapshot.schema, "vibetracker.local-detection/0.1");
  assert.equal(snapshot.summary.online, 1);
  assert.equal(snapshot.summary.total, 10);
  assert.equal(snapshot.summary.manualRails, 3);
  assert.equal(snapshot.summary.uploads, false);
  assert.equal(snapshot.summary.secretsRead, false);
  assert.equal(snapshot.summary.usageWrites, false);
  assert.equal(snapshot.manualRails.some((tool) => tool.id === "fooocus"), true);

  const html = renderLocalDetectionHtml(statuses, { generatedAt: "2026-07-07T00:00:00.000Z" });
  assert.match(html, /VTK:\/\/LOCAL-AI-RADAR/);
  assert.match(html, /Local tools stay local/);
  assert.match(html, /ComfyUI/);
  assert.match(html, /ONLINE 200/);
  assert.match(html, /Stable Diffusion WebUI Forge/);
  assert.match(html, /Diffusers local scripts/);
  assert.match(html, /no usage writes/);
  assert.match(html, /script-free HTML/);
  assert.doesNotMatch(html, /<script/i);
});

test("detect command writes a static local radar html report", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-detect-"));
  try {
    const out = join(dir, "local-radar.html");
    const stdout = execFileSync(process.execPath, ["bin/vibetracker.mjs", "detect", "--plain", "--html", "--out", out], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    assert.match(stdout, /local AI radar ->/);
    assert.match(stdout, /no usage writes, no uploads, no secret reads/);
    const html = readFileSync(out, "utf8");
    assert.match(html, /VibeTRACKER Local AI Radar/);
    assert.match(html, /Vibers Unite/);
    assert.doesNotMatch(html, /<script/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("detectOpenAICompatible checks /v1/models and renders proxy command", async () => {
  const status = await detectOpenAICompatible("http://127.0.0.1:1234", {
    provider: "lmstudio",
    fetchImpl: async (url: string | URL | Request) => {
      assert.equal(String(url), "http://127.0.0.1:1234/v1/models");
      return new Response("{}", { status: 401 });
    },
  });
  assert.equal(status.compatible, true);
  const rendered = renderOpenAICompatibleDetection(status);
  assert.match(rendered, /VTK:\/\/OPENAI-COMPATIBLE\/\/PROXY-RADAR/);
  assert.match(rendered, /READY/);
  assert.match(rendered, /\[LM\]/);
  assert.match(rendered, /Vibers Unite/);
  assert.match(rendered, /vibetracker proxy --provider lmstudio/);
});

test("detectOpenAICompatible accepts targets without a scheme", async () => {
  const status = await detectOpenAICompatible("localhost:1234", {
    fetchImpl: async (url: string | URL | Request) => {
      assert.equal(String(url), "http://localhost:1234/v1/models");
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(status.baseUrl, "http://localhost:1234");
  assert.equal(status.compatible, true);
});
