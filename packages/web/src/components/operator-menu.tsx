"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import {
  filterOperatorRoutes,
  operatorRouteIsActive,
  type OperatorLane,
  type OperatorRoute,
} from "./operator-menu-model";
import styles from "./operator-menu.module.css";

const LANES: readonly OperatorLane[] = ["read", "operate", "system"];
const LANE_LABEL: Record<OperatorLane, string> = {
  read: "Read the signal",
  operate: "Run the tracker",
  system: "Inspect the system",
};

export function OperatorMenu() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const routes = useMemo(() => filterOperatorRoutes(query), [query]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details && !details.contains(event.target as Node)) {
        details.open = false;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function closeMenu(restoreFocus = false) {
    const details = detailsRef.current;
    if (!details) return;
    details.open = false;
    setOpen(false);
    setQuery("");
    if (restoreFocus) details.querySelector("summary")?.focus();
  }

  function onToggle() {
    const isOpen = Boolean(detailsRef.current?.open);
    setOpen(isOpen);
    if (isOpen) requestAnimationFrame(() => inputRef.current?.focus());
    else setQuery("");
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    const links = routes
      .map((route) => linkRefs.current.get(route.href))
      .filter((link): link is HTMLAnchorElement => Boolean(link));
    if (links.length === 0) return;

    event.preventDefault();
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (current < 0) {
      links[event.key === "ArrowDown" ? 0 : links.length - 1]?.focus();
      return;
    }
    const delta = event.key === "ArrowDown" ? 1 : -1;
    links[(current + delta + links.length) % links.length]?.focus();
  }

  function routeLink(route: OperatorRoute) {
    const active = operatorRouteIsActive(pathname, route.href);
    return (
      <a
        className={styles.route}
        data-active={active || undefined}
        href={route.href}
        aria-current={active ? "page" : undefined}
        key={route.href}
        ref={(node) => {
          if (node) linkRefs.current.set(route.href, node);
          else linkRefs.current.delete(route.href);
        }}
      >
        <span>{route.index}</span>
        <b>
          {route.label}
          <small>{route.description}</small>
        </b>
        {active ? <em className={styles.live}>live</em> : null}
      </a>
    );
  }

  return (
    <details className="hdr-menu" ref={detailsRef} onToggle={onToggle}>
      <summary aria-label="Open product menu" title="Product menu">
        <i aria-hidden="true"><span /><span /><span /></i>
      </summary>
      <nav className={styles.panel} aria-label="Product menu" onKeyDown={onMenuKeyDown}>
        <div className={styles.telemetry}>
          <strong>VTK://OPERATOR-SWITCHER</strong>
          <span>{String(routes.length).padStart(2, "0")}/{String(filterOperatorRoutes("").length).padStart(2, "0")} surfaces</span>
        </div>
        <label className={styles.search}>
          <span>Filter</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Filter product menu"
            placeholder="profile, proof, scan, identity..."
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {LANES.map((lane) => {
          const laneRoutes = routes.filter((route) => route.lane === lane);
          if (laneRoutes.length === 0) return null;
          return (
            <div className={styles.lane} key={lane}>
              <h2>{LANE_LABEL[lane]}</h2>
              <div className={styles.routes}>{laneRoutes.map(routeLink)}</div>
            </div>
          );
        })}
        {routes.length === 0 ? (
          <p className={styles.empty} role="status">No operator surface matches that signal.</p>
        ) : null}
      </nav>
    </details>
  );
}
