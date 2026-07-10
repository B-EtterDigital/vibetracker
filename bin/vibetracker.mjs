#!/usr/bin/env node
// npx entrypoint. The CLI is authored in TypeScript and runs via Node's native type
// stripping (Node >= 23.6, unflagged). This launcher just resolves + imports the entry,
// so `npx vibetracker ...` works without a build step for v0.x. (A bundled dist is the
// planned fast-follow to drop the Node-version requirement.)
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const entry = join(here, "..", "packages", "cli", "src", "vibetracker.ts");
await import(pathToFileURL(entry).href);
