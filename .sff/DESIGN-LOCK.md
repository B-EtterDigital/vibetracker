# DESIGN-LOCK - VibeTRACKER (SFF v1, 2026-07-06)

Direction: calm instrument dashboard (amended 2026-07-10 on explicit user order: "stunning, not overwhelming"). Viberank-derived data cards, one hero chart per surface, honest labeled metrics, terminal soul kept in type and labels only. Theatre panels are encore-only behind an explicit disclosure, never the default surface. Results reveal adaptively: panel depth follows the complexity of the viewer's own data across five hardened signal tiers (ember / spark / current / surge / supernova; Supernova is top-percentile at 85+, never a default finish line). ## LOCKED
Prior direction (2026-07-06 "terminal-grade operator console with branded provider theatre") is superseded; local-first proof rails and no-confetti motion remain binding.

Tournament: selected "inline terminal command center" over "glossy SaaS bento" and "plain leaderboard shell" because VibeTRACKER needs to feel like a serious scanner first and a public profile second.

Signature interaction: scan surprise reel. Queue, scan, checkpoint, and relay gates reveal small branded ASCII/Unicode encores such as the Higgsfield prism turn, Codex diff cube, local sonar bloom, and C0VIBE unite flash. ## LOCKED

Fonts: display ui-monospace stack / body system sans. The monospace is intentional because the product's first surface is CLI plus GUI terminal. ## LOCKED

Palette: bg #040607, panel #0d1419, accent #2ee8d6, verified #36e39b, self #ffc64d, err #ff7768, violet #9f7cff, pink #ff4fd8. Provider surfaces derive color from `providerBrand`. ## LOCKED

Layout primitive / signature: full-width terminal panels, scan rooms, theatre grids, heatgrid/profile proof surfaces, and compact bordered command rails. Cards are individual data units only, never nested page sections. ## LOCKED

Profile identity surface (added 2026-07-13, adapted from the C0LINK public profile): every `/u/<handle>` opens on a hero panel — glow sigil carrying the signal-tier badge, oversized monospace handle, identity + tier line, a bio written from the viber's own numbers, the FULL discipline set as coloured pills, a compact viber-state rail (signal / operations / top source / top model), and the two C0VIBE doors. The hero wash and sigil take the viber's OWN top-discipline colour: signal, never decoration. An all-rounder is shown as every discipline they create in, never collapsed to "generalist". Files: `profile-hero.tsx`, `profile-cta.tsx`, `profile-hero.css`. ## LOCKED

Sync rhythm (rebuilt 2026-07-13): the profile calendar follows GitHub's contribution-graph geometry — 53 week columns × 7 weekday rows, Sunday-first, month labels over the week each month opens in, four levels cut at QUARTILES of the active days (never a linear share of the max, which buries a normal day under one outlier), a day readout, and a Less→More legend. It is keyed on DAILY SPEND because that is the only signal held for every day of the history; operation counts exist only for days whose agent logs survive, so they ride in the readout and never colour a cell. A cell is never coloured from a number that had to be invented. ## LOCKED

Delta Scope (added 2026-07-14): the profile's compact period instrument compares adjacent, non-overlapping 7/30/90-day windows across spend, operations, or credits. It is always calculated from the same real daily aggregates and provider series as the main usage chart, fills absent dates with zero, sanitizes invalid quantities, and never reads trust, GitHub, creator, prompt, or output data. The signature is a paired signal comb: current mint beside previous amber, followed by exact current/prior totals, velocity, active days, peak, and lead source. It is a full-width instrument rail, not a second hero chart or nested card. Files: `profile-telemetry.tsx`, `profile-telemetry-model.ts`, `profile-telemetry.css`. ## LOCKED

C0VIBE band branding: the claim lane wears real C0VIBE identity — the C0:VIBE mark, the brand starfield (`/brand/c0vibe-starfield.webp`, rendered from the brand's own OG art palette), the teal→orange→yellow brand seam, and the brand gradient on the join button. This is the one surface where C0VIBE's palette overrides the VibeUsage accent, because it is C0VIBE's door. ## LOCKED

Header: four named destinations — Leaderboard (/), Profile, Sources, Insights — each carrying a title that says what it is. The board is called Leaderboard, not split into the tier words "Verified"/"Self-reported" (those are the two boards ON it). Secondary routes live in the product menu, each with a one-line description. ## LOCKED

C0VIBE doors: a profile always offers "Join C0VIBE — free" (c0vibe.app) and, while the board is self-reported, "Migrate this profile" (/cli-login device auth). Migration copy states what it actually does — future syncs upload as ATTESTED, a real identity owns the handle — and never implies the numbers become provider-verified. ## LOCKED

Motion language: scanline sweeps, meter fills, turntable frames, braille/globe texture, and provider pulse marks. Motion uses transform/opacity, respects reduced motion, and must always label whether a signal is usage, trust, local-only, privacy, or publish.

Open-source motion references: cli-spinners for terminal frame timing, ascii-globe for global source-field inspiration, drawille/node-drawille for Unicode braille signal texture. Credit remains visible in the ASCII Motion Lab.

Opted-in exceptions to blacklist: monospace-heavy UI is approved because the product is a CLI-first tracker; dark terminal panels are approved because the user explicitly wants nerdy terminal charm inside the GUI.

Do-not-do: do not add confetti, generic purple-blue hero gradients, fake provider proof, unlabeled trust metrics, nested cards, decorative blobs, or social/coding signals that change usage totals.

Verified: production build and temporary production-server Playwright proof passed on 2026-07-14 at 390x844, 1440x1200, and 3840x2160. The profile has no horizontal overflow at any tested viewport; Delta Scope controls, readouts, signal comb, and accessible comparison summary were exercised without console or dynamic-request errors. No development server was started.
