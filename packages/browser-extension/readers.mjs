// Page-read registry — the second retrieval lever, for sources whose real usage numbers live
// ONLY on a logged-in page and are reachable by no API and no adapter cookie.
// Removed 2026-07-19 (user rule: only sources that EXPOSE a number over the web belong here):
// midjourney (Discord-only /info — CLI `import midjourney` covers it), openai-web (Plus/Free
// publish no counts), higgsfield (root page shows no figure; the MCP/CLI adapter syncs it). A reader declares, per site, exactly
// which NUMBER to pull and what it means. It reads that one figure and nothing else — never prompt
// text, never conversation content, never the page beyond the declared stat. User-initiated,
// stored as low-confidence manual evidence, same honesty tier as the CLI's Midjourney import.
//
// Adding a source is ONE entry here + its host in manifest.json. The extractor runs a serializable
// spec (regex source strings, not live RegExp) so it can be injected into the page via
// chrome.scripting.executeScript.

export const READERS = [
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    category: "voice",
    hosts: ["elevenlabs.io"],
    url: "https://elevenlabs.io/app/usage", // the page that shows the usage number
    // broadened 2026-07-19 (live sweep: "credit" present but no pattern matched): also accept
    // bare "N credits" and "credits: N" phrasings.
    stats: [
      { operation: "character_usage", unit: "credit", keywords: ["credit", "character"], patterns: [
        "([\\d,]+(?:\\.\\d+)?)\\s*(?:/|of)\\s*[\\d,]+(?:\\.\\d+)?\\s*credits?",
        "([\\d,]+(?:\\.\\d+)?)\\s*characters?\\s*used",
        "([\\d,]+(?:\\.\\d+)?)\\s*credits?\\s*(?:remaining|left|used)?\\b",
        "credits?(?:\\s+(?:remaining|left|used))?[:\\s]+([\\d,]+(?:\\.\\d+)?)",
      ] },
    ],
    hint: "Open your ElevenLabs usage page so the character/credit count is visible, then read it.",
  },
  {
    id: "leonardo",
    label: "Leonardo.ai",
    category: "image",
    hosts: ["app.leonardo.ai", "leonardo.ai"],
    url: "https://app.leonardo.ai", // app root — /account 404s; the app header shows the token balance
    // web credit balance — the API adapter needs a key, so page-read is the no-key fallback
    stats: [
      { operation: "credit_balance", unit: "credit", keywords: ["token", "credit"], patterns: ["([\\d,]+(?:\\.\\d+)?)\\s*(?:API\\s*)?(?:training\\s*)?tokens?\\b", "tokens?[:\\s]+([\\d,]+(?:\\.\\d+)?)", "([\\d,]+(?:\\.\\d+)?)\\s*credits?\\b"] },
    ],
    hint: "Open your Leonardo account/subscription page so the token/credit balance is visible, then read it.",
  },
  {
    id: "runway",
    label: "Runway",
    category: "video",
    hosts: ["app.runwayml.com", "runwayml.com"],
    url: "https://app.runwayml.com/account", // the page that shows the usage number
    stats: [
      { operation: "credit_balance", unit: "credit", patterns: ["([\\d,]+)\\s*credits?\\b", "credits?[:\\s]*([\\d,]+)"] },
    ],
    hint: "Open your Runway account/credits page so the balance is visible, then read it.",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    category: "llm",
    hosts: ["perplexity.ai", "www.perplexity.ai"],
    url: "https://www.perplexity.ai/settings/account", // the page that shows the usage number
    stats: [
      { operation: "pro_searches", unit: "request", keywords: ["search", "request"], patterns: ["([\\d,]+)\\s*(?:Pro\\s*)?searches?\\s*(?:used|remaining|left)", "([\\d,]+)\\s*/\\s*[\\d,]+\\s*searches?", "searches?[:\\s]+([\\d,]+)"] },
    ],
    hint: "Open Perplexity Settings so the Pro-search count is visible, then read it.",
  },
];

function normalizeHost(host) {
  return String(host || "").replace(/^www\./, "").toLowerCase();
}

export function readerForUrl(url) {
  let host = "";
  try {
    host = normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
  return READERS.find((r) => r.hosts.some((h) => normalizeHost(h) === host)) || null;
}

export function readerHosts() {
  return [...new Set(READERS.flatMap((r) => r.hosts))];
}

// Pure, testable: given the page's visible text and a reader spec, pull the first stat that
// matches. Returns { operation, unit, value } or null. Commas are stripped from the captured
// number. This is exactly what runs in the page — kept here so tests exercise the real logic.
export function extractStat(pageText, reader) {
  const text = String(pageText || "");
  for (const stat of reader.stats) {
    for (const source of stat.patterns) {
      const match = new RegExp(source, "i").exec(text);
      if (match && match[1]) {
        const value = Number(match[1].replace(/,/g, ""));
        if (Number.isFinite(value) && value >= 0) {
          return { operation: stat.operation, unit: stat.unit, value };
        }
      }
    }
  }
  return null;
}
