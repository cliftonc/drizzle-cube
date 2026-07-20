# Architect Plan — #936 DBT Sync to Cubes v4

## Problem Statement

Drizzle Cube's CLI (`src/cli/index.ts:21-48`) exposes only the synchronous `charts init|list` route — there is no `dbt generate` command, no async command dispatch, and no top-level error handling around command handlers. The CLI area is intentionally DB-free and deterministic, and its local guidance (`src/cli/CLAUDE.md:16-24`) now codifies the generator conventions that prior attempts rediscovered in review: unsupported types → **warn-and-skip** (never throw on one column, never silently default), composite/multi-column primary keys → emit a `primaryKey: true` dimension per key column plus a baseline `countDistinct`, and `--check` drift detection must compare the **full expected-vs-existing output set** (including removed/orphaned files, not just changed ones) (`src/cli/CLAUDE.md:57-90`). Generated cube files must compile against the public authoring API exported from `drizzle-cube/server` — `defineCube` at `src/server/index.ts:86`, and `QueryContext`/`BaseQueryDefinition`/`Cube` via `export type * from './types/index.js'` (`src/server/index.ts:153`) → `src/server/types/index.ts` → `src/server/types/cube.ts:42-113` — and the cube contract expects direct Drizzle column objects for `sql`, dimensions, measures, and joins (`src/server/types/cube.ts:42-53`). The repository already has a DB-free `cli` vitest project (`vitest.config.ts:56-59`, globs `tests/cli/**`, no `globalSetup`, no Docker) and a seed test (`tests/cli/charts-list.test.ts`), so the dbt generator is covered there without containers.

## Summary of what needs to change

Add a local, artifact-first `drizzle-cube dbt generate` command that reads dbt `manifest.json` and `catalog.json`, normalizes materialized Postgres models into a deterministic internal representation, and emits generated Drizzle `pg-core` schema plus one cube file per model plus a root `index.ts` exporting `allCubes`. The command must support explicit security choices via flags or interactive prompt (empty prompt answer = intentional no-security), no network/dbt runtime/YAML parsing, deterministic `--dry-run` and `--check` (full expected-vs-existing drift including orphaned files), generated-file ownership header checks, and **visible warnings for every unsupported/skipped input**. Add DB-free Vitest coverage with byte-for-byte golden fixtures, update CLI build externals for new Node builtins, and document the command and v1 limitations.

This is the fourth attempt. A prior branch (`lastlight/936-dbt-sync-to-cubes-v3`) reached 107 passing `cli`-project tests and a reviewer APPROVED verdict but was closed unmerged. The v4 branch is fresh from `main`, which has since merged PR #940 (`src/cli/CLAUDE.md` conventions + the `cli` vitest project). This plan reconstructs the proven v3 implementation **and** lands the codified conventions by default. The executor should implement faithfully against this manifest; the design is already validated.

## Files to modify — exhaustive manifest

### Existing files

1. `src/cli/index.ts` (`command`/`subcommand` router at `src/cli/index.ts:21-48`)
   - Import `dbtGenerate` and `printDbtHelp` from `./commands/dbt.js`.
   - Replace the synchronous top-level `if` body with an `async function main(): Promise<void>` that awaits command handlers.
   - Add `main().catch((err: Error) => { console.error(err.message); process.exit(1) })` at module bottom — this is the top-level error handling that surfaces `Error` messages from handlers to stderr and exits `1`.
   - Add route: `drizzle-cube dbt generate` → `await dbtGenerate(process.argv.slice(4))`.
   - Add route/help: `drizzle-cube dbt` → `printDbtHelp()`.
   - Update top-level help text to list both `charts` and `dbt`.
   - Preserve existing `charts init|list` behavior unchanged inside `main()`.

2. `vite.config.cli.ts` (`rollupOptions.external` at `vite.config.cli.ts:12-14`)
   - Replace the external array with:
     ```ts
     external: [
       'node:fs', 'node:path', 'node:util', 'node:fs/promises',
       'node:readline/promises', 'node:process', 'node:os',
       'fs', 'path', 'fs/promises', 'readline/promises', 'process', 'os',
     ],
     ```
   - Needed because the dbt command/modules import `node:fs/promises`, `node:readline/promises`, `node:process`, and `node:os`. Add both `node:`-prefixed and bare forms so the emitted CJS bundle externalizes whichever the bundler references. Verify with `npm run build:cli`.

3. `README.md` (insert a new section after the Quick Start block, before `## Analysis Modes` near `README.md:126`; alternatively before `## Documentation` at `README.md:244`)
   - Add a concise section titled `## Generate schema and cubes from dbt artifacts`.
   - Include the command:
     ```bash
     npx drizzle-cube dbt generate --manifest target/manifest.json --catalog target/catalog.json --dialect postgres --out ./src/cubes/generated --security-column organisation_id --security-context organisationId
     ```
   - Link to `docs/dbt-generate.md` for full options/limitations.
   - State v1 is local artifact-only, Postgres-only, and does not clone GitHub repos or run dbt.

### New source files

4. `src/cli/commands/dbt.ts` — the only module that touches `process`, `readline`, console, or CLI-supplied filesystem paths.
   - Export `async function dbtGenerate(argv = process.argv.slice(4)): Promise<void>`.
   - Export `function printDbtHelp(): void` (help text listing `dbt generate`, all options, and a pointer to `docs/dbt-generate.md`).
   - Parse options with `parseArgs` (`node:util`): `--manifest`, `--catalog`, `--dialect`, `--out`, `--security-column`, `--security-context`, `--no-security` (boolean default false), `--dry-run` (boolean default false), `--check` (boolean default false), `--force` (boolean default false), and `--config` (string, reserved). Use `strict: false`.
   - `requireRequiredFlags`: throw with a usage hint if any of `--manifest`, `--catalog`, `--dialect`, `--out` is missing.
   - `validateDialect`: throw `Unsupported dialect '<x>'. v1 supports: postgres.` for anything other than `postgres`.
   - `resolveSecurityMode` (async):
     - `--no-security` → `{ kind: 'none' }`; throw if combined with `--security-column`/`--security-context`; print a stderr warning that no cube-level security filter will be applied.
     - Both `--security-column` and `--security-context` → `{ kind: 'filter', columnName, contextProperty }`.
     - Exactly one of the two present → throw (both required together).
     - Neither + `process.stdin.isTTY && process.stdout.isTTY` → prompt via `node:readline/promises` `createInterface({ input: stdin, output: stdout })` for the tenant/organisation column; **empty answer = `{ kind: 'none' }` with warning**; non-empty answer derives `contextProperty` from lower-camel column name unless `--security-context` is provided. Close the readline interface in a `finally`.
     - Neither + non-TTY → throw requiring `--no-security` or both filter flags.
   - Call `generateFromDbt(options)`, then `printWarnings(result.warnings)` to stderr, then `printSummary(...)` to stdout.
   - `printWarnings`: format each `GeneratorWarning` as `[drizzle-cube] <code>: <message> (model=<x> column=<y>)`.
   - `printSummary`:
     - `--check` branch: if `!write.drift` print `No drift detected.`; else print `Drift detected: <n> changed, <n> missing, <n> orphaned.` then list each category's paths (capped at 20 per category with an `… and N more` overflow line) under `changed:` / `missing:` / `orphaned:` headers.
     - non-check branch: prefix `[drizzle-cube] ` (or `[drizzle-cube dry-run] ` when `dryRun`); summarize `created/updated/deleted (stale)/conflicts` counts; list conflicting paths if any.
   - After summary, if `options.check && result.write.drift`, throw `new Error('Drift detected: generated output does not match the current dbt artifacts.')` so `main()`'s catch exits non-zero.

5. `src/cli/dbt/types.ts` — all shared runtime types; **no `as any` anywhere**.
   - `type SecurityMode = { kind: 'filter'; columnName: string; contextProperty: string } | { kind: 'none' }`.
   - `interface DbtGenerateOptions { manifestPath: string; catalogPath: string; dialect: 'postgres'; outDir: string; security: SecurityMode; dryRun: boolean; check: boolean; force: boolean; configPath?: string }`.
   - `interface GeneratorWarning { code: string; message: string; modelName?: string; columnName?: string }`.
   - `interface GeneratedFile { path: string; content: string }` (`path` is out-dir-relative POSIX).
   - `type SupportedMaterialization = 'table' | 'view' | 'incremental'`.
   - `interface DbtRelationshipTest { sourceModelId: string; targetModelId: string; sourceColumn: string; targetColumn: string }`.
   - `interface DbtColumn { name: string; type: string; index: number; comment?: string; description?: string; meta?: Record<string, unknown> }`.
   - `interface DbtModel { uniqueId: string; name: string; alias: string; schema: string; database?: string; resourceType: string; materialization: string; relationName: string; description?: string; meta?: Record<string, unknown>; columns: Record<string, DbtColumn> }`.
   - `interface ParsedDbtArtifacts { models: Record<string, DbtModel>; relationships: DbtRelationshipTest[] }`.
   - `interface GeneratedColumn { sqlName: string; propertyName: string; title: string; description?: string; builder: string; builderArgs?: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; primaryKey: boolean; notNull: boolean }`.
   - `interface GeneratedMeasure { name: string; title: string; type: string; sql?: string; description?: string; format?: string }`.
   - `interface GeneratedRelationship { sourceCube: string; targetCube: string; relationship: 'belongsTo'; on: Array<{ sourceColumn: string; targetColumn: string }> }`.
   - `interface GeneratedModel { dbtUniqueId: string; modelName: string; relationName: string; materialization: string; tableExport: string; cubeName: string; cubeExport: string; fileName: string; title: string; description?: string; columns: GeneratedColumn[]; measures: GeneratedMeasure[]; relationships: GeneratedRelationship[]; securityPropertyName?: string }`.
   - `interface WriteResult { created: string[]; updated: string[]; deleted: string[]; conflicts: string[]; missing: string[]; orphaned: string[]; drift: boolean }` — `missing` (expected files absent from disk) and `orphaned` (on-disk generated files no longer expected) are populated in `--check`/`--dry-run` so callers surface the full drift picture.
   - `interface EmitContext { manifestPath: string; catalogPath: string; dialect: 'postgres'; security: SecurityMode }`.
   - `interface GenerationResult { files: GeneratedFile[]; write: WriteResult; warnings: GeneratorWarning[] }`.

6. `src/cli/dbt/naming.ts` — pure, deterministic identifier/title helpers. No function touches the filesystem or `process`.
   - Export `toCamelCase`, `toPascalCase`, `toKebabCase`, `humanizeTitle`, `quoteStringLiteral`, `makeUniqueIdentifier`, `sanitizeIdentifier`.
   - `tokenize`: split snake_case, kebab-case, dotted names, spaces, and camelCase/PascalCase boundaries; discard empty tokens.
   - `toCamelCase`: `customer_id` → `customerId`, `order-lines` → `orderLines`, `orders.total` → `ordersTotal`.
   - `toPascalCase`: `customer_id` → `CustomerId`.
   - `toKebabCase`: used for file names (`order_lines` → `order-lines`).
   - `humanizeTitle`: title-case from lowercased tokens; uppercase allowlist acronyms (`id`, `url`, `uuid`, `sku`, `iso`, `utm`) so `customer_id` → `Customer ID`. Deterministic regardless of input case.
   - `sanitizeIdentifier`: strip non-`[A-Za-z0-9_]`, prefix names starting with a digit with `_`, append `_` to reserved TS keywords so emitted code always compiles; empty/invalid input becomes `_`. Never throws.
   - `makeUniqueIdentifier(base, used)`: suffix with a numeric counter when `base` is in `used`; mutate `used` in place.
   - `quoteStringLiteral`: double internal single quotes for SQL-name embedding.

7. `src/cli/dbt/postgres-types.ts` — Postgres catalog type → Drizzle builder + cube dimension type mapper.
   - Export `interface PostgresTypeMapping { builder: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; builderArgs?: string; warnings?: GeneratorWarning[] }`.
   - Export `mapPostgresCatalogType(type: string): PostgresTypeMapping | null`.
   - `normalizeType`: lowercase, strip `(...)` args.
   - Supported v1 mappings (verified against installed `drizzle-orm` pg-core):
     - integer-like: `smallint`, `integer`, `int`, `int4`, `serial`, `smallserial` → `integer` / `number`.
     - big integer-like: `bigint`, `int8`, `bigserial` → `bigint` with `builderArgs: "{ mode: 'number' }"` / `number`.
     - numeric/decimal: `numeric`, `decimal` → `numeric` / `number` (Drizzle stores strings; cube dimension `number`; documented limitation).
     - floating: `real`/`float4` → `real`; `double precision`/`float8` → `doublePrecision`; both `number`.
     - text: `text`, `varchar`, `character varying`, `char`, `character`, `uuid` → `text` / `string`.
     - boolean: `boolean`, `bool` → `boolean` / `boolean`.
     - time: `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `timestamptz`, `time` → `timestamp` / `time`; `date` → `date` / `time`.
     - JSON: `json`, `jsonb` → `jsonb` / `string`.
   - Return `null` for arrays (`[]` suffix), enums, geometry, network types, `bytea`, `interval`, `money`, user-defined/custom types, and anything unknown. **Callers must warn-and-skip** — never return a placeholder `text`.

8. `src/cli/dbt/parse-artifacts.ts` — artifact loading + pure parsing.
   - Export `async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<ParsedDbtArtifacts>` (the only file-I/O entry; uses `node:fs/promises` `readFile`).
   - Export pure `parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts` for tests.
   - Local type guards over `unknown` only (`isRecord`, `asString`, `asRecord`, `asNumber`, `getRecordField`, `getSubRecord`, `getStringField`, `getNumberField`) — **no `as any`**.
   - `requireNodes(artifact, label)`: throw naming the file if top-level `nodes` is missing or not an object.
   - `readArtifactJson`: read + `JSON.parse` with clear errors wrapping the cause.
   - Parse only `resource_type === 'model'` nodes; extract `name`, `alias` (fallback to name), `schema` (default `public`), `database`, `config.materialized` (default `view`), `relation_name` (fallback `"schema"."alias"`), `description`, `meta`, `columns`.
   - `attachCatalogColumns`: merge manifest column descriptions/meta with catalog column types by unique id + column SQL name; catalog columns are authoritative for the column set (they carry types). Models without a catalog entry keep an empty column map (normalizer warns-and-skips).
   - `parseRelationships`: iterate `resource_type === 'test'` nodes with `test_metadata.name === 'relationships'`. Source model from `attached_node` (fallback `depends_on.nodes`). Target model from `depends_on.nodes` (the second `model.` entry, else any `model.` entry). Source column from `column_name` (strip `"orders"."customer_id"` → `customer_id`). Target column from `kwargs.field` (default `''`), reading kwargs in both direct-map (`{ field: 'id' }`) and `{ name, value }` shapes. Omit tests that cannot resolve source/target (normalizer warns for unresolved edges).
   - Do not parse raw dbt YAML/Jinja; do not run dbt.

9. `src/cli/dbt/normalize.ts` — normalize parsed artifacts into `GeneratedModel[]`.
   - Export `function normalizeDbtArtifacts(artifacts: ParsedDbtArtifacts, options: { security: SecurityMode }): { models: GeneratedModel[]; warnings: GeneratorWarning[] }`.
   - Phase 1 — filter: keep only `materialization` in `{table, view, incremental}`. Warn-and-skip (`MODEL_SKIPPED`) `ephemeral` and any unsupported/missing materialization with model name + materialization. Warn-and-skip models with no catalog columns (schema generation needs types).
   - Phase 2 — shape derivation + collision detection: for each candidate derive `tableExport = toPascalCase(name)`, `cubeName = toPascalCase(name)`, `cubeExport = toCamelCase(name)+'Cube'`, `fileName = toKebabCase(name)`. Track `usedTableExports`/`usedCubeNames`/`usedCubeExports`/`usedFileNames` and `shapeOwners`. **Throw `IDENTIFIER_COLLISION`** when two models collide in any namespace (a silent overwrite is worse than a stopped run); message names both models and the colliding namespace+identifier.
   - Phase 3 — per-model column mapping, PK detection, security skip, measures:
     - `resolvePrimaryKeyColumns`: accept only `meta.drizzle_cube.primary_key: true` on a column (never infer from a column merely being named `id`). `readDrizzleCubeMeta` reads `meta.drizzle_cube` as a record.
     - For each column: `mapPostgresCatalogType(col.type)`; if `null` push `COLUMN_SKIPPED` (model, column, type) and **cascade** — if it was a PK column, delete it from the PK set. Otherwise build `GeneratedColumn` (PK → `primaryKey: true, notNull: true`; others nullable/conservative).
     - Security: `securityPropertyNameFor` returns the lowerCamel property if the model has the configured SQL column. If `security.kind === 'filter'` and the column is missing → `MODEL_SKIPPED` mentioning the security column. **Cascade**: if the security column was skipped above (unsupported type) → `MODEL_SKIPPED` mentioning "security column ... was skipped (unsupported type)". Never emit a model without row-level filtering when filter security was configured.
     - `buildBaselineMeasure`: ≥1 PK → `countDistinct` (single PK → `sql: table.pk`; composite → encoded `sql: 'concat_ws:propA,propB'` rendered by the emitter); no PK → plain `count` with a stable non-security column when one exists.
     - `parseExplicitMeasures`: read `meta.drizzle_cube.measures` (array) on the model. Validate `name`+`type` present, `type` in `EMITTABLE_MEASURE_TYPES` (`count`, `countDistinct`, `countDistinctApprox`, `sum`, `avg`, `min`, `max`, `runningTotal`, `number` — a safe subset of `MeasureType` at `src/server/types/core.ts:178-208`), no duplicate names. For numeric aggregates (`sum`/`avg`/`min`/`max`/`runningTotal`) require a referenced column that exists and has `dimensionType === 'number'`. Invalid → `MEASURE_SKIPPED` with model/column. Set `sql: tableExport.propertyName` when a column is referenced.
     - Measures = `[baseline, ...explicit]` sorted by name.
     - Columns sorted by catalog `index` then SQL name.
   - Phase 4 — relationships: build `belongsTo` edges only between **kept** models with **kept** columns. For each relationship whose source is this model: if target model was skipped/not emitted → `RELATIONSHIP_DROPPED` naming the skipped target; if source or target column was skipped → `RELATIONSHIP_DROPPED` naming the source column. Deduplicate by `targetCube|on`, sort by `targetCube`. Use string `targetCube` names (compiler resolves them; avoids circular imports between one-file-per-model cubes).
   - Sort `generated` by `fileName`.

10. `src/cli/dbt/emit-schema.ts` — deterministic `schema.ts` emitter.
    - Export `function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile` (path `'schema.ts'`).
    - `collectBuilders`: `pgTable` plus every used builder. `renderBuilderImport`: `pgTable` first, rest sorted alphabetically, from `drizzle-orm/pg-core`.
    - Header: `GENERATED_HEADER` + source line + regenerate-hint line.
    - `renderTableExport`: `export const <tableExport> = pgTable('<relation_name>', { ... })` per model in `fileName` order. `renderColumnProperty`: `builder('sqlname'[, args])` + `.primaryKey()` when PK + `.notNull()` when `notNull`-and-not-PK + `// description` trailing comment.
    - Emit `export const schema = { ... }` and `export type Schema = typeof schema`.
    - Byte-stable: sorted imports, deterministic column/table order.

11. `src/cli/dbt/emit-cubes.ts` — deterministic cube-file + `index.ts` emitter.
    - Export `function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[]` (one `cubes/<fileName>.ts` per model + root `index.ts`).
    - Cube files import `defineCube` from `drizzle-cube/server` (runtime) and `import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'` — **non-generic public types** per `src/cli/CLAUDE.md:48-49`. Schema imports from `../schema.js` (the table export + any join target table exports, sorted).
    - `renderSqlFunction`: if `securityPropertyName` and `filter` security → `sql: (ctx: QueryContext): BaseQueryDefinition => ({ from: <table>, where: eq(<table>.<secProp>, ctx.securityContext.<contextProp> as <tsType>) })`; import `eq` from `drizzle-orm`. The `as <tsType>` is honest narrowing of the public `securityContext` (`unknown`-typed) to the column's data type, not validator-silencing. Else → comment `// No cube-level security filter was requested for this model.` + `sql: (): BaseQueryDefinition => ({ from: <table> })`.
    - `renderDimension`: `name`, `title` (JSON.stringify), `description` when present, `type`, `sql: table.prop`, `primaryKey: true` for **every** PK column including composite PKs.
    - `renderMeasure`: `name`, `title`, `type`; for `count` render the baseline expression (`renderBaselineMeasureSql` handles `concat_ws:` composite → `sql\`count(distinct concat_ws('|', table.a, table.b))\`` and imports `sql` from `drizzle-orm`); for explicit measures render `sql: table.prop`. `description`/`format` when present.
    - `renderJoin`: `targetCube: '<CubeName>'` (string), `relationship: 'belongsTo'`, `on: [{ source: table.sourceProp, target: targetTableExport.targetProp }]` (single) or multi-line array (multi). `targetTableExport` returns the cube name (PascalCase table export matches in v1).
    - `index.ts`: header + sorted imports `import { <cubeExport> } from './cubes/<fileName>.js'` + named re-exports + `export const allCubes = [ ... ]`.

12. `src/cli/dbt/write-output.ts` — the only module that performs filesystem writes for the generator.
    - Export `const GENERATED_HEADER = '// Generated by drizzle-cube dbt generate.'`.
    - Export `interface WriteOptions { outDir: string; dryRun: boolean; check: boolean; force: boolean }`.
    - Export `async function writeGeneratedOutput(files: GeneratedFile[], options: WriteOptions): Promise<WriteResult>`.
    - `safeResolve(outDir, relativePosix)`: convert POSIX→platform separators, `normalize`/`resolve`, throw if the result escapes `outDir` (path-traversal guard).
    - `isGeneratedContent`: content starts with `GENERATED_HEADER`.
    - `findExistingGeneratedFiles`: walk `outDir`, return the set of relative POSIX paths of files that begin with the generated header (used for stale/orphan detection).
    - `classifyFile(outDir, file, force)`: `create` (absent), `update` (existing generated, content differs OR force-overwrite), `conflict` (existing non-generated, not forced), `unchanged`.
    - **`checkMode`** (write/delete nothing): compare the **full expected file set** against the **full existing generated-header file set**. Populate `updated` (changed+conflict paths, sorted), `missing` (expected absent from disk, sorted), `orphaned` (on-disk generated not in expected, sorted). `drift = changed.length>0 || missing.length>0 || orphaned.length>0`. **This is the convention from `src/cli/CLAUDE.md:77-84`** — removals count as drift.
    - `dryRunMode` (write/delete nothing): report `created`/`updated`/`conflicts` (sorted) + `deleted`/`orphaned` (orphaned aliases deleted, same sorted array). `drift: false`.
    - `normalMode`: `mkdir -p` parents, `writeFile` generated-header files (skip conflicts unless force), then delete stale generated-header files no longer expected and push them to `deleted`. `missing: []`, `orphaned: []`, `drift: false`.
    - All returned arrays sorted with `localeCompare` for deterministic output.

13. `src/cli/dbt/generate.ts` — orchestration.
    - Export `async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult>`.
    - `buildEmitContext(options)` → `EmitContext`.
    - Pipeline: `loadDbtArtifacts` → `normalizeDbtArtifacts` (collect warnings) → `[emitSchema(models, ctx), ...emitCubes(models, ctx)]` → `writeGeneratedOutput(files, { outDir, dryRun, check, force })`. Return `{ files, write, warnings }`. Does not print — the command module owns console output.

### New documentation

14. `docs/dbt-generate.md`
    - Command usage, required artifacts, generating artifacts with dbt externally (`dbt docs generate`/`dbt compile` as applicable — **the CLI never runs dbt**), all options, security modes (interactive prompt + flag/CI equivalents), output layout (`schema.ts` + `cubes/*.ts` + `index.ts`), warn-and-skip behavior, `--dry-run`, `--check` (drift incl. orphaned files), Postgres type support table, `meta.drizzle_cube.*` overrides (`primary_key`, `measures`), and v1 limitations.
    - Explicitly state unsupported inputs: raw dbt project/YAML/Jinja, remote GitHub repos, running dbt, non-Postgres dialects, sources/seeds/snapshots/exposures/metrics/semantic models/ephemeral models, reverse/many-to-many joins, and merge-preserving manual edits.

### New tests and fixtures (all DB-free, `cli` vitest project)

15. `tests/cli/dbt/naming.test.ts` — snake/kebab/dotted names, reserved words, invalid leading characters, humanized titles (incl. acronym uppercasing), collision detection via `makeUniqueIdentifier`.

16. `tests/cli/dbt/postgres-types.test.ts` — every supported type family in `postgres-types.ts`; unsupported arrays/enums/custom/`bytea`/`interval`/`money`/unknown returning `null` so callers warn-and-skip.

17. `tests/cli/dbt/parse-artifacts.test.ts` — model/resource extraction from fixture artifacts; relationship test extraction for the representative dbt relationship test shape; malformed/missing top-level `nodes` surfacing a validation error.

18. `tests/cli/dbt/normalize.test.ts` — materialized inclusion + ephemeral/unsupported materialization warn-and-skip; unsupported column type warn-and-skip; configured security column missing → model warn-and-skip; composite PK marks all key dimensions; invalid explicit measure metadata warn-and-skip; relationship dropped when target/source model **or** source column was skipped (assert `RELATIONSHIP_DROPPED` warning's `modelName` and that its message names the skipped target/column); model skipped when security column was skipped on unsupported type (assert `MODEL_SKIPPED` mentions the security column + "unsupported type").

19. `tests/cli/dbt/emit.test.ts` — byte-for-byte comparison of generated files against `tests/fixtures/dbt/postgres-simple/expected/**`; security-filter and no-security variants; assert emitted cube code imports from `drizzle-cube/server`, uses non-generic `QueryContext`/`BaseQueryDefinition`, uses direct Drizzle table/column references, and string `targetCube` names; composite-PK cube emits `countDistinct` (not `count`).

20. `tests/cli/dbt/write-output.test.ts` — temp directories: normal writes; generated-header overwrite; non-generated conflict (refused unless `--force`); `--dry-run` no writes; `--check` success; `--check` changed-file failure; `--check` stale/orphan generated file failure (assert `missing`/`orphaned` arrays); `--check` reports changed+missing+orphaned together; normal-mode stale generated deletion + warning.

21. `tests/cli/dbt/command.test.ts` — required-arg errors (`--manifest`, `--catalog`, `--dialect`, `--out`); unsupported dialect error; non-interactive security requirement; `--no-security` warning path; `--check` summary lists changed/missing/orphaned paths (mocked generator) and `dbtGenerate` throws on drift; dry-run summary via mocked pipeline or temp fixtures.

22. `tests/fixtures/dbt/postgres-simple/manifest.json` — materialized models `orders`, `customers`, and `order_lines` (composite PK: `order_id` + `line_number`) plus one `ephemeral_rollup` model to verify skipping. Model/column descriptions. `meta.drizzle_cube.primary_key: true` for `customers.id`, `orders.id`, and both `order_lines` PK columns. A dbt `relationships` test: `orders.customer_id` references `customers.id`. An explicit measure in `meta.drizzle_cube.measures` for `orders.amount` (`totalAmount` sum, `format: 'currency'`).

23. `tests/fixtures/dbt/postgres-simple/catalog.json` — catalog columns for `orders`, `customers`, `order_lines`: integer IDs, `organisation_id`, text names/status, numeric amount, timestamp `created_at`, boolean `active`; `order_lines` integer `quantity`/`line_number`, text `sku`.

24. `tests/fixtures/dbt/postgres-simple/expected/schema.ts` — expected generated schema for supported materialized models only (sorted: `Customers`, `OrderLines`, `Orders`); `order_lines` composite PK emits `.primaryKey()` on both key columns.

25. `tests/fixtures/dbt/postgres-simple/expected/cubes/orders.ts` — expected Orders cube: security filter, dimensions, `countDistinct` baseline over `id`, explicit `totalAmount` sum measure, `Customers` string-target `belongsTo` join.

26. `tests/fixtures/dbt/postgres-simple/expected/cubes/customers.ts` — expected Customers cube: security filter, dimensions, `countDistinct` baseline.

27. `tests/fixtures/dbt/postgres-simple/expected/cubes/order_lines.ts` — expected OrderLines cube: security filter, dimensions with both PK columns marked `primaryKey: true`, composite `countDistinct` baseline.

28. `tests/fixtures/dbt/postgres-simple/expected/index.ts` — expected root index exporting named cubes and `allCubes`.

> Note on typecheck: the expected `.ts` fixtures are included by `tsconfig.tests.json` (`tests/**/*.ts`) but compile cleanly because they import only `drizzle-cube/server` and `drizzle-orm/pg-core` (valid package imports) and resolve `../schema.js` to the sibling `expected/schema.ts`. No `tsconfig.tests.json` exclude is required — verified against the v3 branch whose `tsconfig.tests.json` is byte-identical to current and whose `npm run typecheck` passed.

## Commands

Exact commands from `.lastlight/issue-936/guardrails-report.md`:

```bash
npm run test
npm run lint
npm run typecheck
```

Additional targeted commands the executor should run first for faster feedback:

```bash
npm run test:cli
npm run build:cli
```

(`npm run test` / the full `server` vitest project needs live Postgres on `127.0.0.1:54333` via `docker-compose`, unavailable in the sandbox — a pre-existing limitation unrelated to this DB-free feature. `npm run test:cli` runs without containers and is the authoritative gate here.)

## Implementation approach

1. Update `src/cli/index.ts` to async dispatch first (preserving `charts init|list`), add `dbt generate`/`dbt` routing, and wire `main().catch(...)`.
2. Add `src/cli/dbt/types.ts` and `src/cli/dbt/naming.ts` so all downstream modules share strict types and deterministic identifiers.
3. Implement `postgres-types.ts` with the tested allowlist; unsupported types return `null` (no placeholder guesses).
4. Implement `parse-artifacts.ts` with `unknown` + local guards; keep file I/O in `loadDbtArtifacts`, expose pure `parseDbtArtifacts` for tests.
5. Implement `normalize.ts`: filter materialized models, merge manifest/catalog, apply type mapping, detect PKs (meta-only), parse explicit measures, apply security skip + cascade, produce `belongsTo` edges only when all references resolve, throw on identifier collisions, sort everything deterministically.
6. Implement emitters (`emit-schema.ts`, `emit-cubes.ts`) with sorted imports and byte-stable content.
7. Implement `write-output.ts` with generated-header ownership, safe path normalization, full expected-vs-existing drift comparison (incl. orphaned), and stale deletion in normal mode.
8. Implement `generate.ts` orchestration and wire it into `commands/dbt.ts` (prompt + warning/summary output).
9. Add fixtures + DB-free Vitest tests under `tests/cli/dbt/` (not under root `tests/` or `tests/server/` — they must not trigger DB `globalSetup`).
10. Update `vite.config.cli.ts` externals; run `npm run build:cli` to verify bundling.
11. Add README section + `docs/dbt-generate.md`.
12. Verify targeted checks first (`test:cli`, `build:cli`), then guardrails (`test`, `lint`, `typecheck`).

## Risks and edge cases

For every input the design does NOT fully support, the plan specifies warn-and-skip or warn-and-surface — **never a silent default, silent skip, or dropped output**.

- Raw dbt project/YAML/Jinja: **warn-and-surface** as unsupported in docs/help; command accepts only local JSON artifacts and never attempts parsing.
- Remote GitHub/dbt sync: **warn-and-surface** as out of scope in docs/help; no clone/network.
- Running `dbt`: **warn-and-surface** as out of scope; users provide artifacts.
- Non-Postgres `--dialect`: **surface an error** before reading files.
- Missing `--manifest`/`--catalog`/`--out`: **surface an error** with help.
- Malformed JSON or missing top-level `nodes`: **surface an error** naming the file + field.
- Unsupported dbt artifact versions: parse by fields rather than hard-coding version; **warn-and-surface** only if needed fields are missing.
- dbt sources/seeds/snapshots/exposures/metrics/semantic models: **warn-and-skip**; do not emit.
- `ephemeral`/unsupported/missing materialization: **warn-and-skip** (`MODEL_SKIPPED`) with model + materialization.
- Missing catalog entry for a materialized model (no columns): **warn-and-skip** the model (schema generation needs types).
- Unsupported catalog column type: **warn-and-skip** (`COLUMN_SKIPPED`) that column with model/column/type. Cascade: if it was a PK or the configured security column, drop/skip dependent output (PK dropped from PK set; model skipped with `MODEL_SKIPPED`).
- Arrays/enums/custom/user-defined Postgres types: **warn-and-skip** columns for v1.
- Identifier/name collisions after camel/pascal conversion: **throw** `IDENTIFIER_COLLISION` (a stopped run is better than a silent overwrite); do not silently overwrite.
- Reserved/invalid TS identifiers: sanitize deterministically; if sanitization collides, surface collision error.
- Configured security column missing from a model: **warn-and-skip** the model; never emit a partially unfiltered model when filter security is configured.
- No security selected explicitly (`--no-security` or empty prompt): **warn-and-surface** in CLI output + a generated comment in the cube file; emit cubes without `where` only because the user explicitly opted out.
- Non-interactive invocation without security flags: **surface an error** requiring `--no-security` or both filter flags.
- Relationships targeting skipped models/columns: **warn-and-skip** (`RELATIONSHIP_DROPPED`) the join, not the whole run.
- Reverse `hasMany`/many-to-many/inferred join paths: **warn-and-surface** as unsupported; dbt relationship tests produce only direct `belongsTo`.
- Composite primary keys: mark **every** PK dimension `primaryKey: true`; baseline `countDistinct` over the composite (concat_ws) — if the expression would not compile, warn and fall back to plain `count` while retaining PK dimension markers.
- Explicit measure metadata with unsupported `MeasureType`, missing column, or incompatible non-numeric aggregate: **warn-and-skip** (`MEASURE_SKIPPED`) that measure.
- Existing file at expected path without generated header: **surface a conflict error** unless `--force`; never overwrite silently.
- Stale generated files for removed models: `--check` **must fail** (orphaned = drift); normal mode deletes generated-header stale files and warns; `--dry-run` reports planned deletion without deleting.
- Path traversal in model/file names or `outDir`: normalize + **surface error** if a generated path escapes `outDir`.
- Formatting churn: rely on the deterministic emitter; do not invoke a project formatter unless tests are updated to reflect exact output.

## Test strategy

- Unit-test pure naming, type mapping, artifact parsing, normalization, and emitters in `tests/cli/dbt/*.test.ts` under the `cli` vitest project (`npm run test:cli`).
- Byte-for-byte expected output comparisons against `tests/fixtures/dbt/postgres-simple/expected/**`.
- Temp directories for writer/check/dry-run tests, including stale/orphan detection and non-generated conflicts.
- Command validation/prompt-independent modes without requiring a TTY or database (mock the pipeline or use temp fixtures).
- Verify generated fixture files compile conceptually against public imports (`drizzle-cube/server`) and use non-generic public types per `src/cli/CLAUDE.md:48-49`.
- Targeted: `npm run test:cli`, `npm run build:cli`. Guardrails: `npm run test`, `npm run lint`, `npm run typecheck`.

## Estimated complexity

Complex.
