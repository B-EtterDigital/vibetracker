# VibeTRACKER Browser Extension

Two jobs, both local-only:

1. **One-click Connect** — for AI sources that have no usage API and can only be read from your
   logged-in browser session (Suno, Udio; SeaArt, Tensor.Art, PixVerse, Vidu, Haiper as their
   importers land). Open the site, log in, click the extension → **Connect <site>**. It reads only
   that site's session cookie and hands it to the local CLI, which writes it to your OS keyring.
   The cookie value is never shown, never logged, and never sent anywhere but `127.0.0.1:8765`.
   New sources are one entry in `connectors.mjs` + one host line in `manifest.json`.
2. **Manual Capture** — mark any AI web tab as low-confidence local usage evidence (no scraping).

Security model: the `cookies` permission is scoped to the exact `host_permissions` hosts; the local
`/connect` route only accepts an allowlisted provider + its allowlisted field names from a
`chrome-extension://` origin, and logs the field NAMES only.

This unpacked extension captures explicit user-marked AI activity from hosted web tools
and sends it to the local VibeTRACKER capture endpoint.

1. Run the local API:

   ```bash
   vibetracker api serve --port 8765
   ```

2. Load this folder as an unpacked extension in Chrome/Edge.
3. Open ChatGPT, Claude, Perplexity, Poe, Midjourney, Canva, or another AI web tool.
4. Click the extension and press **Capture active tab**.

The popup shows a terminal-style local capture cockpit before sending anything:

- provider-branded active-tab preview for common AI tools,
- explicit local API status (`127.0.0.1:8765/capture`),
- low-confidence/manual evidence labels,
- privacy boundary: URL, title, and category only; no prompt text or page scraping.

Captured rows are local, low-confidence, manual-source records. They are labelled
self-reported and never become verified provider usage unless a backend/provider fetch
proves them later.
