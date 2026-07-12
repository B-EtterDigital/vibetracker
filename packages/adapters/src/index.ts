// @vibetracker/adapters barrel + the config→adapter factory the CLI uses to turn a
// provider id + credentials into a ready Adapter. Field names verified against each
// client.ts (not assumed). Missing credentials fail loudly (VTRS: never silent).

import type { Adapter } from "../../core/src/adapter.js";

import { createClaudeCodeAdapter } from "./claude-code/index.ts";
import { createCodexAdapter } from "./codex/index.ts";
import { createHiggsfieldAdapter, createCliClient as higgsfieldCli } from "./higgsfield/index.ts";
import { createOpenAIAdapter } from "./openai/index.ts";
import { createHttpClient as openaiHttp } from "./openai/client.ts";
import { createAnthropicAdapter } from "./anthropic/index.ts";
import { createHttpClient as anthropicHttp } from "./anthropic/client.ts";
import { createElevenLabsAdapter } from "./elevenlabs/index.ts";
import { createHttpClient as elevenHttp } from "./elevenlabs/client.ts";
import { createReplicateAdapter } from "./replicate/index.ts";
import { createHttpClient as replicateHttp } from "./replicate/client.ts";
import { createFalAdapter } from "./falai/index.ts";
import { createHttpClient as falHttp } from "./falai/client.ts";
import { createRunwayAdapter } from "./runway/index.ts";
import { createHttpClient as runwayHttp } from "./runway/client.ts";
import { createLumaAdapter } from "./luma/index.ts";
import { createHttpClient as lumaHttp } from "./luma/client.ts";
import { createKlingAdapter } from "./kling/index.ts";
import { createHttpClient as klingHttp } from "./kling/client.ts";
import { createSunoAdapter } from "./suno/index.ts";
import { createCookieClient as sunoCookie } from "./suno/client.ts";
import { createUdioAdapter } from "./udio/index.ts";
import { createSessionClient as udioSession } from "./udio/client.ts";
import { createOpenRouterAdapter } from "./openrouter/index.ts";
import { createHttpClient as openrouterHttp } from "./openrouter/client.ts";
import { createComfyUIAdapter } from "./comfyui/index.ts";
import { createHttpClient as comfyuiHttp } from "./comfyui/client.ts";
import { createHuggingFaceAdapter, createHttpClient as hfHttp } from "./huggingface/index.ts";
import { createRunPodAdapter, createHttpClient as runpodHttp } from "./runpod/index.ts";
import { createBrowserbaseAdapter, createHttpClient as bbHttp } from "./browserbase/index.ts";
import { createDevinAdapter, createHttpClient as devinHttp } from "./devin/index.ts";
import { createXaiAdapter, createHttpClient as xaiHttp } from "./xai/index.ts";
import { createZaiAdapter, createHttpClient as zaiHttp } from "./zai/index.ts";
import { createGlmAdapter, createHttpClient as glmHttp } from "./glm/index.ts";
import { createQwenAdapter, createHttpClient as qwenHttp } from "./qwen/index.ts";
import { createDoubaoAdapter, createHttpClient as doubaoHttp } from "./doubao/index.ts";
import { createKimiAdapter, createHttpClient as kimiHttp } from "./kimi/index.ts";
import { createMistralAdapter, createHttpClient as mistralHttp } from "./mistral/index.ts";
import { createPerplexityAdapter, createHttpClient as perplexityHttp } from "./perplexity/index.ts";
import { createAlephAlphaAdapter, createHttpClient as alephAlphaHttp } from "./aleph-alpha/index.ts";
import { createLightOnAdapter, createHttpClient as lightonHttp } from "./lighton/index.ts";
import { createAdobeFireflyAdapter, createHttpClient as fireflyHttp } from "./adobe-firefly/index.ts";
import { createAntigravityAdapter } from "./antigravity/index.ts";
import { createAugmentAdapter } from "./augment/index.ts";
import { createRooCodeAdapter } from "./roo-code/index.ts";

export * from "./registry.ts";

export interface ProviderCreds {
  apiKey?: string; adminKey?: string; token?: string; key?: string;
  accessKey?: string; secretKey?: string; sessionCookie?: string; sessionToken?: string;
}

function req(v: string | undefined, id: string, field: string): string {
  if (!v) throw new Error(`${id}: missing credential '${field}' — set it before sync`);
  return v;
}

function apiToken(creds: ProviderCreds, id: string): string {
  return req(creds.apiKey ?? creds.token, id, "apiKey/token");
}

/** Turn a provider id + credentials into a ready Adapter. Throws for unknown ids or
 *  missing creds. `opts` is passed through (e.g. creditUsd, maxFiles, maxPages). */
export function createAdapterFromConfig(id: string, creds: ProviderCreds = {}, opts: Record<string, unknown> = {}): Adapter {
  switch (id) {
    case "claude-code": return createClaudeCodeAdapter(opts);
    case "codex":       return createCodexAdapter(opts);
    case "higgsfield":  return createHiggsfieldAdapter(higgsfieldCli(), opts); // default: authenticated Higgsfield CLI; MCP transport available via createMcpClient
    case "openai":      return createOpenAIAdapter(openaiHttp({ adminKey: req(creds.adminKey, id, "adminKey") }), opts);
    case "anthropic":   return createAnthropicAdapter(anthropicHttp({ adminKey: req(creds.adminKey, id, "adminKey") }), opts);
    case "elevenlabs":  return createElevenLabsAdapter(elevenHttp({ apiKey: req(creds.apiKey, id, "apiKey") }), opts);
    case "replicate":   return createReplicateAdapter(replicateHttp({ token: req(creds.token, id, "token") }), opts);
    case "falai":       return createFalAdapter(falHttp({ key: req(creds.key, id, "key") }), opts);
    case "runway":      return createRunwayAdapter(runwayHttp({ apiKey: req(creds.apiKey, id, "apiKey") }), opts);
    case "luma":        return createLumaAdapter(lumaHttp({ apiKey: req(creds.apiKey, id, "apiKey") }), opts);
    case "kling":       return createKlingAdapter(klingHttp({ accessKey: req(creds.accessKey, id, "accessKey"), secretKey: req(creds.secretKey, id, "secretKey") }), opts);
    case "suno":        return createSunoAdapter(sunoCookie({ sessionCookie: req(creds.sessionCookie, id, "sessionCookie") }), opts);
    case "udio":        return createUdioAdapter(udioSession({ sessionToken: req(creds.sessionToken, id, "sessionToken") }), opts);
    case "openrouter":  return createOpenRouterAdapter(openrouterHttp({ apiKey: req(creds.apiKey, id, "apiKey") }), opts);
    case "comfyui":     return createComfyUIAdapter(comfyuiHttp({ baseUrl: creds.apiKey })); // apiKey slot = optional base URL
    case "huggingface": return createHuggingFaceAdapter(hfHttp({ apiKey: apiToken(creds, id) }));
    case "runpod":      return createRunPodAdapter(runpodHttp({ apiKey: apiToken(creds, id) }));
    case "browserbase": return createBrowserbaseAdapter(bbHttp({ apiKey: apiToken(creds, id) }));
    case "devin":       return createDevinAdapter(devinHttp({ apiKey: apiToken(creds, id) }));
    case "xai":         return createXaiAdapter(xaiHttp({ apiKey: apiToken(creds, id) }));
    case "zai":         return createZaiAdapter(zaiHttp({ apiKey: apiToken(creds, id) }));
    case "glm":         return createGlmAdapter(glmHttp({ apiKey: apiToken(creds, id) }));
    case "qwen":        return createQwenAdapter(qwenHttp({ apiKey: apiToken(creds, id) }));
    case "doubao":      return createDoubaoAdapter(doubaoHttp({ apiKey: apiToken(creds, id) }));
    case "kimi":        return createKimiAdapter(kimiHttp({ apiKey: apiToken(creds, id) }));
    case "mistral":     return createMistralAdapter(mistralHttp({ apiKey: apiToken(creds, id) }));
    case "perplexity":  return createPerplexityAdapter(perplexityHttp({ apiKey: apiToken(creds, id) }));
    case "aleph-alpha": return createAlephAlphaAdapter(alephAlphaHttp({ apiKey: apiToken(creds, id) }));
    case "lighton":     return createLightOnAdapter(lightonHttp({ apiKey: apiToken(creds, id) }));
    case "adobe-firefly": return createAdobeFireflyAdapter(fireflyHttp({ apiKey: apiToken(creds, id), token: creds.token }));
    case "antigravity": return createAntigravityAdapter(opts as { dir?: string; maxFiles?: number });
    case "augment":     return createAugmentAdapter(opts as { dir?: string; maxFiles?: number });
    case "roo-code":    return createRooCodeAdapter(opts as { dir?: string; maxFiles?: number });
    default: throw new Error(`unknown provider: ${id}`);
  }
}
