import { test } from "node:test";
import assert from "node:assert/strict";
import { adapterScaffold } from "../scaffold-adapter.ts";

test("adapter scaffold creates source, fixture, docs, and a golden test", () => {
  const files = adapterScaffold("my-provider");
  const paths = files.map((file) => file.path).sort();
  assert.deepEqual(paths, [
    "packages/adapters/src/my-provider/README.md",
    "packages/adapters/src/my-provider/__fixtures__/usage.sample.json",
    "packages/adapters/src/my-provider/__tests__/normalize.test.ts",
    "packages/adapters/src/my-provider/client.ts",
    "packages/adapters/src/my-provider/index.ts",
    "packages/adapters/src/my-provider/normalize.ts",
  ]);
  assert.match(files.find((file) => file.path.endsWith("index.ts"))?.content ?? "", /createMyProviderAdapter/);
  assert.match(files.find((file) => file.path.endsWith("normalize.test.ts"))?.content ?? "", /normalizer emits positive usage records/);
});

test("adapter scaffold sanitizes ids and rejects empty ids", () => {
  assert.equal(adapterScaffold("Cool.Provider!")[0].path, "packages/adapters/src/coolprovider/client.ts");
  assert.throws(() => adapterScaffold("!!!"), /adapter id/);
});
