import type { Metadata } from "next";
import { AccountConsole } from "./account-console";
import "./account.css";

export const metadata: Metadata = {
  title: "GitHub identity and account · VibeUsage",
  description: "Sign in with GitHub, attach existing VibeTRACKER history, and keep usage proof separate from account proof.",
};

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="account-hero" aria-labelledby="account-title">
        <div className="account-hero__copy">
          <p className="eyebrow">Identity control room</p>
          <h1 id="account-title">Sign in with GitHub. Keep your usage history.</h1>
          <p>Authenticate on GitHub, return through a secure server callback, and continue with a real browser session. Existing CLI submissions attach after identity proof; they are not the login flow.</p>
          <div className="account-hero__rails" aria-label="Identity guarantees">
            <span>GitHub OAuth</span><span>server callback</span><span>cookie session</span><span>linked history</span>
          </div>
        </div>
        <div className="account-hero__terminal" aria-label="GitHub identity migration terminal">
          <div className="console-top"><span>identity@vibeusage</span><b>ZERO USAGE MOVEMENT</b></div>
          <pre>{[
            "+--------------------------------------------------+",
            "| VTRK://GITHUB-OAUTH//ACCOUNT-SESSION             |",
            "|--------------------------------------------------|",
            "| github id       immutable identity anchor        |",
            "| browser session secure callback exchange          |",
            "| blue check      identity only, NOT usage truth    |",
            "| cli history     linked, never used as login        |",
            "+--------------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <AccountConsole />

      <section className="account-boundary" aria-label="Account trust boundary">
        <article><b>01 / identity</b><span>GitHub OAuth proves who owns the handle. Verified identities receive the blue check; handle-only batches stay marked CLI.</span></article>
        <article><b>02 / usage</b><span>Identity proof does not verify spend, tokens, credits, records, or rank inputs.</span></article>
        <article><b>03 / migration</b><span>A later C0VIBE account attaches to the same identity instead of creating a second profile.</span></article>
      </section>
    </div>
  );
}
