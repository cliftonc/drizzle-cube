# Executor Summary — #936 DBT Sync to Cubes v3

## What was done

Implemented the `drizzle-cube dbt generate` command per the architect plan:
a local, artifact-first generator that reads dbt `manifest.json` /
`catalog.json`, normalizes materialized Postgres models, and emits Drizzle
`pg-core` schema + one Drizzle Cube file per model + a root `index.ts`. Both
v2 review fixes are baked in as first-class behaviour: identifier-collision
detection (throws before emit) and composite-PK handling (every key column
marked `primaryKey: true` + `countDistinct` baseline, never downgraded to
`count`).

### Files changed

**Modified existing files:**
- `src/cli/index.ts` — replaced synchronous router with async `main()` that
  awaits command handlers, catches errors → stderr + exit 1. Added
  `dbt generate` route and `dbt` help route; preserved `charts init|list`.
- `vite.config.cli.ts` — extended `rollupOptions.external` with the Node
  builtins used by the dbt command (`node:fs/promises`,
  `node:readline/promises`, `node:process`, `node:os`, plus non-prefixed
  equivalents).
- `tsconfig.json` — added self-reference path
  `"drizzle-cube/server": ["./src/server/index.ts"]` so generated fixture
  `.ts` files importing `drizzle-cube/server` typecheck against source.
- `README.md` — added a "Generate schema and cubes from dbt artifacts"
  section linking to `docs/dbt-generate.md`.

**New source files:**
- `src/cli/dbt/types.ts` — shared runtime types (SecurityMode,
  DbtGenerateOptions, GeneratedModel, etc.); no `as any`.
- `src/cli/dbt/naming.ts` — deterministic toCamelCase/toPascalCase/
  toKebabCase/humanizeTitle/sanitizeIdentifier/makeUniqueIdentifier
  (camelCase/PascalCase boundary splitting, reserved-word suffixing).
- `src/cli/dbt/postgres-types.ts` — `mapPostgresCatalogType` allowlist;
  returns `null` for unsupported types (no placeholder).
- `src/cli/dbt/parse-artifacts.ts` — `loadDbtArtifacts` (file I/O) +
  pure `parseDbtArtifacts` with local `unknown` type guards; extracts
  relationship tests from both `{name,value}` and direct-map kwargs shapes.
- `src/cli/dbt/normalize.ts` — filters materialized models, merges
  manifest/catalog, applies type mapping + warn-and-skip, detects PKs
  (composite-aware), builds baseline + explicit measures, applies security
  skip policy, builds `belongsTo` edges, runs collision detection across
  four namespaces (throws on collision), deterministic sorting.
- `src/cli/dbt/emit-schema.ts` — emits `schema.ts` (sorted builder imports,
  pgTable first, `schema` map + `Schema` type).
- `src/cli/dbt/emit-cubes.ts` — emits `cubes/<file>.ts` + `index.ts`; uses
  non-generic public types, string `targetCube` joins with direct Drizzle
  column refs (imports target tables), composite-PK `countDistinct` via
  `concat_ws` `sql` template, security `where` via `eq` with honest
  narrowing of the loose `SecurityContext` value.
- `src/cli/dbt/write-output.ts` — `writeGeneratedOutput` with generated
  ownership header, path-traversal guard, normal/dry-run/check modes;
  `--check` compares full expected-vs-existing sets (removals = drift);
  normal mode deletes stale generated files.
- `src/cli/dbt/generate.ts` — orchestrates load → normalize → emit → write.
- `src/cli/commands/dbt.ts` — `dbtGenerate` + `printDbtHelp`; the only
  module touching `process`/`readline`/console; flag parsing, security-mode
  resolution (flags/interactive/non-interactive), warning + summary output,
  `--check` drift → throw.

**New documentation:**
- `docs/dbt-generate.md` — full usage, options, security modes, output
  layout, PK/measure/join behaviour, `--dry-run`/`--check`, Postgres type
  support table, and v1 limitations.

**New tests + fixtures (all DB-free, in the `cli` vitest project):**
- `tests/cli/dbt/naming.test.ts`
- `tests/cli/dbt/postgres-types.test.ts`
- `tests/cli/dbt/parse-artifacts.test.ts`
- `tests/cli/dbt/normalize.test.ts` (includes collision-throw and
  composite-PK coverage for both v2 fixes)
- `tests/cli/dbt/emit.test.ts` (byte-for-byte vs fixtures + composite-PK
  `countDistinct` + non-generic public-type + no-security assertions)
- `tests/cli/dbt/write-output.test.ts` (temp dirs: normal/conflict/force/
  stale-delete/dry-run/check-ok/check-changed/check-missing/check-orphan)
- `tests/cli/dbt/command.test.ts` (required-arg/dialect/security-flag/
  no-security/dry-run-summary/`--check`-drift validation; mocks generator)
- `tests/fixtures/dbt/postgres-simple/{manifest,catalog}.json` (orders,
  customers, order_lines composite-PK model, ephemeral_rollup skipped,
  relationships test, explicit measure)
- `tests/fixtures/dbt/postgres-simple/expected/{schema.ts,index.ts,
  cubes/{orders,customers,order-lines}.ts}` (expected output that
  typechecks against `drizzle-cube/server` via the tsconfig self-reference)

## Test / lint / typecheck results

```
$ npm run test:cli
 RUN  v4.1.9
 Test Files  8 passed (8)
      Tests  103 passed (103)
   Duration  1.35s

$ npm run build:cli
vite v8.0.16 building client environment for production...
✓ 12 modules transformed.
dist/cli/index.cjs  73.23 kB │ gzip: 20.33 kB
✓ built in 85ms

$ npm run lint
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
(no output — clean)

$ npm run typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json
(no output — clean)
```

The full `npm run test` gate cannot pass in this sandbox (pre-existing
limitation): the `server` vitest project's `globalSetup` tries to connect to
Postgres on `127.0.0.1:54333` and fails with `ECONNREFUSED` because
`docker-compose` is unavailable. This is not caused by the change — the new
dbt generator code is entirely DB-free and covered by the `cli` project
(103 passing). The plan and guardrails report document this exact
limitation; the achievable verification set
(`test:cli && build:cli && lint && typecheck`) is complete and green.

## Deviations from the plan / known issues

- **Security `where` narrowing**: the public `SecurityContext` is typed
  `{ [key: string]: unknown }`, so `eq(col, ctx.securityContext.x)` does not
  satisfy the drizzle `eq` overloads when typechecked against source. The
  emitter narrows the operand with `as <tsType>` derived from the column's
  dimension type (`number`/`string`/`boolean`/`Date | string`). This is
  honest narrowing of a genuinely-loose public type, not
  validator-silencing — no `as any` is used anywhere in the pipeline.
- **Join `on` imports**: the plan specified string `targetCube` to avoid
  circular imports, but the `on` array still references target Drizzle
  column objects, so the cube file imports the target table from
  `../schema.js` in addition to its own. This is required for the generated
  code to compile and resolves the `Cannot find name 'Customers'` error.
- **PK detection**: v1 detects PKs only from
  `meta.drizzle_cube.primary_key: true` (the plan's "confident source").
  dbt `unique`+`not_null` test-based detection was scaffolded but removed as
  dead code since the portable v1 signal is the meta flag; the fixture uses
  meta flags. This is explicitly documented in `docs/dbt-generate.md`.
- **`--config` flag**: parsed and stored on `DbtGenerateOptions` but not
  fully wired beyond security/naming, as the plan reserved it for v1.
- **`bigint({ mode: 'number' })` and `date`** were both verified to compile
  against the installed `drizzle-orm` (`0.45.0`) before committing to them,
  per the plan's instruction.
