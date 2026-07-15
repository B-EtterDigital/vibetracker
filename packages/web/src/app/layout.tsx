import "./globals.css";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { AccountControl } from "../components/account-control";
import { OperatorMenu } from "../components/operator-menu";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dataFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
});

export const metadata = {
  title: "VibeUsage — the universal AI-spend leaderboard",
  description: "Who spends the most on AI? Coding, image, video, music, audio, 3D, local models, and global providers — one board. Powered by VibeTRACKER.",
  metadataBase: new URL("https://vibeusage.c0vibe.app"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${dataFont.variable}`}>
      <body>
        <header className="hdr">
          <a href="/" className="brand" aria-label="VibeUsage home">
            <img
              src="/brand/vibeusage-logo.png"
              alt="VibeUsage"
              width="1400"
              height="299"
            />
          </a>
          {/* Primary destinations, each named for what it is. The board lives at "/" and is now
              called what it is — Leaderboard — instead of being split into two unexplained
              tier words ("Verified" / "Self-reported"), which are the two boards ON that page.
              Everything else moves into the product menu, where a label can carry a sentence. */}
          <nav className="hdr-primary" aria-label="Primary navigation">
            <a href="/" title="The public boards: who tracks the most AI usage">Leaderboard</a>
            <a href="/compare" title="Compare two real public usage receipts without mixing evidence tiers">Compare</a>
            <a href="/providers" title="Every AI source VibeTRACKER can track, and its status">Sources</a>
            <a href="/insights" title="What the tracked data says across all AI work, not just coding">Insights</a>
          </nav>
          <div className="hdr-actions">
            <AccountControl />
            <a className="hdr-cli" href="/how-to">Get the CLI</a>
            <OperatorMenu />
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="ftr">vibeusage.c0vibe.app · powered by <code>npx vibetracker</code></footer>
      </body>
    </html>
  );
}
