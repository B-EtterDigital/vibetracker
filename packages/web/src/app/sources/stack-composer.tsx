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
const DOMAIN_LABELS: Record<SourceDomain, string> = {
  all: "all sources",
  ai: "AI usage",
  dev: "dev costs",
  creative: "creative subs",
};

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
  const visibilityPercent = runbook.diagnosis.selectedCount
    ? 100 - runbook.diagnosis.trackablePercent
    : 0;

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

  function removePlannedSources() {
    const plannedIds = new Set(
      selected.filter((candidate) => candidate.path === "planned").map((candidate) => candidate.provider.id),
    );
    setSelectedIds((current) => current.filter((id) => !plannedIds.has(id)));
    setActivePreset(null);
    flash(`${plannedIds.size} planned ${plannedIds.size === 1 ? "source" : "sources"} removed`);
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
                {DOMAIN_LABELS[value]}
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
            <div><b>{runbook.counts.connect}</b><span>connect</span><small>setup command</small></div>
            <div><b>{runbook.counts.detect}</b><span>detect</span><small>local discovery</small></div>
            <div><b>{runbook.counts.manual}</b><span>manual</span><small>review / import</small></div>
            <div><b>{runbook.counts.planned}</b><span>planned</span><small>mapped only</small></div>
          </div>

          <section className={`stack-diagnosis stack-diagnosis--${runbook.diagnosis.state}`} aria-labelledby="stack-diagnosis-title">
            <div className="stack-diagnosis__status">
              <span>STACK READINESS</span>
              <b>{runbook.diagnosis.label}</b>
            </div>
            <div className="stack-diagnosis__message">
              <h3 id="stack-diagnosis-title">{runbook.diagnosis.headline}</h3>
              <p>{runbook.diagnosis.explanation}</p>
            </div>
            <div
              className="stack-diagnosis__meter"
              role="img"
              aria-label={`${runbook.diagnosis.automaticPercent}% automatic, ${runbook.diagnosis.manualPercent}% manual, ${visibilityPercent}% visibility-only`}
            >
              <span className="stack-diagnosis__meter-auto" style={{ width: `${runbook.diagnosis.automaticPercent}%` }} />
              <span className="stack-diagnosis__meter-manual" style={{ width: `${runbook.diagnosis.manualPercent}%` }} />
              <span className="stack-diagnosis__meter-gap" style={{ width: `${visibilityPercent}%` }} />
            </div>
            <dl className="stack-diagnosis__metrics">
              <div><dt>trackable now</dt><dd>{runbook.diagnosis.selectedCount ? `${runbook.diagnosis.trackableCount}/${runbook.diagnosis.selectedCount}` : "—"}</dd></div>
              <div><dt>automatic</dt><dd>{runbook.diagnosis.automaticCount}</dd></div>
              <div><dt>endpoint verified</dt><dd>{runbook.diagnosis.verifiedCount}</dd></div>
              <div><dt>visibility only</dt><dd>{runbook.diagnosis.visibilityOnly.length}</dd></div>
            </dl>
            <div className="stack-diagnosis__next">
              <p><b>NEXT //</b> {runbook.diagnosis.nextAction}</p>
              {runbook.diagnosis.visibilityOnly.length ? (
                <button type="button" onClick={removePlannedSources}>remove planned ({runbook.diagnosis.visibilityOnly.length})</button>
              ) : null}
            </div>
          </section>

          <div className="stack-runbook__selected">
            <div><span>Selected evidence · source → collection path</span><button type="button" onClick={() => { setSelectedIds([]); setActivePreset(null); }}>clear</button></div>
            <ul>
              {selected.map((candidate) => (
                <li key={candidate.provider.id}>
                  <span>
                    <b>{candidate.provider.label}</b>
                    <small title={candidate.provider.method}>{candidate.provider.method}</small>
                  </span>
                  <em className={`stack-path stack-path--${candidate.path}`}>{candidate.pathLabel}</em>
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
        <div><b>2 · collect</b><span>The runbook seals <code>sync --receipt</code>, then keeps upload behind a separate dry-run.</span></div>
        <div><b>3 · explicit</b><span>Planned sources stay comments. Upload remains opt-in and commented.</span></div>
      </div>
    </section>
  );
}
