import type { Metadata } from "next";
import { AccountConsole } from "./account-console";
import "./account.css";

export const metadata: Metadata = {
  title: "GitHub identity and account · VibeUsage",
  description: "Verify with GitHub, attach existing VibeTRACKER history, and keep usage proof separate from identity proof without creating a C0VIBE account.",
};

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="account-hero" aria-labelledby="account-title">
        <div className="account-hero__copy">
          <p className="eyebrow">Identity control room</p>
          <h1 id="account-title">Prove your GitHub. Keep your usage history.</h1>
          <p>Verify through GitHub in the browser or reuse the GitHub CLI already authenticated on your machine. This creates a VibeUsage identity, not a full C0VIBE account, and never moves usage.</p>
          <div className="account-hero__rails" aria-label="Identity guarantees">
            <span>GitHub first</span><span>no WorkOS gate</span><span>CLI live now</span><span>linked history</span>
          </div>
        </div>
        <div className="account-hero__terminal" aria-label="GitHub identity migration terminal">
          <div className="console-top"><span>identity@vibeusage</span><b>ZERO USAGE MOVEMENT</b></div>
          <pre>{[
            "+--------------------------------------------------+",
            "| VTRK://GITHUB-PROOF//ADAPTIVE-ACCOUNT           |",
            "|--------------------------------------------------|",
            "| github id       immutable identity anchor        |",
            "| auth channel    browser OAuth or existing gh CLI |",
            "| blue check      identity only, NOT usage truth    |",
            "| cli history     linked after identity proof       |",
            "+--------------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <AccountConsole />

      <section className="account-boundary" aria-label="Account trust boundary">
        <article><b>01 / identity</b><span>GitHub OAuth or an authenticated GitHub CLI session proves who owns the handle. Verified identities receive the blue check.</span></article>
        <article><b>02 / usage</b><span>Identity proof does not verify spend, tokens, credits, records, or rank inputs.</span></article>
        <article><b>03 / later migration</b><span>When you want a full C0VIBE account, WorkOS attaches to this GitHub identity instead of creating a second profile.</span></article>
      </section>
    </div>
  );
}
