import type { Metadata } from "next";
import { AccountConsole } from "./account-console";
import "./account.css";

export const metadata: Metadata = {
  title: "Sign in with GitHub · VibeUsage",
  description: "Sign in with GitHub or verify through the existing GitHub CLI, attach VibeTRACKER history, and keep usage proof separate from identity proof.",
};

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="account-hero" aria-labelledby="account-title">
        <div className="account-hero__copy">
          <p className="eyebrow">Identity control room</p>
          <h1 id="account-title">Sign in with GitHub. Keep your usage history.</h1>
          <p>Start a browser session for site controls or verify the GitHub CLI already authenticated on your machine. Both resolve to one GitHub identity, not a full C0VIBE account, and neither path moves usage.</p>
          <div className="account-hero__rails" aria-label="Identity guarantees">
            <span>browser session</span><span>CLI identity</span><span>no WorkOS gate</span><span>linked history</span>
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

      <section className="account-boundary" aria-label="Account trust boundary">
        <article><b>01 / sign in</b><span>GitHub OAuth creates the browser session. An authenticated GitHub CLI can verify the same identity without a site account.</span></article>
        <article><b>02 / usage</b><span>Identity proof does not verify spend, tokens, credits, records, or rank inputs.</span></article>
        <article><b>03 / later migration</b><span>When you want a full C0VIBE account, WorkOS attaches to this GitHub identity instead of creating a second profile.</span></article>
      </section>
    </div>
  );
}
