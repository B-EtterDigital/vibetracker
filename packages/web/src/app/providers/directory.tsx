"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ProviderDescriptor } from "../../../../adapters/src/registry";
import { providerBrand } from "../../lib/provider-brand";
import {
  buildProviderDirectoryData,
  filterProviderRows,
  pageProviderRows,
  STATUS_KEYS,
  STATUS_LEGEND,
  STATUS_WORD,
} from "./directory-data";
import type { DomainFilter, StatusFilter, StatusKey } from "./directory-data";

const GOOD_FIRST_ADAPTERS =
  "https://github.com/B-EtterDigital/vibetracker/blob/main/docs/GOOD_FIRST_ADAPTERS.md";
const REQUEST_ADAPTER = "https://github.com/B-EtterDigital/vibetracker/issues/new";
const COPIED = "copied";
const COPY_BLOCKED = "copy blocked";

type RowAction =
  | { kind: "copy"; label: string; command: string }
  | { kind: "link"; label: string; href: string };

function actionFor(provider: ProviderDescriptor, key: StatusKey): RowAction {
  if (key === "verified" || key === "built") {
    return { kind: "copy", label: `connect ${provider.id}`, command: `vibetracker connect ${provider.id}` };
  }
  if (key === "proxy") return { kind: "copy", label: "detect", command: "vibetracker detect" };
  if (key === "manual") {
    return {
      kind: "copy",
      label: `add ${provider.id}`,
      command: `vibetracker add ${provider.id} --usd 20 --note manual`,
    };
  }
  return { kind: "link", label: "contribute", href: GOOD_FIRST_ADAPTERS };
}

export function ProvidersDirectory({ providers }: { providers: ProviderDescriptor[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ id: string; text: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const directory = useMemo(() => buildProviderDirectoryData(providers), [providers]);
  const results = useMemo(
    () => filterProviderRows(directory.rows, {
      query,
      status: statusFilter,
      category: categoryFilter,
      domain: domainFilter,
    }),
    [directory.rows, query, statusFilter, categoryFilter, domainFilter],
  );
  const paged = pageProviderRows(results, page);
  const hasFilters = Boolean(query.trim()) || statusFilter !== "all" || categoryFilter !== "all" || domainFilter !== "all";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current && query) {
        setQuery("");
        setPage(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setDomainFilter("all");
    setPage(1);
    searchRef.current?.focus();
  }

  function flash(id: string, text: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback({ id, text });
    timerRef.current = setTimeout(() => setFeedback(null), 1500);
  }

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
      <div className="console-top">
        <span>directory@registry</span>
        <b>{directory.readyCount} READY · {providers.length} MAPPED</b>
      </div>

      <div className="providers-directory__brief" aria-label="Provider coverage readout">
        <div>
          <strong>{directory.readyCount}</strong>
          <span>usable now</span>
          <small>adapter, proxy, or manual path</small>
        </div>
        <div>
          <strong>{directory.statusCounts.verified}</strong>
          <span>endpoint-verified</span>
          <small>highest-confidence records</small>
        </div>
        <div>
          <strong>{directory.statusCounts.planned}</strong>
          <span>planned</span>
          <small>mapped, never implied as built</small>
        </div>
      </div>

      <details className="providers-legend">
        <summary>Read the five coverage labels</summary>
        <ul>
          {STATUS_KEYS.map((key) => (
            <li className="providers-legend__item" key={key}>
              <span className={`providers-chip providers-chip--${key}`}>{STATUS_WORD[key]}</span>
              <span className="providers-legend__def">{STATUS_LEGEND[key]}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="providers-directory__toolbar">
        <div className="providers-directory__search">
          <label className="providers-sr-only" htmlFor="providers-directory-search">Search providers</label>
          <span aria-hidden="true">&gt;</span>
          <input
            ref={searchRef}
            id="providers-directory-search"
            type="search"
            className="providers-directory__input"
            placeholder="provider, method, auth, category…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button type="button" className="providers-directory__clear" onClick={() => { setQuery(""); setPage(1); }} aria-label="Clear search" title="Clear search">×</button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>

        <label className="providers-directory__select">
          <span>category</span>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">all categories</option>
            {directory.categories.map(([category, count]) => (
              <option key={category} value={category}>{category} ({count})</option>
            ))}
          </select>
        </label>
      </div>

      <div className="providers-directory__facets">
        <div className="providers-directory__filters" role="group" aria-label="Filter by coverage status">
          <button type="button" className="providers-chip providers-chip--all" aria-pressed={statusFilter === "all"} onClick={() => { setStatusFilter("all"); setPage(1); }}>
            all <small>({providers.length})</small>
          </button>
          <button type="button" className="providers-chip providers-chip--ready" aria-pressed={statusFilter === "ready"} onClick={() => { setStatusFilter("ready"); setPage(1); }}>
            ready now <small>({directory.readyCount})</small>
          </button>
          {STATUS_KEYS.map((key) => (
            <button type="button" key={key} className={`providers-chip providers-chip--${key}`} aria-pressed={statusFilter === key} onClick={() => { setStatusFilter(key); setPage(1); }}>
              {STATUS_WORD[key]} <small>({directory.statusCounts[key]})</small>
            </button>
          ))}
        </div>

        <div className="providers-directory__domains" role="group" aria-label="Filter by provider domain">
          {(["all", "ai", "dev", "creative"] as DomainFilter[]).map((domain) => (
            <button key={domain} type="button" aria-pressed={domainFilter === domain} onClick={() => { setDomainFilter(domain); setPage(1); }}>
              {domain === "all" ? "all domains" : domain}
            </button>
          ))}
        </div>
      </div>

      <div className="providers-directory__resultbar">
        <p id="providers-result-count" aria-live="polite">
          {results.length === 0 ? "0 matches" : `${paged.start + 1}–${paged.end} of ${results.length} matches`}
        </p>
        {hasFilters ? <button type="button" onClick={resetFilters}>reset filters</button> : <span>sorted by coverage confidence</span>}
      </div>

      {results.length === 0 ? (
        <div className="providers-directory__empty">
          <p>&gt; no source matches this signal</p>
          <span>Try a provider ID, tracking method, auth type, category, or clear the active filters.</span>
          <div>
            <button type="button" onClick={resetFilters}>clear filters</button>
            <a href={REQUEST_ADAPTER}>request an adapter</a>
          </div>
        </div>
      ) : (
        <>
          <table className="providers-table" aria-describedby="providers-result-count">
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
                <th scope="col">coverage</th>
                <th scope="col">domain / categories</th>
                <th scope="col">tracking path</th>
                <th scope="col">next action</th>
              </tr>
            </thead>
            <tbody>
              {paged.rows.map(({ provider, key }) => {
                const action = actionFor(provider, key);
                const brand = providerBrand(provider.id);
                const extra = provider.categories.length - 3;
                const hint = feedback?.id === provider.id ? feedback.text : "";
                return (
                  <tr key={provider.id} className={`providers-row providers-row--${key}`} style={{ "--brand-from": brand.from, "--brand-to": brand.to, "--brand-ink": brand.ink } as CSSProperties}>
                    <td className="providers-row__id">
                      {brand.logo ? (
                        <span className="providers-row__mark providers-row__mark--logo" aria-hidden="true">
                          <img src={brand.logo} alt="" width={14} height={14} loading="lazy" decoding="async" />
                        </span>
                      ) : (
                        <span className="providers-row__mark" aria-hidden="true">{brand.mark}</span>
                      )}
                      <span className="providers-row__name"><b>{provider.label}</b><span>{provider.id}</span></span>
                    </td>
                    <td className="providers-row__status"><span className={`providers-chip providers-chip--${key}`}>{STATUS_WORD[key]}</span></td>
                    <td className="providers-row__cats"><b>{provider.domain}</b> · {provider.categories.slice(0, 3).join(" · ")}{extra > 0 ? ` +${extra}` : ""}</td>
                    <td className="providers-row__method"><span title={provider.method}>{provider.method}</span></td>
                    <td className="providers-row__action">
                      {action.kind === "copy" ? (
                        <button type="button" className="providers-row__cmd" onClick={() => copyCommand(provider.id, action.command)}>{action.label}</button>
                      ) : (
                        <a className="providers-row__cmd providers-row__cmd--link" href={action.href}>{action.label}</a>
                      )}
                      <span className={`providers-row__hint${hint === COPY_BLOCKED ? " providers-row__hint--blocked" : ""}`} aria-live="polite">{hint}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <nav className="providers-directory__pagination" aria-label="Provider result pages">
            <button type="button" onClick={() => setPage(paged.page - 1)} disabled={paged.page === 1} aria-label="Previous provider page" title="Previous page">←</button>
            <span>page <b>{paged.page}</b> / {paged.pageCount}</span>
            <button type="button" onClick={() => setPage(paged.page + 1)} disabled={paged.page === paged.pageCount} aria-label="Next provider page" title="Next page">→</button>
          </nav>
        </>
      )}
    </section>
  );
}
