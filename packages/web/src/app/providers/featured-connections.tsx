import type { CSSProperties } from "react";
import { providerBrand } from "../../lib/provider-brand";
import type { FeaturedProviderConnection } from "./directory-data";
import { STATUS_WORD } from "./directory-data";

interface CreatorConnectionBayProps {
  connections: FeaturedProviderConnection[];
  activeId: string;
  feedback: { id: string; text: string } | null;
  onFocus: (providerId: string) => void;
  onCopy: (providerId: string, command: string) => void;
}

export function CreatorConnectionBay({
  connections,
  activeId,
  feedback,
  onFocus,
  onCopy,
}: CreatorConnectionBayProps) {
  return (
    <section className="providers-directory__quick" aria-labelledby="creator-connection-title">
      <header>
        <span id="creator-connection-title">CREATOR CONNECTION BAY</span>
        <small>{connections.length} reviewed local lanes</small>
      </header>
      <div className="providers-directory__quick-grid">
        {connections.map(({ row: { provider, key }, protocol, signal, boundary, action }) => {
          const brand = providerBrand(provider.id);
          const hint = feedback?.id === provider.id ? feedback.text : "";
          const command = action.kind === "copy" ? action.command : action.label;
          return (
            <article
              key={provider.id}
              data-active={activeId === provider.id}
              style={{ "--brand-from": brand.from, "--brand-to": brand.to, "--brand-ink": brand.ink } as CSSProperties}
            >
              <button
                type="button"
                className="providers-directory__quick-identity"
                aria-pressed={activeId === provider.id}
                onClick={() => onFocus(provider.id)}
              >
                <i aria-hidden="true">{brand.logo ? <img src={brand.logo} alt="" width={16} height={16} /> : brand.mark}</i>
                <span>
                  <b>{provider.label}</b>
                  <em>{protocol}</em>
                  <small>{STATUS_WORD[key]}</small>
                </span>
              </button>
              <div className="providers-directory__quick-proof">
                <b>{signal}</b>
                <small>{boundary}</small>
              </div>
              <div className="providers-directory__quick-command">
                <code title={command}>{command}</code>
                {action.kind === "copy" ? (
                  <button
                    type="button"
                    onClick={() => onCopy(provider.id, action.command)}
                    aria-label={`Copy ${provider.label} command`}
                    title={`Copy ${action.command}`}
                  >
                    {hint || "COPY"}
                  </button>
                ) : (
                  <a href={action.href} aria-label={`Open ${provider.label} contribution guide`}>OPEN</a>
                )}
                <span aria-live="polite">{hint}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
