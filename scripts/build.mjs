// Bundle the CLI into a single, dependency-free JS file that runs on any Node >= 18.
// This is what gets published to npm, so `npx vibetracker` works for everyone —
// no local repo, no TypeScript, no Node-version requirement.
import { build } from "esbuild";
import { chmodSync } from "node:fs";

await build({
  entryPoints: ["packages/cli/src/vibetracker.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: "dist/vibetracker.js",
  // Some bundled CommonJS provider/export dependencies require Node built-ins at runtime.
  // The shebang from the entry file stays first; this banner just provides require in ESM.
  banner: { js: "import { createRequire as __vtCreateRequire } from 'node:module'; const require = __vtCreateRequire(import.meta.url);" },
  external: ["parquetjs-lite"],
  loader: { ".json": "json" },
  legalComments: "none",
});

chmodSync("dist/vibetracker.js", 0o755);
console.log("✓ built dist/vibetracker.js (bundled, Node >=18; Parquet export loads parquetjs-lite lazily)");
