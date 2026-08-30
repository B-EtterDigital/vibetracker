import type { Metadata } from "next";
import { AccountConsole } from "./account-console";
import "./account.css";

export const metadata: Metadata = {
  title: "VibeUsage account · GitHub + C0VIBE",
  description: "Use WorkOS for the C0VIBE session and GitHub for immutable VibeTRACKER ownership, linked without email matching.",
};

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="account-hero" aria-labelledby="account-title">
        <div className="account-hero__copy">
          <p className="eyebrow">Identity control room</p>
          <h1 id="account-title">Sign in with GitHub. Keep your usage history.</h1>
          <p>Use WorkOS for your C0VIBE session and GitHub for the immutable identity that owns usage. A one-time claim links their IDs without matching email, copying credentials, or moving usage.</p>
          <div className="account-hero__rails" aria-label="Identity guarantees">
            <span>WorkOS session</span><span>GitHub identity</span><span>no email join</span><span>linked history</span>
          </div>
        </div>
        <div className="account-hero__terminal" aria-label="GitHub identity migration terminal">
          <div className="console-top"><span>identity@vibeusage</span><b>ZERO USAGE MOVEMENT</b></div>
          <pre>{[
            "+--------------------------------------------------+",
            "| VTRK://GITHUB-PROOF//ADAPTIVE-ACCOUNT           |",
            "|--------------------------------------------------|",
            "| github id       immutable identity anchor        |",
            "| auth channel    browser session or existing CLI  |",
            "| blue check      identity only, NOT usage truth    |",
            "| cli history     linked after identity proof       |",
            "+--------------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <AccountConsole />

      <section className="account-custody" aria-label="Account migration custody receipt">
        <header>
          <span>VTK://IDENTITY-CUSTODY//GITHUB-TO-C0VIBE</span>
          <b>1 IDENTITY / 0 CREDENTIAL COPIES</b>
        </header>
        <div className="account-custody__route">
          <article data-tone="github">
            <small>01 / identity anchor</small>
            <h2>GitHub subject</h2>
            <p>The immutable GitHub user ID, handle, and avatar identify the operator. The raw GitHub token is checked once and never stored.</p>
            <strong>carries: verified identity</strong>
          </article>
          <article data-tone="terminal">
            <small>02 / machine access</small>
            <h2>CLI keyring</h2>
            <p>VibeTRACKER issues its own revocable token after proof. The token stays in the OS keyring; the GitHub credential does not move with it.</p>
            <strong>carries: CLI ownership</strong>
          </article>
          <article data-tone="ledger">
            <small>03 / history</small>
            <h2>Usage ledger</h2>
            <p>Historical submissions keep the same identity ID. Linking attaches ownership without rewriting totals, trust labels, or rank evidence.</p>
            <strong>carries: existing history</strong>
          </article>
          <article data-tone="c0vibe">
            <small>04 / optional account</small>
            <h2>C0VIBE settings</h2>
            <p>A ten-minute one-time claim gives WorkOS a stable identity anchor. Provider credentials remain local and are never copied into settings.</p>
            <strong>carries: identity reference</strong>
          </article>
        </div>
        <dl>
          <div><dt>raw GitHub tokens</dt><dd>0 stored</dd></div>
          <div><dt>hidden usage moves</dt><dd>0</dd></div>
          <div><dt>profile forks</dt><dd>0</dd></div>
          <div><dt>migration claim</dt><dd>10 min</dd></div>
        </dl>
      </section>

      <section className="account-boundary" aria-label="Account trust boundary">
        <article><b>01 / sign in</b><span>GitHub OAuth creates the browser session. An authenticated GitHub CLI can verify the same identity without a site account.</span></article>
        <article><b>02 / usage</b><span>Identity proof does not verify spend, tokens, credits, records, or rank inputs.</span></article>
        <article><b>03 / later migration</b><span>When you want a full C0VIBE account, WorkOS attaches to this GitHub identity instead of creating a second profile.</span></article>
      </section>
    </div>
  );
}
