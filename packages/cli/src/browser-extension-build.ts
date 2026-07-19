// Build a clean, Chrome-loadable copy of the browser extension.
//
// WHY: Chrome loads the ENTIRE pointed folder as the extension and rejects any entry whose name
// starts with "_" ("Filenames starting with '_' are reserved for use by the system") — so the
// source package, which holds `__tests__/`, tooling, and docs alongside the runtime files, can
// never be loaded directly. This copies ONLY the runtime files into a guaranteed-writable directory
// so "Load unpacked" always points at a pristine folder that can't be rejected.

import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { basename, join } from "node:path";

// True only for paths that belong in the loaded extension. Everything Chrome rejects or doesn't need
// (reserved "_" names like __tests__, tooling manifests, docs, TS sources, sourcemaps, test files)
// is excluded. Allowlist-by-exclusion keeps a future icons/ dir or added .mjs working automatically.
export function isRuntimeExtensionPath(pathname: string): boolean {
  const base = basename(pathname);
  if (base.startsWith("_")) return false;                       // __tests__, _locales (unused), etc.
  if (base === "node_modules") return false;
  if (base === "package.json" || base === "tsconfig.json") return false;
  if (base === "module.sweetspot.json" || base === "README.md") return false;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(base)) return false;  // test files
  if (/\.(ts|tsx|map)$/.test(base)) return false;               // TS sources / sourcemaps never ship
  return true;
}

/** Copy the extension's runtime files from `sourceDir` into a clean `destDir` (rebuilt each call).
 *  Returns `destDir`. Throws if the source has no manifest.json so a broken build never looks OK. */
export function buildBrowserExtension(sourceDir: string, destDir: string): string {
  if (!existsSync(join(sourceDir, "manifest.json"))) {
    throw new Error(`browser extension source has no manifest.json: ${sourceDir}`);
  }
  rmSync(destDir, { recursive: true, force: true });            // always a pristine rebuild
  mkdirSync(destDir, { recursive: true });
  cpSync(sourceDir, destDir, { recursive: true, filter: (from) => isRuntimeExtensionPath(from) });
  return destDir;
}
