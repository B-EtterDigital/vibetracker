import "./providers.css";
import { PROVIDERS } from "../../../../adapters/src/registry";
import { buildProviderSurpriseDirector } from "../../lib/provider-scan";
import { ProvidersDirectory } from "./directory";
import { ProviderSurpriseDirectorPanel } from "./theatre";

export const metadata = {
  title: "VibeUsage Provider Status",
  description:
    "Searchable status directory for every provider VibeTRACKER maps: built, verified, proxy, manual, and planned coverage with honest labels.",
};

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function metric(label: string, value: number, detail: string) {
  return (
    <div>
      <b>{value}</b>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

export default function ProvidersPage() {
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const proxy = PROVIDERS.filter((provider) => provider.status !== "built" && provider.tier === "proxy").length;
  const manual = PROVIDERS.filter(
    (provider) => provider.status !== "built" && (provider.tier === "manual" || provider.status === "manual-only"),
  ).length;
  const planned = PROVIDERS.length - built - proxy - manual;
  const surpriseDirector = buildProviderSurpriseDirector(PROVIDERS);
  const registryAscii = [
    "+------------------------------------------------+",
    "| VTRK://PROVIDER-REGISTRY/LOCAL-FIRST           |",
    "|------------------------------------------------|",
    `| mapped   ${fit(PROVIDERS.length, 8)} built   ${fit(built, 8)} verified ${fit(verified, 5)} |`,
    `| proxy    ${fit(proxy, 8)} manual  ${fit(manual, 8)} planned  ${fit(planned, 5)} |`,
    "|------------------------------------------------|",
    "| labels are product truth, not marketing copy    |",
    "| planned means mapped, not secretly built        |",
    "+------------------------------------------------+",
  ].join("\n");

  return (
    <>
      <section className="providers-hero">
        <div className="providers-copy">
          <p className="eyebrow">Adapter registry cockpit</p>
          <h1>Provider status board</h1>
          <p>
            Find your tool, read its honest label, run one command. Every source VibeTRACKER can track is listed
            below, including the ones that are only planned.
          </p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="registry-terminal" aria-label="Provider registry terminal summary">
          <div className="console-top"><span>registry@vibetracker</span><b>truth labels</b></div>
          <pre>{registryAscii}</pre>
        </div>
      </section>

      <ProvidersDirectory providers={PROVIDERS} />

      <section className="provider-metrics" aria-label="Provider coverage summary">
        {metric("services mapped", PROVIDERS.length, "Registry-backed coverage")}
        {metric("built adapters", built, `${verified} endpoint-verified`)}
        {metric("proxy/manual paths", proxy + manual, `${proxy} proxy · ${manual} manual`)}
        {metric("planned adapters", planned, "Good first contributor tasks")}
      </section>

      <details className="providers-theatre">
        <summary>&gt; show scan theatre (visual only, makes no calls)</summary>
        <ProviderSurpriseDirectorPanel director={surpriseDirector} />
      </details>

      <section className="providers-contribute" aria-label="Contribute a planned adapter">
        <div className="console-top"><span>contributors@registry</span><b>{planned} PLANNED</b></div>
        <p>Planned means mapped with a scaffold ready, not secretly built. Pick one and make it real.</p>
        <div className="providers-contribute__cmd">{"vibetracker adapter scaffold <provider>"}</div>
        <div className="providers-contribute__links">
          <a href="https://github.com/B-EtterDigital/vibetracker/blob/main/docs/GOOD_FIRST_ADAPTERS.md">
            good first adapters
          </a>
          <a href="https://github.com/B-EtterDigital/vibetracker/blob/main/CONTRIBUTING.md">
            contribution rules (strict SMA Gen3)
          </a>
        </div>
      </section>
    </>
  );
}
