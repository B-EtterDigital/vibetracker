"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ProviderDescriptor } from "../../../../adapters/src/registry";
import { providerBrand } from "../../lib/provider-brand";

// Directory-first operator console for the provider registry: search, status + category
// filters (AND semantics), a label legend, and one honest action per row. No provider
// calls happen here — every action just copies a CLI command the user runs themselves.

type StatusKey = "verified" | "built" | "proxy" | "manual" | "planned";
type StatusFilter = "all" | StatusKey;
type CategoryFilter = "all" | string;

const GOOD_FIRST_ADAPTERS =
  "https://github.com/B-EtterDigital/vibetracker/blob/main/docs/GOOD_FIRST_ADAPTERS.md";
const REQUEST_ADAPTER = "https://github.com/B-EtterDigital/vibetracker/issues/new";
const COPIED = "copied";
const COPY_BLOCKED = "copy blocked";

// Ordered for the legend, the status filter rail, and the row sort.
const STATUS_KEYS: StatusKey[] = ["verified", "built", "proxy", "manual", "planned"];

const STATUS_WORD: Record<StatusKey, string> = {
  verified: "built · verified",
  built: "built · approximate",
  proxy: "proxy-ready",
  manual: "manual",
  planned: "planned",
};

const STATUS_ORDER: Record<StatusKey, number> = {
  verified: 0,
  built: 1,
  proxy: 2,
  manual: 3,
  planned: 4,
};

const STATUS_LEGEND: Record<StatusKey, string> = {
  verified: "adapter ships in the CLI and the backend attested real records",
  built: "adapter ships and works; totals can drift until endpoint verification",
  proxy: "no adapter needed; captured by local proxy or log capture on your machine",
  manual: "you log it with one command; amortized subscriptions land here",
  planned: "mapped with a scaffold ready, not built yet; a good first contribution",
};

// Status derivation — same precedence as the registry cockpit and the metrics strip:
// built+verified wins, then built, then proxy tier, then manual, else planned.
function statusKeyOf(p: ProviderDescriptor): StatusKey {
  if (p.status === "built" && p.verified) return "verified";
  if (p.status === "built") return "built";
  if (p.tier === "proxy") return "proxy";
  if (p.tier === "manual" || p.status === "manual-only") return "manual";
  return "planned";
}

type RowAction =
  | { kind: "copy"; label: string; command: string }
  | { kind: "link"; label: string; href: string };

function actionFor(p: ProviderDescriptor, key: StatusKey): RowAction {
  if (key === "verified" || key === "built") {
    return { kind: "copy", label: `connect ${p.id}`, command: `vibetracker connect ${p.id}` };
  }
  if (key === "proxy") {
    return { kind: "copy", label: "detect", command: "vibetracker detect" };
  }
  if (key === "manual") {
    return { kind: "copy", label: `add ${p.id}`, command: `vibetracker add ${p.id} --usd 20 --note manual` };
  }
  return { kind: "link", label: "contribute", href: GOOD_FIRST_ADAPTERS };
}

interface RankedRow {
  p: ProviderDescriptor;
  key: StatusKey;
  brand: ReturnType<typeof providerBrand>;
  haystack: string;
}

export function ProvidersDirectory({ providers }: { providers: ProviderDescriptor[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [feedback, setFeedback] = useState<{ id: string; text: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Facets over ALL providers (stable counts) computed once per registry input.
  const { statusCounts, categories, ranked } = useMemo(() => {
    const statusCounts: Record<StatusKey, number> = { verified: 0, built: 0, proxy: 0, manual: 0, planned: 0 };
    const catMap = new Map<string, number>();
    const ranked: RankedRow[] = providers.map((p) => {
      const key = statusKeyOf(p);
      statusCounts[key] += 1;
      for (const category of p.categories) catMap.set(category, (catMap.get(category) ?? 0) + 1);
      return {
        p,
        key,
        brand: providerBrand(p.id),
        haystack: `${p.label} ${p.id} ${p.categories.join(" ")} ${p.method}`.toLowerCase(),
      };
    });
    const categories = [...catMap.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { statusCounts, categories, ranked };
  }, [providers]);

  // Compose search + status + category (AND semantics), then sort by status then label.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked
      .filter((row) => {
        if (statusFilter !== "all" && row.key !== statusFilter) return false;
        if (categoryFilter !== "all" && !row.p.categories.some((c) => c === categoryFilter)) return false;
        if (q && !row.haystack.includes(q)) return false;
        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.key] - STATUS_ORDER[b.key] || a.p.label.localeCompare(b.p.label));
  }, [ranked, query, statusFilter, categoryFilter]);

  function flash(id: string, text: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback({ id, text });
    timerRef.current = setTimeout(() => setFeedback(null), 1500);
  }

  // The visible copied / copy blocked state IS the error handling for the clipboard call:
  // never a silent catch, the user always sees whether the command reached the clipboard.
  async function copyCommand(id: string, command: string) {
    try {
      await navigator.clipboard.writeText(command);
      flash(id, COPIED);
    } catch {
      flash(id, COPY_BLOCKED);
    }
  }

  return (
    <section className="providers-directory" aria-label="Provider coverage directory">
      <div className="console-top"><span>directory@registry</span><b>{providers.length} SERVICES</b></div>

      <ul className="providers-legend" aria-label="Status label legend">
        {STATUS_KEYS.map((key) => (
          <li className="providers-legend__item" key={key}>
            <span className={`providers-chip providers-chip--${key}`}>{STATUS_WORD[key]}</span>
            <span className="providers-legend__def">{STATUS_LEGEND[key]}</span>
          </li>
        ))}
      </ul>

      <div className="providers-directory__search">
        <label className="providers-sr-only" htmlFor="providers-directory-search">Search providers</label>
        <input
          id="providers-directory-search"
          type="search"
          className="providers-directory__input"
          placeholder={`> search ${providers.length} providers, categories, methods`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="providers-directory__filters" role="group" aria-label="Filter by status">
        <button
          type="button"
          className="providers-chip providers-chip--all"
          aria-pressed={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          all <small>({providers.length})</small>
        </button>
        {STATUS_KEYS.map((key) => (
          <button
            type="button"
            key={key}
            className={`providers-chip providers-chip--${key}`}
            aria-pressed={statusFilter === key}
            onClick={() => setStatusFilter(key)}
          >
            {STATUS_WORD[key]} <small>({statusCounts[key]})</small>
          </button>
        ))}
      </div>

      <div className="providers-directory__cats" role="group" aria-label="Filter by category">
        <button
          type="button"
          className="providers-chip providers-cat"
          aria-pressed={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
        >
          all <small>({providers.length})</small>
        </button>
        {categories.map(([category, count]) => (
          <button
            type="button"
            key={category}
            className="providers-chip providers-cat"
            aria-pressed={categoryFilter === category}
            onClick={() => setCategoryFilter(category)}
          >
            {category} <small>({count})</small>
          </button>
        ))}
      </div>

      <p className="providers-directory__count" aria-live="polite">
        &gt; {results.length} {results.length === 1 ? "match" : "matches"}
      </p>

      {results.length === 0 ? (
        <div className="providers-directory__empty">
          {query.trim() ? (
            <p>&gt; no provider matches &quot;{query}&quot;</p>
          ) : (
            <p>&gt; no providers match the active filters</p>
          )}
          <a href={REQUEST_ADAPTER}>request an adapter</a>
        </div>
      ) : (
        <table className="providers-table">
          <caption className="providers-sr-only">Provider coverage directory</caption>
          <colgroup className="providers-columns" aria-hidden="true">
            <col className="providers-columns__identity" />
            <col className="providers-columns__status" />
            <col className="providers-columns__categories" />
            <col className="providers-columns__method" />
            <col className="providers-columns__action" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">provider</th>
              <th scope="col">status</th>
              <th scope="col">categories</th>
              <th scope="col">how we track it</th>
              <th scope="col">action</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ p, key, brand }) => {
              const action = actionFor(p, key);
              const extra = p.categories.length - 4;
              const hint = feedback?.id === p.id ? feedback.text : "";
              return (
                <tr
                  key={p.id}
                  className={`providers-row providers-row--${key}`}
                  style={{ "--brand-from": brand.from, "--brand-to": brand.to, "--brand-ink": brand.ink } as CSSProperties}
                >
                  <td className="providers-row__id">
                    {brand.logo ? (
                      <span className="providers-row__mark providers-row__mark--logo" aria-hidden="true">
                        <img src={brand.logo} alt="" width={14} height={14} loading="lazy" decoding="async" />
                      </span>
                    ) : (
                      <span className="providers-row__mark" aria-hidden="true">{brand.mark}</span>
                    )}
                    <span className="providers-row__name">
                      <b>{p.label}</b>
                      <span>{p.id}</span>
                    </span>
                  </td>
                  <td className="providers-row__status">
                    <span className={`providers-chip providers-chip--${key}`}>{STATUS_WORD[key]}</span>
                  </td>
                  <td className="providers-row__cats">
                    {p.categories.slice(0, 4).join(" · ")}{extra > 0 ? ` +${extra}` : ""}
                  </td>
                  <td className="providers-row__method">
                    <span title={p.method}>{p.method}</span>
                  </td>
                  <td className="providers-row__action">
                    {action.kind === "copy" ? (
                      <button
                        type="button"
                        className="providers-row__cmd"
                        onClick={() => copyCommand(p.id, action.command)}
                      >
                        {action.label}
                      </button>
                    ) : (
                      <a className="providers-row__cmd providers-row__cmd--link" href={action.href}>{action.label}</a>
                    )}
                    <span
                      className={`providers-row__hint${hint === COPY_BLOCKED ? " providers-row__hint--blocked" : ""}`}
                      aria-live="polite"
                    >
                      {hint}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
