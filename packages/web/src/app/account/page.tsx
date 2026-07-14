import type { Metadata } from "next";
import { AccountConsole } from "./account-console";
import "./account.css";

export const metadata: Metadata = {
  title: "GitHub identity and account · VibeUsage",
  description: "Verify a GitHub identity, attach existing VibeTRACKER CLI history, and keep usage proof separate from account proof.",
};

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="account-hero" aria-labelledby="account-title">
        <div className="account-hero__copy">
          <p className="eyebrow">Identity control room</p>
          <h1 id="account-title">Verify once. Keep your CLI history.</h1>
          <p>GitHub is the first proof layer. It can place your CLI batches in the attested board without asking for a full C0VIBE account first.</p>
          <div className="account-hero__rails" aria-label="Identity guarantees">
            <span>GitHub first</span><span>no usage upload</span><span>WorkOS later</span>
          </div>
        </div>
        <div className="account-hero__terminal" aria-label="GitHub identity migration terminal">
          <div className="console-top"><span>identity@vibeusage</span><b>ZERO USAGE MOVEMENT</b></div>
          <pre>{[
            "+--------------------------------------------------+",
            "| VTRK://GITHUB-PROOF//ACCOUNT-BRIDGE              |",
            "|--------------------------------------------------|",
            "| github id       immutable identity anchor        |",
            "| cli history     attached after both proofs        |",
            "| blue check      identity only, NOT usage truth    |",
            "| workos          optional account upgrade later    |",
            "+--------------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <AccountConsole />

      <section className="account-boundary" aria-label="Account trust boundary">
        <article><b>01 / identity</b><span>GitHub proves who owns the handle. Raw provider tokens are never stored by VibeUsage.</span></article>
        <article><b>02 / usage</b><span>Identity proof does not verify spend, tokens, credits, records, or rank inputs.</span></article>
        <article><b>03 / migration</b><span>A later C0VIBE account attaches to the same identity instead of creating a second profile.</span></article>
      </section>
    </div>
  );
}
