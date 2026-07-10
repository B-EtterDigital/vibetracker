# VibeTRACKER Browser Extension

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
