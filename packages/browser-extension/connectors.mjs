// Connector registry — the single source of truth for one-click credential retrieval. Each entry
// says: which site the tab must be on, which cookie(s) to read, and which CLI credential field each
// cookie fills. Adding a new cookie-auth source is ONE entry here (+ its host in the manifest) —
// no other extension code changes. Kept as plain data so background.js, popup.js, and the tests
// all read the same list.
//
// Security contract: the extension only ever reads the named cookies for the site the user is
// actively on, and hands them straight to the local CLI (127.0.0.1) which writes them to the OS
// keyring. Cookie values are never logged, never shown in the UI, never sent anywhere else.

export const CONNECTORS = [
  {
    id: "suno",
    label: "Suno",
    category: "music",
    brand: { from: "#ff7b3d", to: "#ffb347", ink: "#1a0d00" },
    // suno.com stores its session as the `__session` cookie
    hosts: ["suno.com", "www.suno.com"],
    url: "https://suno.com", // page to open for one-click connect (any page works once logged in)
    cookies: [{ name: "__session", field: "sessionCookie", match: "exact" }],
  },
  {
    id: "udio",
    label: "Udio",
    category: "music",
    brand: { from: "#8b5cf6", to: "#d946ef", ink: "#12001f" },
    // Udio uses a Supabase auth cookie whose name is `sb-<ref>-auth-token`
    hosts: ["udio.com", "www.udio.com"],
    url: "https://www.udio.com", // page to open for one-click connect (any page works once logged in)
    cookies: [{ name: "sb-", field: "sessionToken", match: "prefix", suffix: "-auth-token" }],
  },
  {
    id: "seaart",
    label: "SeaArt",
    category: "image",
    brand: { from: "#2dd4bf", to: "#3b82f6", ink: "#001014" },
    hosts: ["seaart.ai", "www.seaart.ai"],
    url: "https://www.seaart.ai", // page to open for one-click connect (any page works once logged in)
    cookies: [{ name: "T", field: "sessionToken", match: "exact" }],
    pending: true, // adapter not built yet; cookie is stored for when it lands
  },
  {
    id: "tensorart",
    label: "Tensor.Art",
    category: "image",
    brand: { from: "#f59e0b", to: "#ef4444", ink: "#1a0800" },
    hosts: ["tensor.art", "www.tensor.art"],
    url: "https://tensor.art", // page to open for one-click connect (any page works once logged in)
    // verified from a live sweep report 2026-07-19: the session cookie is ta_token_prod
    cookies: [{ name: "ta_token_prod", field: "sessionToken", match: "exact" }],
    pending: true,
  },
  {
    id: "pixverse",
    label: "PixVerse",
    category: "video",
    brand: { from: "#a855f7", to: "#6366f1", ink: "#0d0020" },
    hosts: ["pixverse.ai", "app.pixverse.ai"],
    url: "https://app.pixverse.ai", // page to open for one-click connect (any page works once logged in)
    cookies: [{ name: "token", field: "sessionToken", match: "exact" }],
    pending: true,
  },
  {
    id: "vidu",
    label: "Vidu",
    category: "video",
    brand: { from: "#22d3ee", to: "#0ea5e9", ink: "#001420" },
    hosts: ["vidu.com", "www.vidu.com", "vidu.studio"],
    url: "https://www.vidu.com", // page to open for one-click connect (any page works once logged in)
    cookies: [{ name: "JWT-TOKEN", field: "sessionToken", match: "exact" }],
    pending: true,
  },
  // haiper was removed 2026-07-19: haiper.ai serves a blank page (service appears shut down).
  // Re-add with verified hosts + cookie shape if it comes back.
];

// The exact origins the extension is allowed to read cookies from — mirrors the manifest's
// host_permissions. Any host not in this set is refused before a cookie is ever read.
export function connectorHosts() {
  return [...new Set(CONNECTORS.flatMap((c) => c.hosts))];
}

function normalizeHost(host) {
  return String(host || "").replace(/^www\./, "").toLowerCase();
}

// Find the connector whose site matches a tab URL — used to light up "Connect this site".
export function connectorForUrl(url) {
  let host = "";
  try {
    host = normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
  return CONNECTORS.find((c) => c.hosts.some((h) => normalizeHost(h) === host)) || null;
}

// Decide whether a browser cookie satisfies a connector's cookie spec (exact or prefix+suffix).
export function cookieMatchesSpec(cookieName, spec) {
  if (spec.match === "prefix") {
    return cookieName.startsWith(spec.name) && (!spec.suffix || cookieName.endsWith(spec.suffix));
  }
  return cookieName === spec.name;
}
