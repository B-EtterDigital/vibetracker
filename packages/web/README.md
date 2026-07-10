# @vibetracker/web — VibeUsage leaderboard

Next.js (App Router) leaderboard + profile site for VibeTRACKER. Read-only: it renders the
`leaderboard_verified` / `leaderboard_self_reported` Supabase views and per-handle profiles.
Uploads go through the Supabase **ingest edge function** (see `/supabase`), never the browser.

**Trust split is first-class:** Verified (backend-fetched) and Self-reported (CLI upload)
are separate boards, never mixed — the fix for viberank's unverified-submission flaw.

## Run locally
```bash
cp .env.example .env.local   # fill Supabase URL + anon key + INGEST_EDGE_URL
pnpm install && pnpm --dir packages/web dev
```
(Node ≥ 20. The pure display logic in `src/lib/leaderboard.ts` is unit-tested via `pnpm test:unit`.)

## Deploy to vibeusage.c0vibe.app
The site is a standalone deploy; the subdomain is attached via DNS on the `c0vibe.app` zone.

1. **Host** — deploy `packages/web` (Vercel: framework auto-detected; or Netlify with the
   Next runtime plugin). Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `INGEST_EDGE_URL`.
2. **Custom domain** — add `vibeusage.c0vibe.app` as a custom domain on the host.
3. **DNS** — on the `c0vibe.app` zone add a CNAME:
   `vibeusage  CNAME  <host-target>`  (Vercel: `cname.vercel-dns.com`; Netlify: your
   `<site>.netlify.app`). TLS is issued automatically.
4. **Backend** — `supabase db push` (schema) and `supabase functions deploy ingest`, then set
   `INGEST_EDGE_URL` to the deployed function URL so `vibeusage.c0vibe.app/api/ingest` works.

The CLI already defaults `vibetracker upload` to `https://vibeusage.c0vibe.app/api/ingest`.
