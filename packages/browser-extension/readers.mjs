// Page-read registry — the second retrieval lever, for sources whose real usage numbers live
// ONLY on a logged-in page and are reachable by no API and no adapter cookie (Midjourney lifetime
// images, Higgsfield credit balance, ChatGPT plan usage). A reader declares, per site, exactly
// which NUMBER to pull and what it means. It reads that one figure and nothing else — never prompt
// text, never conversation content, never the page beyond the declared stat. User-initiated,
// stored as low-confidence manual evidence, same honesty tier as the CLI's Midjourney import.
//
// Adding a source is ONE entry here + its host in manifest.json. The extractor runs a serializable
// spec (regex source strings, not live RegExp) so it can be injected into the page via
// chrome.scripting.executeScript.

export const READERS = [
  {
    id: "midjourney",
    label: "Midjourney",
    category: "image",
    hosts: ["midjourney.com", "www.midjourney.com"],
    // the /info panel and account page both print "Lifetime Usage: 3,982 images"
    stats: [
      { operation: "lifetime_images", unit: "image", patterns: ["Lifetime Usage[:\\s]*([\\d,]+)\\s*images?"] },
    ],
    hint: "Open Midjourney and run /info (or your account page) so the lifetime total is visible, then read it.",
  },
  {
    id: "higgsfield",
    label: "Higgsfield",
    category: "video",
    hosts: ["higgsfield.ai", "www.higgsfield.ai"],
    // account/credits surface shows a credit balance
    stats: [
      { operation: "credit_balance", unit: "credit", patterns: ["([\\d,]+(?:\\.\\d+)?)\\s*credits?\\b", "credits?[:\\s]*([\\d,]+(?:\\.\\d+)?)"] },
    ],
    hint: "Open your Higgsfield account/credits page so the balance is visible, then read it.",
  },
  {
    id: "openai-web",
    label: "ChatGPT",
    category: "llm",
    hosts: ["chatgpt.com", "chat.openai.com"],
    // the settings → usage panel shows message/request counts for the current window
    stats: [
      { operation: "plan_messages", unit: "request", patterns: ["([\\d,]+)\\s*(?:of|/)\\s*[\\d,]+\\s*messages?", "([\\d,]+)\\s*messages?\\b"] },
    ],
    hint: "Open ChatGPT Settings and the usage/limits panel so the message count is visible, then read it.",
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    category: "voice",
    hosts: ["elevenlabs.io"],
    stats: [
      { operation: "character_usage", unit: "credit", patterns: ["([\\d,]+)\\s*/\\s*[\\d,]+\\s*credits?", "([\\d,]+)\\s*characters?\\s*used"] },
    ],
    hint: "Open your ElevenLabs usage page so the character/credit count is visible, then read it.",
  },
  {
    id: "leonardo",
    label: "Leonardo.ai",
    category: "image",
    hosts: ["app.leonardo.ai", "leonardo.ai"],
    // web credit balance — the API adapter needs a key, so page-read is the no-key fallback
    stats: [
      { operation: "credit_balance", unit: "credit", patterns: ["([\\d,]+)\\s*(?:API\\s*)?(?:training\\s*)?tokens?\\b", "([\\d,]+)\\s*credits?\\b"] },
    ],
    hint: "Open your Leonardo account/subscription page so the token/credit balance is visible, then read it.",
  },
  {
    id: "runway",
    label: "Runway",
    category: "video",
    hosts: ["app.runwayml.com", "runwayml.com"],
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
    stats: [
      { operation: "pro_searches", unit: "request", patterns: ["([\\d,]+)\\s*(?:Pro\\s*)?searches?\\s*(?:used|remaining|left)", "([\\d,]+)\\s*/\\s*[\\d,]+\\s*searches?"] },
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
