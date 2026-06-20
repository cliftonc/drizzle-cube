# Executor Summary — #936 DBT Sync to Cubes v4

## What was done

Implemented `drizzle-cube dbt generate` — a local, artifact-first generator that
reads dbt `manifest.json` + `catalog.json`, normalizes materialized Postgres
models, and emits a Drizzle `pg-core` schema plus one cube file per model plus a
root `index.ts` exporting `allCubes`. Followed the architect plan's exhaustive
file manifest faithfully.

### Files changed

**Modified**
- `src/cli/index.ts` — async `main()` dispatch with top-level
  `main().catch(...)` error handling; added `dbt generate` + `dbt` routes;
  updated help text to list `charts` and `dbt`; preserved `charts init|list`.
- `vite.config.cli.ts` — expanded `rollupOptions.external` for the new Node
  builtins (`node:fs/promises`, `node:readline/promises`, `node:process`,
  `node:os`, plus bare forms) used by the dbt command.
- `README.md` — new `## Generate schema and cubes from dbt artifacts` section
  before `## Analysis Modes`, linking to `docs/dbt-generate.md`.

**New source**
- `src/cli/dbt/types.ts` — shared runtime types (SecurityMode, DbtGenerateOptions,
  GeneratorWarning, GeneratedFile, DbtModel/Column, ParsedDbtArtifacts,
  GeneratedModel/Column/Measure/Relationship, WriteResult, EmitContext,
  GenerationResult). No `as any`.
- `src/cli/dbt/naming.ts` — pure deterministic helpers: toCamelCase,
  toPascalCase, toKebabCase, humanizeTitle (acronym uppercasing),
  sanitizeIdentifier (reserved-keyword/digit handling), makeUniqueIdentifier,
  quoteStringLiteral.
- `src/cli/dbt/postgres-types.ts` — Postgres catalog type → Drizzle builder +
  cube dimension type mapper. Unsupported types return `null` (warn-and-skip);
  never a placeholder `text`.
- `src/cli/dbt/parse-artifacts.ts` — `loadDbtArtifacts` (only file I/O) +
  pure `parseDbtArtifacts`; local `unknown` guards (no `as any`);
  `relationships` test extraction handling both `attached_node`/`depends_on`
  (array form) + `kwargs.field` direct and `{ name, value }` shapes.
- `src/cli/dbt/normalize.ts` — 4-phase normalization: filter supported
  materializations (warn-and-skip), shape derivation + collision detection
  (throw `IDENTIFIER_COLLISION`), per-model column mapping / PK detection
  (meta-only) / security-skip cascade / explicit-measure validation,
  `belongsTo` edges only between kept models/columns.
- `src/cli/dbt/emit-schema.ts` — deterministic `schema.ts` emitter (sorted
  imports/tables/columns).
- `src/cli/dbt/emit-cubes.ts` — deterministic cube-file + `index.ts` emitter;
  imports `defineCube` + non-generic `QueryContext`/`BaseQueryDefinition` from
  `drizzle-cube/server`; direct Drizzle column refs; string `targetCube`;
  composite-PK `countDistinct` over `concat_ws`.
- `src/cli/dbt/write-output.ts` — `GENERATED_HEADER`, `writeGeneratedOutput`
  with generated-header ownership, path-traversal guard, full expected-vs-existing
  drift comparison (changed/missing/orphaned) in `--check`, stale deletion in
  normal mode.
- `src/cli/dbt/generate.ts` — orchestration pipeline (load → normalize → emit →
  write).
- `src/cli/commands/dbt.ts` — `dbtGenerate` + `printDbtHelp`; the only module
  touching `process`/`readline`/console/CLI paths; arg parsing, interactive
  security prompt (empty = intentional no-security), warning + summary output,
  non-zero exit on `--check` drift.
- `docs/dbt-generate.md` — full option reference, security modes, output layout,
  warn-and-skip behavior, `--dry-run`, `--check` (incl. orphaned drift),
  Postgres type support table, `meta.drizzle_cube.*` overrides, v1 limitations.

**New tests + fixtures (DB-free, `cli` vitest project)**
- `tests/cli/dbt/naming.test.ts`
- `tests/cli/dbt/postgres-types.test.ts`
- `tests/cli/dbt/parse-artifacts.test.ts`
- `tests/cli/dbt/normalize.test.ts`
- `tests/cli/dbt/emit.test.ts` — byte-for-byte comparison against golden
  fixtures + structural assertions (non-generic public types, direct column
  refs, string `targetCube`, security/no-security variants, composite-PK
  `countDistinct`).
- `tests/cli/dbt/write-output.test.ts` — temp dirs: normal write, overwrite,
  conflict refusal + `--force`, dry-run no-write, check success/changed/orphan,
  normal-mode stale deletion, path-traversal refusal.
- `tests/cli/dbt/command.test.ts` — required-flag/dialect/security validation,
  `--no-security` warning, summary formatting, `--check` drift summary + throw.
- `tests/fixtures/dbt/postgres-simple/manifest.json` — `orders`, `customers`,
  `order_lines` (composite PK), `ephemeral_rollup` (skip), relationships test,
  explicit `totalAmount` sum measure.
- `tests/fixtures/dbt/postgres-simple/catalog.json` — catalog columns.
- `tests/fixtures/dbt/postgres-simple/expected/schema.ts`,
  `expected/cubes/{orders,customers,order-lines}.ts`, `expected/index.ts` —
  golden output (compiles against `drizzle-cube/server` + `drizzle-orm/pg-core`).

## Test / lint / typecheck results

```
$ npm run test:cli
 RUN  v4.1.9 /home/agent/workspace/drizzle-cube
 Test Files  8 passed (8)
      Tests  90 passed (90)
   Duration  1.35s
```

```
$ npm run lint
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
(no output — clean)
```

```
$ npm run typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json
(no errors)
```

```
$ npm run build:cli
> vite build --config vite.config.cli.ts
dist/cli/index.cjs  65.47 kB │ gzip: 17.63 kB
✓ built in 140ms
```

End-to-end smoke test via the built binary also verified: `dbt` help,
`dbt generate --dry-run`, real generate, `--check` no-drift, and `--check`
detecting an orphaned generated file + exiting non-zero.

### Note on `npm run test` (full gate)

The full `npm run test` includes the `server` vitest project, which requires a
live Postgres on `127.0.0.1:54333` via `docker-compose` (`globalSetup` runs
`tests/setup/globalSetup.ts`). That service is unavailable in the sandbox
(`connect ECONNREFUSED 127.0.0.1:54333`), so the server project cannot run here.
This is a pre-existing limitation explicitly flagged in the architect plan:
"`npm run test:cli` runs without containers and is the authoritative gate here."
The failure is purely the DB connection in globalSetup — no `cli`/dbt code is
involved. The `cli` project (the home for this DB-free feature) passes
completely.

## Deviations from the plan

- **Composite-PK baseline `countDistinct` SQL expression.** The plan's item 11
  described the measure's `sql` field as
  `sql\`count(distinct concat_ws('|', table.a, table.b))\``. The runtime measure
  builder wraps a `countDistinct` measure's `sql` in `countDistinct(baseExpr)`
  (`src/server/builders/measure-builder.ts:475-476`), so emitting the full
  `count(distinct ...)` as the measure `sql` would double-wrap into
  `count(distinct count(distinct concat_ws(...)))` — invalid SQL. To stay
  consistent with the single-PK convention (`sql: table.pkColumn`, runtime wraps
  to `count(distinct pk)`) and the existing dev cubes, the composite baseline
  emits `sql: sql\`concat_ws('|', ${table.a}, ${table.b})\``, letting the
  runtime produce `count(distinct concat_ws('|', a, b))`. This is the
  semantically correct form and matches the runtime wrapping contract. The
  golden fixture reflects this. (No test asserts the plan's literal form; the
  emit test asserts the `concat_ws` expression and `countDistinct` type.)
- **`makeUniqueIdentifier`** is implemented in `naming.ts` and unit-tested per
  the plan, but `normalize.ts` does not call it: collisions throw
  `IDENTIFIER_COLLISION` (per the plan's risks section — "a stopped run is
  better than a silent overwrite"), so no auto-suffixing of model-derived
  identifiers is performed. The import was therefore not added to `normalize.ts`.

## Known issues

None. All targeted gates (`test:cli`, `lint`, `typecheck`, `build:cli`) pass
clean. The only un-runnable gate (`npm run test` server project) is blocked by
the sandbox's lack of live Postgres, a pre-existing environmental limitation
unrelated to this change.
