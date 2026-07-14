import "./globals.css";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { AccountControl } from "../components/account-control";

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
            <details className="hdr-menu">
              <summary aria-label="Open product menu" title="Product menu">
                <i aria-hidden="true"><span /><span /><span /></i>
              </summary>
              <nav aria-label="Product menu">
                <a href="/u/demo"><span>01</span><b>Profile<small>usage, disciplines, models, rhythm</small></b></a>
                <a href="/life"><span>02</span><b>AI Life<small>your whole AI practice</small></b></a>
                <a href="/compare"><span>03</span><b>Compare lab<small>two public receipts on one scope</small></b></a>
                <a href="/score"><span>04</span><b>Score lab<small>how the signal score is built</small></b></a>
                <a href="/proof"><span>05</span><b>Proof center<small>what is verified vs self-reported</small></b></a>
                <a href="/scan"><span>06</span><b>Scan<small>run a local usage scan</small></b></a>
                <a href="/wizard"><span>07</span><b>Wizard<small>set up tracking step by step</small></b></a>
                <a href="/sources"><span>08</span><b>Source atlas<small>every source lane, mapped</small></b></a>
                <a href="/motion"><span>09</span><b>Motion lab<small>the ASCII motion references</small></b></a>
                <a href="/contributors"><span>10</span><b>Contributors<small>open-source credit</small></b></a>
                <a href="/passkeys"><span>11</span><b>Passkeys<small>account keys</small></b></a>
                <a href="/roadmap"><span>12</span><b>Roadmap<small>what ships next</small></b></a>
                <a href="/account"><span>13</span><b>Identity<small>GitHub proof and account link</small></b></a>
              </nav>
            </details>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="ftr">vibeusage.c0vibe.app · powered by <code>npx vibetracker</code></footer>
      </body>
    </html>
  );
}
