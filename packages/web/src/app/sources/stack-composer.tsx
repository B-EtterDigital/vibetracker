"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ProviderDescriptor } from "../../../../adapters/src/registry";
import { providerBrand } from "../../lib/provider-brand";
import {
  buildRunbook,
  buildSourceCandidates,
  MAX_STACK_SIZE,
  resolvePreset,
  searchSourceCandidates,
  STACK_PRESETS,
} from "./stack-composer-data";
import type { PresetKey, SourceDomain } from "./stack-composer-data";

const COPIED = "runbook copied";
const COPY_BLOCKED = "clipboard blocked";

export function SourceStackComposer({ providers }: { providers: ProviderDescriptor[] }) {
  const candidates = useMemo(() => buildSourceCandidates(providers), [providers]);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<SourceDomain>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    resolvePreset(candidates, "coding").map((candidate) => candidate.provider.id),
  );
  const [activePreset, setActivePreset] = useState<PresetKey | null>("coding");
  const [feedback, setFeedback] = useState("");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selected = useMemo(
    () => candidates.filter((candidate) => selectedSet.has(candidate.provider.id)),
    [candidates, selectedSet],
  );
  const results = useMemo(
    () => searchSourceCandidates(candidates, query, domain),
    [candidates, query, domain],
  );
  const runbook = useMemo(() => buildRunbook(selected), [selected]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  function flash(message: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 1800);
  }

  function toggleSource(id: string) {
    setActivePreset(null);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= MAX_STACK_SIZE) {
      flash(`stack limit ${MAX_STACK_SIZE} — remove one source first`);
      return;
    }
    setSelectedIds([...selectedIds, id]);
  }

  function applyPreset(key: PresetKey) {
    setSelectedIds(resolvePreset(candidates, key).map((candidate) => candidate.provider.id));
    setActivePreset(key);
    flash("preset loaded — nothing executed");
  }

  async function copyRunbook() {
    try {
      await navigator.clipboard.writeText(runbook.text);
      flash(COPIED);
    } catch {
      flash(COPY_BLOCKED);
    }
  }

  return (
    <section className="stack-composer" aria-labelledby="stack-composer-title">
      <div className="stack-composer__intro">
        <div>
          <p className="eyebrow">Local setup composer</p>
          <h2 id="stack-composer-title">Build the runbook for your stack.</h2>
        </div>
        <p>Select up to {MAX_STACK_SIZE} tools. VibeUsage classifies each source by the collection path that exists today, then writes commands for you to review.</p>
      </div>

      <div className="stack-presets" role="group" aria-label="Stack presets">
        {STACK_PRESETS.map((preset) => (
          <button key={preset.key} type="button" aria-pressed={activePreset === preset.key} onClick={() => applyPreset(preset.key)}>
            <b>{preset.label}</b>
            <span>{preset.detail}</span>
          </button>
        ))}
      </div>

      <div className="stack-workbench">
        <div className="stack-picker" aria-label="Choose source tools">
          <div className="console-top"><span>picker@sources</span><b>{providers.length} MAPPED</b></div>
          <div className="stack-picker__search">
            <label htmlFor="stack-source-search">Find a source</label>
            <div>
              <span aria-hidden="true">&gt;</span>
              <input
                id="stack-source-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="provider, category, auth, method…"
                autoComplete="off"
                spellCheck={false}
              />
              {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear source search" title="Clear search">×</button> : null}
            </div>
          </div>

          <div className="stack-picker__domains" role="group" aria-label="Filter source domain">
            {(["all", "ai", "dev", "creative"] as SourceDomain[]).map((value) => (
              <button key={value} type="button" aria-pressed={domain === value} onClick={() => setDomain(value)}>
                {value === "all" ? "all domains" : value}
              </button>
            ))}
          </div>

          <div className="stack-picker__resultbar">
            <span>{results.length} shown</span>
            <b>{selectedIds.length}/{MAX_STACK_SIZE} selected</b>
          </div>

          {results.length ? (
            <ul className="stack-picker__results">
              {results.map((candidate) => {
              const provider = candidate.provider;
              const brand = providerBrand(provider.id);
              const checked = selectedSet.has(provider.id);
              return (
                <li key={provider.id} style={{ "--brand-from": brand.from, "--brand-to": brand.to, "--brand-ink": brand.ink } as CSSProperties}>
                  <label>
                    <input type="checkbox" checked={checked} onChange={() => toggleSource(provider.id)} />
                    {brand.logo ? (
                      <span className="stack-picker__mark stack-picker__mark--logo" aria-hidden="true"><img src={brand.logo} alt="" width={16} height={16} /></span>
                    ) : (
                      <span className="stack-picker__mark" aria-hidden="true">{brand.mark}</span>
                    )}
                    <span className="stack-picker__identity">
                      <b>{provider.label}</b>
                      <small>{provider.id} · {provider.domain} · {provider.categories.slice(0, 3).join(" · ")}</small>
                      <em title={provider.method}>{provider.method}</em>
                    </span>
                    <span className={`stack-path stack-path--${candidate.path}`}>{candidate.pathLabel}</span>
                  </label>
                </li>
              );
              })}
            </ul>
          ) : (
            <div className="stack-picker__empty">
              <b>No source matches this signal.</b>
              <span>Try its provider ID, collection method, auth type, or another domain.</span>
              <button type="button" onClick={() => { setQuery(""); setDomain("all"); }}>clear search</button>
            </div>
          )}
          <p className="stack-picker__note">Showing the best 12 matches. The full registry remains available on the provider board.</p>
        </div>

        <div className="stack-runbook" aria-label="Generated local setup runbook">
          <div className="console-top"><span>runbook@local</span><b>ZERO EXECUTION</b></div>
          <div className="stack-runbook__summary" aria-label="Selected stack collection paths">
            <div><b>{runbook.counts.connect}</b><span>adapters</span></div>
            <div><b>{runbook.counts.detect}</b><span>detect</span></div>
            <div><b>{runbook.counts.manual}</b><span>manual</span></div>
            <div><b>{runbook.counts.planned}</b><span>planned</span></div>
          </div>

          <div className="stack-runbook__selected">
            <div><span>Selected stack</span><button type="button" onClick={() => { setSelectedIds([]); setActivePreset(null); }}>clear</button></div>
            <ul>
              {selected.map((candidate) => (
                <li key={candidate.provider.id}>
                  <span>{candidate.provider.label}</span>
                  <button type="button" onClick={() => toggleSource(candidate.provider.id)} aria-label={`Remove ${candidate.provider.label}`} title={`Remove ${candidate.provider.label}`}>×</button>
                </li>
              ))}
              {selected.length === 0 ? <li className="stack-runbook__empty">Select at least one source.</li> : null}
            </ul>
          </div>

          <pre className="stack-runbook__code" tabIndex={0}>{runbook.text}</pre>
          <div className="stack-runbook__actions">
            <button type="button" onClick={copyRunbook} disabled={selected.length === 0}>copy runbook</button>
            <span>{runbook.executableCount} reviewable commands</span>
          </div>
          <p className="stack-runbook__feedback" aria-live="polite">{feedback}</p>
        </div>
      </div>

      <div className="stack-boundary" aria-label="Runbook trust boundary">
        <div><b>1 · local</b><span>Commands run on your machine. This page makes no provider calls.</span></div>
        <div><b>2 · preview</b><span>The runbook ends with <code>sync --dry-run</code>, before any publish step.</span></div>
        <div><b>3 · explicit</b><span>Planned sources stay comments. Upload remains opt-in and commented.</span></div>
      </div>
    </section>
  );
}
