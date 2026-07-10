import { test } from "node:test";
import assert from "node:assert/strict";
import { planSetup, runWizard, setupPlanSurpriseTargets } from "../wizard.ts";

const providers: any[] = [
  { id: "claude-code", label: "Claude Code", tier: "log", domain: "ai", status: "built" },
  { id: "higgsfield", label: "Higgsfield", tier: "ledger", domain: "ai", status: "built" },
  { id: "openai", label: "OpenAI", tier: "ledger", domain: "ai", status: "built" },
  { id: "replicate", label: "Replicate", tier: "ledger", domain: "ai", status: "built" },
  { id: "ollama", label: "Ollama", tier: "proxy", domain: "ai", status: "planned" },
  { id: "comfyui", label: "ComfyUI", tier: "local", domain: "ai", status: "built" },
  { id: "adobe-cc", label: "Adobe CC", tier: "manual", domain: "creative", status: "planned" },
];
const credFields = (id: string) => (["openai", "replicate"].includes(id) ? ["apiKey"] : []);

test("planSetup routes each provider to the right bucket", () => {
  const plan = planSetup({
    providers,
    hasEnvCreds: (id) => id === "replicate",     // a key already in env
    localLogsPresent: (id) => id === "claude-code" || id === "higgsfield",
    credFields,
  });
  assert.deepEqual(plan.autoEnv, ["replicate"]);
  assert.deepEqual(plan.autoLocal, ["claude-code", "higgsfield", "comfyui"]);
  assert.deepEqual(plan.needsKey.map((n) => n.id), ["openai"]);
  assert.deepEqual(plan.proxy, ["ollama"]);
  assert.deepEqual(plan.manual, ["adobe-cc"]);
});

test("setupPlanSurpriseTargets orders detected creator, builder, local, and hosted sources", () => {
  const plan = planSetup({
    providers,
    hasEnvCreds: (id) => id === "replicate",
    localLogsPresent: (id) => id === "claude-code" || id === "higgsfield",
    credFields,
  });

  assert.deepEqual(setupPlanSurpriseTargets(plan).slice(0, 5), [
    "higgsfield",
    "claude-code",
    "ollama",
    "comfyui",
    "replicate",
  ]);
});

test("runWizard auto-connects env+local and enables a prompted key", async () => {
  const plan = planSetup({
    providers,
    hasEnvCreds: (id) => id === "replicate",
    localLogsPresent: (id) => id === "claude-code" || id === "higgsfield",
    credFields,
  });
  let saved: any;
  const cfg = { enabled: ["claude-code"] };
  const answers = ["openai", "sk-openai-pasted"]; // 1) pick openai from the catalog, 2) paste its key
  let ai = 0;
  await runWizard(cfg as any, {
    plan,
    resolveEnv: (id) => (id === "replicate" ? { apiKey: "r8_env" } : {}),
    prompt: async () => answers[ai++] ?? "",
    log: () => {},
    save: (c) => { saved = c; },
  });
  assert.ok(saved.enabled.includes("replicate")); // env-auto
  assert.ok(saved.enabled.includes("higgsfield")); // authenticated local CLI-auto
  assert.ok(saved.enabled.includes("comfyui"));   // local-auto
  assert.ok(saved.enabled.includes("openai"));    // prompted
  assert.equal(saved.creds.replicate.apiKey, "r8_env");
  assert.equal(saved.creds.openai.apiKey, "sk-openai-pasted");
});
