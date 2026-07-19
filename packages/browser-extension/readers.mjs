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
    url: "https://www.midjourney.com/account",
    autoOpen: false, // lifetime total is a Discord /info stat — auto-opening the web page would just report a miss
    // Midjourney prints "Lifetime Usage: 3,982 images" via the Discord /info command; some account
    // pages echo a "Lifetime" total. Match those anchored phrasings only — never a bare "N images",
    // which would grab an unrelated gallery/explore count.
    stats: [
      { operation: "lifetime_images", unit: "image", patterns: [
        "Lifetime Usage[:\\s]*([\\d,]+)\\s*images?",
        "Lifetime\\s+Images?[:\\s]*([\\d,]+)",
        "Lifetime[^\\d]{0,20}([\\d,]+)\\s*images?",
        "([\\d,]+)\\s*images?\\s*generated\\s*(?:in\\s*total|all[\\s-]*time|lifetime)",
      ] },
    ],
    hint: "Midjourney shows this via /info in Discord — the web account page usually doesn't. If a 'Lifetime' image total is visible on the page, read it; otherwise run: vibetracker import midjourney --images <number from /info>.",
  },
  {
    id: "higgsfield",
    label: "Higgsfield",
    category: "video",
    hosts: ["higgsfield.ai", "www.higgsfield.ai"],
    url: "https://higgsfield.ai/account", // the page that shows the usage number
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
    url: "https://chatgpt.com", // the page that shows the usage number
    autoOpen: false, // Plus/Free show no usage number on the web — auto-opening would just report a miss
    // the settings → usage panel shows message/request counts for the current window
    stats: [
      { operation: "plan_messages", unit: "request", patterns: ["([\\d,]+)\\s*(?:of|/)\\s*[\\d,]+\\s*messages?", "([\\d,]+)\\s*messages?\\b"] },
    ],
    hint: "ChatGPT Plus/Free show no usage number on the web — only readable if a Team/Enterprise limits count is visible.",
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    category: "voice",
    hosts: ["elevenlabs.io"],
    url: "https://elevenlabs.io/app/usage", // the page that shows the usage number
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
    url: "https://app.leonardo.ai/account", // the page that shows the usage number
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
