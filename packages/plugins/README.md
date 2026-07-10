# VibeTRACKER Plugin Path

Community adapters can start outside the core CLI by shipping a small manifest plus an
adapter package. The core registry stays honest: a plugin is discoverable before it is
trusted, and it is not counted as a built core adapter until tests and proof graduate it.

Minimum plugin folder:

```text
my-vibetracker-plugin/
  vibetracker.plugin.json
  package.json
  src/index.ts
  __fixtures__/usage.sample.json
  __tests__/normalize.test.ts
```

The manifest shape is documented in `manifest.schema.json`.
