import "./globals.css";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

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
            <i aria-hidden="true" />
            <span>Vibe</span><strong>Usage</strong>
          </a>
          <nav className="hdr-primary" aria-label="Primary navigation">
            <a href="/#verified">Verified</a>
            <a href="/#self">Self-reported</a>
            <a href="/providers">Providers</a>
            <a href="/insights">Insights</a>
            <a href="/life">AI Life</a>
            <a href="/u/demo">Profile</a>
          </nav>
          <div className="hdr-actions">
            <a className="hdr-cli" href="/how-to">Get the CLI</a>
            <details className="hdr-menu">
              <summary aria-label="Open product menu" title="Product menu">
                <i aria-hidden="true"><span /><span /><span /></i>
              </summary>
              <nav aria-label="Product menu">
                <a href="/sources"><span>01</span>Sources</a>
                <a href="/scan"><span>02</span>Scan</a>
                <a href="/proof"><span>03</span>Proof center</a>
                <a href="/score"><span>04</span>Score lab</a>
                <a href="/wizard"><span>05</span>Wizard</a>
                <a href="/motion"><span>06</span>Motion lab</a>
                <a href="/contributors"><span>07</span>Contributors</a>
                <a href="/passkeys"><span>08</span>Passkeys</a>
                <a href="/roadmap"><span>09</span>Roadmap</a>
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
