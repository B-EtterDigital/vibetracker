// Build stamp for the popup ↔ service-worker handshake. Chrome serves popup files live from disk,
// but the background service worker keeps running the OLD code until the extension is reloaded —
// so after any rebuild the two silently drift (new popup sends a message the old worker doesn't
// know → undefined replies → "nothing found"). The popup compares its own build against the
// worker's and triggers chrome.runtime.reload() on mismatch. MUST equal manifest.json "version"
// (locked by a test).
export const BRIDGE_BUILD = "0.7.10";

// Candidate ports the local bridge may bind, in preference order. The CLI binds the first FREE
// one; the extension probes for the first that answers /health. This makes a port collision (a
// user's other service already on 8765 — watchdog_bd, etc.) self-heal instead of dead-ending.
// MUST stay in sync with BRIDGE_PORTS in packages/cli/src/api-server.ts.
export const CANDIDATE_PORTS = [8799, 8765, 8787, 8123];
export const pathUrl = (port, path) => `http://127.0.0.1:${port}${path}`;

// Default endpoints (first candidate) — used as the fallback before/without live discovery and by
// tests. Live traffic in the extension goes through the resolved port (see background.js).
export const CAPTURE_ENDPOINT = pathUrl(CANDIDATE_PORTS[0], "/capture");
export const CONNECT_ENDPOINT = pathUrl(CANDIDATE_PORTS[0], "/connect");
export const HEALTH_ENDPOINT = pathUrl(CANDIDATE_PORTS[0], "/health");

// Real brand logos packaged with the extension (mirrors the site's provider-logos approach:
// bone-recoloured SVG glyphs where a public SVG exists, original-colour favicons otherwise).
// Sources without a shipped asset fall back to their two-letter gradient monogram.
export const PROVIDER_LOGOS = {
  "suno": "icons/providers/suno.svg",
  "udio": "icons/providers/udio.png",
  "seaart": "icons/providers/seaart.png",
  "tensorart": "icons/providers/tensorart.png",
  "pixverse": "icons/providers/pixverse.png",
  "vidu": "icons/providers/vidu.png",
  "midjourney": "icons/providers/midjourney.png",
  "higgsfield": "icons/providers/higgsfield.png",
  "openai": "icons/providers/openai.svg",
  "elevenlabs": "icons/providers/elevenlabs.svg",
  "leonardo": "icons/providers/leonardo.png",
  "runway": "icons/providers/runway.svg",
  "perplexity": "icons/providers/perplexity.svg",
  "cynaps3": "icons/providers/cynaps3.png",
};

// Resolve a provider/connector/reader id to its packaged logo, tolerating the "-web" suffix the
// capture-preview provider ids carry (openai-web → openai). Null = render the monogram fallback.
export function logoFor(id) {
  const key = String(id || "").toLowerCase();
  return PROVIDER_LOGOS[key] ?? PROVIDER_LOGOS[key.replace(/-web$/, "")] ?? null;
}

// Human line for a page-read usage snapshot — the number and unit, never any page content.
export function statusForRead(response) {
  if (response?.ok) {
    return {
      state: "ok",
      label: `${response.label || response.provider || "usage"} read`,
      detail: `Recorded ${Number(response.value).toLocaleString("en-US")} ${response.unit}${response.value === 1 ? "" : "s"} as local usage. Run \`vibetracker sync\` then upload.`,
    };
  }
  const status = response?.status || "offline";
  return {
    state: "error",
    label: `read failed${response?.status ? ` (${status})` : ""}`,
    detail: response?.error || "Run: vibetracker start",
  };
}

// A human line describing what a successful connect did — no credential value, names only.
export function statusForConnect(response) {
  if (response?.ok) {
    const fields = Array.isArray(response.captured) ? response.captured.length : 0;
    return {
      state: "ok",
      label: `${response.label || response.provider || "source"} connected`,
      detail: response.pending
        ? `Session saved to your OS keyring. This source's importer is still landing — it will sync once ready.`
        : `Session saved to your OS keyring (${fields} secret${fields === 1 ? "" : "s"}). Run \`vibetracker sync\` to pull it.`,
    };
  }
  const status = response?.status || "offline";
  return {
    state: "error",
    label: `connect failed${response?.status ? ` (${status})` : ""}`,
    detail: response?.error || "Run: vibetracker start",
  };
}

const PROVIDERS = [
  { id: "openai-web", label: "ChatGPT", mark: "OA", category: "llm", from: "#10a37f", to: "#6ee7c8", hosts: /chatgpt|openai/ },
  { id: "anthropic-web", label: "Claude", mark: "CL", category: "llm", from: "#d97757", to: "#f2b16b", hosts: /claude|anthropic/ },
  { id: "perplexity-web", label: "Perplexity", mark: "PX", category: "llm", from: "#20b8cd", to: "#104e64", hosts: /perplexity/ },
  { id: "poe-web", label: "Poe", mark: "PO", category: "llm", from: "#5b5ff0", to: "#ff7ad9", hosts: /poe/ },
  { id: "higgsfield-web", label: "Higgsfield", mark: "HF", category: "video", from: "#ff4fd8", to: "#7c5cff", hosts: /higgsfield/ },
  { id: "midjourney-web", label: "Midjourney", mark: "MJ", category: "image", from: "#111827", to: "#a78bfa", hosts: /midjourney/ },
  { id: "canva-web", label: "Canva", mark: "CA", category: "image", from: "#00c4cc", to: "#7d2ae8", hosts: /canva/ },
  { id: "firefly-web", label: "Adobe Firefly", mark: "FF", category: "image", from: "#ff0000", to: "#ffb000", hosts: /firefly|adobe/ },
  { id: "runway-web", label: "Runway", mark: "RW", category: "video", from: "#00d084", to: "#0a84ff", hosts: /runway/ },
  { id: "luma-web", label: "Luma", mark: "LU", category: "video", from: "#8b5cf6", to: "#22d3ee", hosts: /luma/ },
  { id: "kling-web", label: "Kling", mark: "KL", category: "video", from: "#2f7bff", to: "#ff4d8d", hosts: /kling/ },
  { id: "suno-web", label: "Suno", mark: "SU", category: "music", from: "#ff7a1a", to: "#ffd36a", hosts: /suno/ },
  { id: "udio-web", label: "Udio", mark: "UD", category: "music", from: "#7768ff", to: "#f062c0", hosts: /udio/ },
  { id: "elevenlabs-web", label: "ElevenLabs", mark: "11", category: "audio", from: "#ffffff", to: "#9ca3af", hosts: /elevenlabs/ },
  { id: "replicate-web", label: "Replicate", mark: "RP", category: "video", from: "#111111", to: "#8b8b8b", hosts: /replicate/ },
];

const FALLBACK = { id: "ai-web", label: "AI web tool", mark: "AI", category: "llm", from: "#2ee8d6", to: "#36e39b" };

function hostname(url) {
  try {
    return new URL(url || "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function inferProvider(url) {
  const host = hostname(url);
  const provider = PROVIDERS.find((candidate) => candidate.hosts.test(host)) ?? FALLBACK;
  return { ...provider, host };
}

export function buildCapturePayload(tab, now = new Date()) {
  if (!tab?.url) throw new Error("no active tab URL");
  const provider = inferProvider(tab.url);
  return {
    url: tab.url,
    title: tab.title || provider.label,
    category: provider.category,
    operation: "browser_capture",
    quantity: 1,
    unit: "request",
    rawAmount: 1,
    rawUnit: "request",
    ts: now.toISOString(),
  };
}

export function previewForTab(tab) {
  if (!tab?.url) {
    return {
      ...FALLBACK,
      host: "no active tab",
      title: "No active tab",
      ready: false,
      lines: ["VTRK://BROWSER-CAPTURE", "no active tab URL", "start local API first"],
    };
  }
  const provider = inferProvider(tab.url);
  return {
    ...provider,
    title: tab.title || provider.label,
    ready: true,
    lines: [
      "VTRK://BROWSER-CAPTURE",
      `${provider.mark} ${provider.label}`,
      `${provider.category} // local low-confidence`,
      "no prompt text // no page scrape",
    ],
  };
}

export function statusForCapture(response) {
  if (response?.ok) {
    return {
      state: "ok",
      label: "captured locally",
      detail: "Saved to the local VibeTRACKER ledger as low-confidence browser evidence.",
    };
  }
  const status = response?.status || "offline";
  return {
    state: "error",
    label: `capture failed (${status})`,
    detail: response?.error || "Run: vibetracker start",
  };
}
