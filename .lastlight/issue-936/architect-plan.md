# Architect Plan — #936 DBT Sync to Cubes v3

## Problem Statement

Drizzle Cube's CLI exposes only the `charts` route: `src/cli/index.ts:21-48` is a synchronous `parseArgs` router with no `dbt generate` command and no async/error-handled command dispatch. The CLI is intentionally DB-free and deterministic, and its local guidance (`src/cli/CLAUDE.md:16-24`, `src/cli/CLAUDE.md:37-90`) mandates pure parser/codegen modules, byte-stable output, and **warn-and-skip** behaviour for every unsupported generator input (never `throw` on one bad column, never silently default a placeholder type). Generated cube files must compile against the public authoring API from `drizzle-cube/server` — `defineCube` (`src/server/index.ts:86`) plus the non-generic `Cube`/`QueryContext`/`BaseQueryDefinition`/`Measure`/`Dimension`/`CubeJoin` types (`src/server/types/cube.ts:59`, `src/server/types/cube.ts:42-53`, `src/server/types/cube.ts:113-138`, `src/server/types/cube.ts:163-222`, `src/server/types/cube.ts:336-392`) — and must reference Drizzle table/column objects directly for `sql`, dimensions, measures, and joins. The repo already has a DB-free CLI Vitest project (`vitest.config.ts:50-64`, `tests/cli/charts-list.test.ts:1-10`), so the dbt artifact parser/generator belongs there with no Docker or database dependency.

Two prior build attempts (v1, v2) reached APPROVED after a fix cycle. The v2 reviewer flagged exactly two correctness gaps that **this plan bakes in as first-class requirements from the start** so v3 does not need a fix cycle:
1. **Identifier collisions** — `tableExportName`/`cubeName`/`cubeExportName`/`fileName` derived per model without tracking names already used silently overwrote output (`orders.total` vs `orders_total` produced duplicate exports and the same file path). Collision detection must reject before emit (`src/cli/CLAUDE.md:51-56`).
2. **Composite primary keys** — emitting `type: 'count'` whenever >1 PK column was present silently downgraded metric semantics. Composite PKs must keep one `primaryKey: true` dimension per key column plus a baseline `countDistinct` measure (`src/cli/CLAUDE.md:40-47`).

## Summary of what needs to change

Add a local, artifact-first `drizzle-cube dbt generate` command that reads dbt `manifest.json` and `catalog.json`, normalizes materialized Postgres models into a deterministic internal representation, and emits generated Drizzle `pg-core` schema plus one cube file per model plus an `index.ts`. The command supports explicit security choices via flags or interactive prompt (empty answer = intentional no-security), no network/dbt runtime/YAML parsing, deterministic `--dry-run` and `--check` (drift incl. removals), generated-file ownership checks with stale-file cleanup, and visible warnings for every unsupported/skipped input. Add DB-free Vitest coverage with fixtures, update CLI build externals and tsconfig self-reference for typechecking generated fixture code, and document the command and v1 limitations.

## Files to modify — exhaustive manifest

### Existing files

1. `src/cli/index.ts` (`command`/`subcommand` router at `src/cli/index.ts:21-48`)
   - Import `dbtGenerate` and `printDbtHelp` from `./commands/dbt.js`.
   - Replace the synchronous top-level `if/else` body with an async `main()` that `await`s command handlers, catches thrown `Error` values, writes `error.message` to `stderr`, and exits `1`. Preserve existing `charts init|list` behaviour exactly.
   - Add route: `command === 'dbt' && subcommand === 'generate'` → `await dbtGenerate(process.argv.slice(4))`.
   - Add help route: `command === 'dbt'` (no/unknown subcommand) → `printDbtHelp()`.
   - Update top-level help text (the `else` branch) to list both `charts` and `dbt`.

2. `vite.config.cli.ts` (`rollupOptions.external` at `vite.config.cli.ts:12-14`)
   - Extend externals for Node builtins used by the dbt command/modules: `node:fs/promises`, `node:readline/promises`, `node:process`, `node:os`, `node:path` (already has `node:path`), plus non-prefixed `fs/promises`, `readline/promises`, `process`, `os` if imported/referenced by the emitted bundle. Add only what the final imports actually use; verify with `npm run build:cli`.

3. `tsconfig.json` (`compilerOptions.paths` at `tsconfig.json:25-29`)
   - Add self-reference path so generated fixture `.ts` files importing `drizzle-cube/server` typecheck against source (proven necessary in v2): `"drizzle-cube/server": ["./src/server/index.ts"]`. Add it as the first entry in `paths`. This is required because `tsconfig.tests.json` includes `tests/**/*.ts` and the expected-output fixtures under `tests/fixtures/dbt/postgres-simple/expected/**/*.ts` import `drizzle-cube/server`, which otherwise resolves to `dist/` (not built during typecheck).

4. `README.md` (add after the Quick Start section, near `README.md:41-105`, or before documentation links near `README.md:246`)
   - Add a concise section titled `Generate schema and cubes from dbt artifacts`.
   - Include the command:
     ```bash
     npx drizzle-cube dbt generate --manifest target/manifest.json --catalog target/catalog.json --dialect postgres --out ./src/cubes/generated --security-column organisation_id --security-context organisationId
     ```
   - Link to `docs/dbt-generate.md` for full options/limitations.
   - State v1 is local artifact-only, Postgres-only, and does not clone GitHub repos or run dbt.

### New source files

5. `src/cli/commands/dbt.ts`
   - Export `async function dbtGenerate(argv = process.argv.slice(4)): Promise<void>`.
   - Export `function printDbtHelp(): void`.
   - Parse options with `parseArgs`: `--manifest`, `--catalog`, `--dialect`, `--out`, `--security-column`, `--security-context`, `--no-security`, `--dry-run`, `--check`, `--force`, and optional `--config` reserved for JSON config (read but not fully wired in v1 beyond security/naming if present; keep v1 usable from flags alone).
   - Validate required options and unsupported dialects before reading artifacts. Required: `--manifest`, `--catalog`, `--dialect` (must be `postgres`), `--out`. Missing any → throw `Error` with a usage hint. Unsupported dialect → throw `Error` naming the value.
   - Determine security mode:
     - If `--no-security` → `SecurityMode = { kind: 'none' }`, print a warning to stderr.
     - If both `--security-column` and `--security-context` → `{ kind: 'filter', columnName, contextProperty }`.
     - If exactly one of the two is present → throw `Error` (both required together).
     - If neither and stdin/stdout are TTYs (`process.stdin.isTTY && process.stdout.isTTY`) → prompt for tenant/organisation column; empty answer = no-security warning; non-empty answer derives `contextProperty` from lower-camel column name unless `--security-context` provided.
     - If neither and non-interactive → throw `Error` requiring `--no-security` or both filter flags.
   - Call `generateFromDbt(options)`, print accumulated warnings to stderr, print a file summary to stdout.
   - In `--check`, if the writer reports drift, throw to exit non-zero.
   - Keep this as the **only** module that touches `process`, `readline`, console, or filesystem paths supplied by CLI.

6. `src/cli/dbt/types.ts`
   - Define all shared runtime types; **do not use `as any`**. Route artifact values through local type guards (`unknown` → narrowed) rather than casting.
   - Required exports:
     - `type SecurityMode = { kind: 'filter'; columnName: string; contextProperty: string } | { kind: 'none' }`.
     - `interface DbtGenerateOptions { manifestPath: string; catalogPath: string; dialect: 'postgres'; outDir: string; security: SecurityMode; dryRun: boolean; check: boolean; force: boolean; configPath?: string }`.
     - `interface GeneratorWarning { code: string; message: string; modelName?: string; columnName?: string }`.
     - `interface GeneratedFile { path: string; content: string }` where `path` is out-dir-relative POSIX path.
     - `interface DbtModel`, `DbtColumn`, `DbtRelationshipTest`, `ParsedDbtArtifacts`.
     - `interface GeneratedColumn { sqlName: string; propertyName: string; title: string; description?: string; builder: string; builderArgs?: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; primaryKey: boolean; notNull: boolean }`.
     - `interface GeneratedMeasure { name: string; title: string; type: string; sql?: string; description?: string; format?: string }`.
     - `interface GeneratedRelationship { sourceCube: string; targetCube: string; relationship: 'belongsTo'; on: Array<{ sourceColumn: string; targetColumn: string }> }`.
     - `interface GeneratedModel { dbtUniqueId: string; modelName: string; relationName: string; materialization: string; tableExport: string; cubeName: string; cubeExport: string; fileName: string; title: string; description?: string; columns: GeneratedColumn[]; measures: GeneratedMeasure[]; relationships: GeneratedRelationship[]; securityPropertyName?: string }`.
     - `interface GenerationResult { files: GeneratedFile[]; write: WriteResult; warnings: GeneratorWarning[] }`.
     - `interface EmitContext { manifestPath: string; catalogPath: string; dialect: 'postgres'; security: SecurityMode }`.
     - `interface WriteResult { created: string[]; updated: string[]; deleted: string[]; conflicts: string[]; drift: boolean }`.
     - Narrow string unions for supported materializations: `'table' | 'view' | 'incremental'`.

7. `src/cli/dbt/naming.ts`
   - Export `toCamelCase`, `toPascalCase`, `toKebabCase`, `humanizeTitle`, `quoteStringLiteral`, `sanitizeIdentifier`, `makeUniqueIdentifier`.
   - Deterministic conversion for snake_case, kebab-case, dotted dbt names, and names with spaces. Invalid leading chars → prefix or sanitize deterministically. Reserved TypeScript identifiers (`class`, `return`, etc.) → sanitize with a suffix.
   - `humanizeTitle`: `customer_id` → `Customer Id` (or `Customer ID` per a small acronym allowlist; pick one and test it). Title-case words from the SQL name.
   - Collision handling: callers track used identifiers; `makeUniqueIdentifier(base, used)` returns a non-colliding name. Collision detection itself lives in `normalize.ts` (see below) so the whole-model set is checked before emit.

8. `src/cli/dbt/postgres-types.ts`
   - Export `mapPostgresCatalogType(type: string): { builder: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; builderArgs?: string; warnings?: GeneratorWarning[] } | null`.
   - Normalize input type by lowercasing and stripping parens/length args before matching.
   - Supported v1 mappings (return non-null):
     - integer-like: `smallint`, `integer`, `int`, `int4`, `serial`, `smallserial` → `{ builder: 'integer', dimensionType: 'number' }`.
     - big integer-like: `bigint`, `int8`, `bigserial` → `{ builder: 'bigint', dimensionType: 'number', builderArgs: "{ mode: 'number' }" }` **only if** the emitted `bigint('col', { mode: 'number' })` syntax compiles against the installed `drizzle-orm/pg-core`; otherwise return `null` and let the caller warn-and-skip until a test proves it compiles. (Executor: verify by typechecking a generated fixture before committing to `bigint`.)
     - numeric/decimal: `numeric`, `decimal` → `{ builder: 'numeric', dimensionType: 'number' }` with string runtime values but Drizzle Cube dimension type `number`; document limitation in `docs/dbt-generate.md`.
     - floating: `real`, `float4` → `{ builder: 'real', dimensionType: 'number' }`; `double precision`, `float8` → `{ builder: 'doublePrecision', dimensionType: 'number' }`.
     - text: `text`, `varchar`, `character varying`, `char`, `character`, `uuid` → `{ builder: 'text', dimensionType: 'string' }`.
     - booleans: `boolean`, `bool` → `{ builder: 'boolean', dimensionType: 'boolean' }`.
     - time: `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `timestamptz`, `timestamptz`, `time` → `{ builder: 'timestamp', dimensionType: 'time' }`; `date` → `{ builder: 'date', dimensionType: 'time' }` (verify `date` compiles; if not, map to `timestamp` and note it).
     - JSON: `json`, `jsonb` → `{ builder: 'jsonb', dimensionType: 'string' }` (jsonb has no cube dimension type beyond string; document).
   - Return `null` for arrays (`[]` suffix), enums, geometry, network types, user-defined/custom types, `bytea`, `interval`, `money`, and anything unknown → caller **must warn-and-skip the column**. Never return a `text` placeholder for an unknown type.

9. `src/cli/dbt/parse-artifacts.ts`
   - Export `async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<ParsedDbtArtifacts>` (file I/O only here).
   - Export pure `parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts` for tests.
   - Validate only fields needed using local type guards over `unknown`: manifest `nodes`, model `resource_type`, `name`, `alias`, `schema`, `database`, `description`, `config.materialized`, `columns`, `meta`, tests; catalog `nodes`, `columns`, column `type`, `index`, `comment`, `name`.
   - Malformed JSON or missing required top-level fields → throw `Error` naming the file and field.
   - Extract dbt relationship tests from manifest test nodes, including both common forms: `test_metadata.name === 'relationships'` and `depends_on.nodes`/`column_name`/`kwargs` styles. If target model/column cannot be resolved, emit a warning and omit that relationship.
   - Do not parse raw dbt YAML/Jinja and do not run dbt.

10. `src/cli/dbt/normalize.ts`
    - Export `function normalizeDbtArtifacts(artifacts: ParsedDbtArtifacts, options: { security: SecurityMode }): { models: GeneratedModel[]; warnings: GeneratorWarning[] }`.
    - Include only materialized model resources with materialization `table`, `view`, or `incremental`.
    - Warn-and-skip `ephemeral` and unsupported materializations (`materialized_view`, `seed`, missing/unknown, etc.) with model name and materialization.
    - Join manifest column descriptions/meta with catalog column types by dbt unique ID and column SQL name. Missing catalog entry for a materialized model → warn-and-skip the whole model (schema generation needs types).
    - Per column: call `mapPostgresCatalogType`; `null` → warn-and-skip that column (model + column + type). Never throw on one bad column. Cascade: if a skipped column was a PK/security/join column, drop dependent output with its own warning.
    - **Collision detection (v2 fix #1, first-class):** After deriving `tableExport`, `cubeName`, `cubeExport`, `fileName` per model via `naming.ts`, track all four namespaces across models. If any derived identifier collides with one already used (e.g. `orders.total` and `orders_total` both normalize to `ordersTotal`), push a `GeneratorWarning` with code `IDENTIFIER_COLLISION` and **throw an `Error` listing both offending model unique IDs and the colliding identifier** before any emit/write. Do not silently overwrite. (This is the one place normalize throws rather than warns: a collision means generated output would be silently lost, which is worse than a stopped run.)
    - **Composite PK (v2 fix #2, first-class):** Detect primary keys from dbt tests/meta only when confident: accepted sources are `unique` + `not_null` tests on the column, manifest/catalog constraints if present, or `meta.drizzle_cube.primary_key: true`. A composite key (≥2 PK columns) must mark **every** key column `primaryKey: true` and produce a baseline `count` measure of `type: 'countDistinct'`. Single-column PK → `countDistinct` with `sql: table.pk`. **Never downgrade a composite PK to plain `count`**; the composite-PK `countDistinct` emission policy is owned by `emit-cubes.ts` (see below).
    - Build baseline `count` measure for every emitted model; add explicit measures only from `meta.drizzle_cube.measures` on model or column. Invalid measure metadata (unsupported `MeasureType`, missing column, incompatible non-numeric aggregate) → warn-and-skip that measure.
    - Apply security policy: if `security.kind === 'filter'` and a materialized model lacks that SQL column after type mapping, warn-and-skip the **entire model**. Never emit a model without row-level filtering when filter security was configured (`src/cli/CLAUDE.md:88-90`). Record `securityPropertyName` on each kept model so the emitter can build the `where`.
    - Drop relationships whose source/target model was skipped or whose source/target columns were skipped, with a dedicated `RELATIONSHIP_DROPPED` warning.
    - Sort models by `fileName`, columns by catalog `index` then SQL name, measures by name, relationships by `targetCube` — all deterministic.

11. `src/cli/dbt/emit-schema.ts`
    - Export `function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile`.
    - Emit `<out>/schema.ts` content with the generated header (see `write-output.ts` header constant) plus a `Source: manifest=<path>, catalog=<path>, dialect=postgres.` line.
    - Import only actually-used builders from `drizzle-orm/pg-core`, sorted alphabetically except `pgTable` first for readability. Import `drizzle-orm` only if a composite-PK `sql` expression needs it (then import `sql`).
    - Emit `export const <tableExport> = pgTable('<relation_name>', { ... })` for each model in sorted `fileName` order.
    - Emit column properties in deterministic catalog/dbt order, using lower-camel property names and original SQL names as builder string args. Emit `.primaryKey()` and `.notNull()` only when confidently known; otherwise leave conservative nullable builders.
    - Export `schema` object mapping each `tableExport` and `export type Schema = typeof schema`.

12. `src/cli/dbt/emit-cubes.ts`
    - Export `function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[]`.
    - Emit `cubes/<fileName>.ts` for every generated model and `index.ts` for the generated root.
    - Cube files import `defineCube` and public types from `drizzle-cube/server`; generated code **must use non-generic** `QueryContext`, `BaseQueryDefinition`, and `Cube` per `src/cli/CLAUDE.md:48-49` (the public types are non-generic; do not emit `QueryContext<Schema>`/`Cube<Schema>` casts like `dev/server/cubes.ts` does).
    - Security filter: if a model has `securityPropertyName`, import `eq` from `drizzle-orm` and emit
      `sql: (ctx: QueryContext): BaseQueryDefinition => ({ from: <table>, where: eq(<table>.<securityPropertyName>, ctx.securityContext.<contextProperty>) })`.
    - No-security: emit `sql: (): BaseQueryDefinition => ({ from: <table> })` and include a generated comment in the cube file noting no cube-level security filter was requested.
    - Emit dimensions for all mapped columns, with `name`, `title`, `description` when present, `type`, `sql`, and `primaryKey: true` for **every** PK column including composite PKs (one per key column).
    - **Baseline measure policy (composite PK is the default-correct path, not a fallback):**
      - If ≥1 PK column is known → emit `count` with `type: 'countDistinct'`.
        - Single-column PK: `sql: <table>.<pk>`.
        - Composite PK: emit a deterministic Postgres `concat_ws` SQL expression via `sql` from `drizzle-orm`, e.g. `sql\`count(distinct concat_ws('|', ${table.pkA}, ${table.pkB}))\`` rendered as a `sql` template in the generated file. This is the v2-approved approach. **Do not** fall back to plain `count` for composite PKs; if the expression cannot be rendered deterministically, throw rather than silently downgrade.
      - If no PK is known → emit `count` with `type: 'count'` and `sql: <table>.<firstNonSecurityColumn>` if a stable column exists, else `type: 'count'` with no `sql` (verify against the `Measure` contract that `sql` is optional for `count`; it is — `sql?` in `src/server/types/cube.ts:189`).
    - Emit explicit measures from dbt meta only when their `type` is in `MeasureType` (`src/server/types/core.ts:178-208`) and the referenced column exists and is compatible (numeric aggregate → `number` dimension). Invalid → warn-and-skip (the warning was produced in normalize; emitter trusts the normalized model).
    - Emit direct `belongsTo` joins from normalized relationships using **string** `targetCube` names to avoid circular imports:
      ```ts
      joins: {
        Customers: {
          targetCube: 'Customers',
          relationship: 'belongsTo',
          on: [{ source: orders.customerId, target: customers.id }]
        }
      }
      ```
    - `index.ts` imports every cube in deterministic `fileName` order and exports both named cube exports and an `allCubes` array (matching `dev/server/cubes.ts` registration shape).
    - Keep imports sorted and generated content byte-stable (stable key ordering, stable whitespace, no trailing-variance).

13. `src/cli/dbt/write-output.ts`
    - Export `async function writeGeneratedOutput(files: GeneratedFile[], options: { outDir: string; dryRun: boolean; check: boolean; force: boolean }): Promise<WriteResult>`.
    - Generated ownership header constant: `// Generated by drizzle-cube dbt generate.` (every emitted file starts with a line beginning with this).
    - Enforce all writes stay under `outDir` after path normalization; surface an error otherwise (path traversal guard).
    - Normal mode:
      - Create directories as needed.
      - Overwrite files that start with the generated header.
      - If an expected path exists **without** the header and `force` is false → record a conflict (do not overwrite). If `force` is true → overwrite conflicts but warn clearly.
      - Detect existing generated-header files under `outDir` that are no longer in the expected set → delete them and warn that stale generated output was removed (`src/cli/CLAUDE.md:63-71`).
    - `--dry-run`: write nothing; report all planned creates/updates/deletes/conflicts.
    - `--check`: write/delete nothing; compare the **full expected file set** against the **full existing generated-header file set** under `outDir`. Fail (`drift: true`) on changed, missing, conflicting, or stale/orphaned files. **Removals count as drift** — a model deleted upstream leaves an orphaned generated file that `--check` must report and exit non-zero on (`src/cli/CLAUDE.md:63-71`).

14. `src/cli/dbt/generate.ts`
    - Export `async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult>`.
    - Orchestrate `loadDbtArtifacts` → `normalizeDbtArtifacts` → `emitSchema` + `emitCubes` → `writeGeneratedOutput`. Concatenate warnings from each stage. Return `{ files, write, warnings }`.

### New documentation

15. `docs/dbt-generate.md`
    - Document command usage, required artifacts, generating artifacts with dbt externally (`dbt docs generate`/`dbt compile` as applicable — the CLI never runs dbt), all options, security modes (interactive prompt + flags + empty/no-security), output layout, warn-and-skip behaviour, `--dry-run`, `--check` (incl. removal drift), Postgres type support table, and v1 limitations.
    - Explicitly state unsupported inputs: raw dbt project/YAML/Jinja, remote GitHub repos, running dbt, non-Postgres dialects, sources/seeds/snapshots/exposures/metrics/semantic models, ephemeral models, reverse/many-to-many joins, merge-preserving manual edits, arrays/enums/custom Postgres types.

### New tests and fixtures

16. `tests/cli/dbt/naming.test.ts`
    - Cover snake/kebab/dotted names, reserved words, invalid starting characters, humanized titles, and `makeUniqueIdentifier` collision avoidance.

17. `tests/cli/dbt/postgres-types.test.ts`
    - Cover every supported type family listed in `src/cli/dbt/postgres-types.ts` (integer, bigint, numeric, real, double, text, boolean, timestamp/date, jsonb).
    - Cover unsupported arrays/enums/custom/unknown types returning `null` so callers warn-and-skip.

18. `tests/cli/dbt/parse-artifacts.test.ts`
    - Cover model/resource extraction from fixture artifacts.
    - Cover relationship test extraction for representative dbt relationship test shape (both `test_metadata.name === 'relationships'` and `kwargs` styles if feasible).
    - Cover malformed/missing top-level `nodes` surfacing a validation error.

19. `tests/cli/dbt/normalize.test.ts`
    - Cover materialized model inclusion and ephemeral/unsupported materialization warn-and-skip.
    - Cover unsupported column type warn-and-skip (column dropped, model kept).
    - Cover configured security column missing → model warn-and-skip.
    - Cover **composite PK marking all key dimensions** + `countDistinct` baseline (v2 fix #2 coverage).
    - Cover **identifier collision throw** for two models normalizing to the same `tableExport`/`cubeName`/`cubeExport`/`fileName` (v2 fix #1 coverage).
    - Cover invalid explicit measure metadata warn-and-skip.
    - Cover relationship dropped when target/source model or column was skipped.

20. `tests/cli/dbt/emit.test.ts`
    - Compare generated files against `tests/fixtures/dbt/postgres-simple/expected/**` byte-for-byte.
    - Cover security-filter and no-security variants (run emitter with both `SecurityMode`s against the same fixture, or add a second small fixture for no-security).
    - Assert emitted cube code imports from `drizzle-cube/server` and uses direct Drizzle table/column references and non-generic public types.
    - Assert composite-PK cube emits `countDistinct` (not `count`).

21. `tests/cli/dbt/write-output.test.ts`
    - Use temp directories (`os.tmpdir()` + unique subdirs) to cover: normal writes, generated-header overwrite, non-generated conflict (no `force` → conflict, `force` → overwrite+warn), `--dry-run` no writes, `--check` success, `--check` changed file failure, `--check` stale/orphan generated file failure (removal drift), and normal-mode stale generated deletion warning.

22. `tests/cli/dbt/command.test.ts`
    - Cover required arg errors (`--manifest`, `--catalog`, `--dialect`, `--out`).
    - Cover unsupported dialect error.
    - Cover non-interactive security requirement (no TTY → error without `--no-security`/flags).
    - Cover `--no-security` warning path.
    - Cover summary output for dry-run/check by mocking `generateFromDbt` or using temp fixtures (do not require a TTY).

23. `tests/fixtures/dbt/postgres-simple/manifest.json`
    - Include materialized models `orders` and `customers` plus one `ephemeral_rollup` model to verify skipping.
    - Include model/column descriptions.
    - Include `unique` + `not_null` tests (or `meta.drizzle_cube.primary_key`) for `customers.id` and `orders.id`.
    - Include a dbt `relationships` test: `orders.customer_id` references `customers.id`.
    - Include an explicit measure in `meta.drizzle_cube.measures` for `orders.amount` (e.g. `totalAmount` sum) to verify conservative measure generation.
    - (Optional but recommended) a third materialized model with a **composite primary key** (e.g. `order_lines` keyed on `order_id` + `line_number`) to exercise composite-PK normalization + emission and the collision-free multi-model path. If added, add matching `expected/` files below.

24. `tests/fixtures/dbt/postgres-simple/catalog.json`
    - Include catalog columns for `orders` and `customers` (and the composite-PK model if added): integer IDs, `organisation_id`, text names/status, numeric amount, timestamp `created_at`, boolean `active`.
    - Include an unsupported column type in the ephemeral model (or a separate skipped model) only if expected warnings are asserted in `normalize.test.ts`.

25. `tests/fixtures/dbt/postgres-simple/expected/schema.ts`
    - Expected generated schema file for supported materialized models only. Imports `defineCube`-free `pg-core` builders actually used.

26. `tests/fixtures/dbt/postgres-simple/expected/cubes/orders.ts`
    - Expected generated `Orders` cube with security filter, dimensions, `countDistinct` baseline, explicit `totalAmount` measure, and `Customers` string-target `belongsTo` join.

27. `tests/fixtures/dbt/postgres-simple/expected/cubes/customers.ts`
    - Expected generated `Customers` cube with security filter, dimensions, and `countDistinct` baseline.

28. `tests/fixtures/dbt/postgres-simple/expected/cubes/<composite>.ts` *(only if composite-PK fixture model is added)*
    - Expected generated cube with all PK columns marked `primaryKey: true` and a `countDistinct` baseline using the `concat_ws` SQL expression.

29. `tests/fixtures/dbt/postgres-simple/expected/index.ts`
    - Expected generated root index exporting named cubes and `allCubes`.

> Note on expected-file extensions: the v2 approach stored expected output as `.ts` files importing `drizzle-cube/server` and added a `tsconfig.json` self-reference path (`"drizzle-cube/server": ["./src/server/index.ts"]`) so they typecheck against source. **v3 keeps this proven approach** (item 3 above). The alternative (`.txt`/`.snap` snapshots) is acceptable too, but the `.ts` approach gives free type-correctness verification of generated code and was approved in v2 — keep it.

## Commands

Exact commands from `.lastlight/issue-936/guardrails-report.md`:

```bash
npm run test
npm run lint
npm run typecheck
```

Targeted commands the executor should run first for faster feedback (and because the DB-backed `npm run test` gate requires Docker Compose which is not available in this sandbox — see Risks):

```bash
npm run test:cli
npm run build:cli
```

Sandbox note (from guardrails report + v2 executor): `npm install` may need `npm_config_cache=/tmp/npm-cache` because the default `/cache/npm` has root-owned files. Use `node_modules/.bin/<tool>` directly if `npx` hits the same cache-permission error. The full `npm run test` gate cannot pass in the sandbox (no `docker-compose` → DB-backed server tests fail to set up); the dbt generator path is covered entirely by DB-free CLI tests, so `npm run test:cli && npm run build:cli && npm run lint && npm run typecheck` is the achievable verification set, and is sufficient for this feature.

## Implementation approach

1. Update `src/cli/index.ts` to async dispatch first, preserving existing `charts init|list` behaviour and adding `dbt generate`/`dbt` help/routing.
2. Add `src/cli/dbt/types.ts` and `src/cli/dbt/naming.ts` so all downstream modules share strict types and deterministic identifiers. Add the `tsconfig.json` self-reference path now (item 3) so expected fixtures typecheck once written.
3. Implement `postgres-types.ts` with a tested allowlist. Unsupported column types return `null`; never guess placeholders. Verify `bigint({ mode: 'number' })` and `date` actually compile against installed `drizzle-orm` before committing to them.
4. Implement artifact loading/validation in `parse-artifacts.ts` using `unknown` + local type guards. Keep file I/O inside `loadDbtArtifacts`; expose pure `parseDbtArtifacts` for tests.
5. Implement `normalize.ts`: filter materialized models, merge manifest/catalog metadata, apply type mapping, detect PKs (composite-aware), parse explicit measures, apply security skip policy, build relationship edges only when all references resolve, and **run collision detection across all four identifier namespaces, throwing on any collision**.
6. Implement emitters:
   - `emit-schema.ts` for `schema.ts`.
   - `emit-cubes.ts` for one cube file per model plus `index.ts`, with the composite-PK `countDistinct`/`concat_ws` policy and string-target `belongsTo` joins.
   - Keep imports sorted and generated content byte-stable.
7. Implement `write-output.ts` with generated-header ownership, safe path normalization, dry-run/check/full expected-vs-existing drift comparison (including removals), and stale generated file deletion in normal mode.
8. Implement `generate.ts` orchestration and wire it into `commands/dbt.ts`, including prompt handling and warning/summary output.
9. Add fixtures and DB-free Vitest tests under `tests/cli/dbt/`; do **not** place these tests under root `tests/` or `tests/server/` (they must not trigger database global setup).
10. Update `vite.config.cli.ts` externals after imports are finalized and run `npm run build:cli` to verify bundling.
11. Add README and `docs/dbt-generate.md` docs.
12. Verify with targeted CLI tests/build first, then `lint` + `typecheck`. Run `npm run test` to confirm it fails only on the DB setup step (pre-existing sandbox limitation), not on new code.

## Risks and edge cases

For every input the design does NOT fully support, the behaviour is specified as **warn-and-skip** (column/join/measure/model dropped with a visible warning) or **warn-and-surface** (error/usage message) — never a silent default or dropped output:

- Raw dbt project files/YAML/Jinja: **warn-and-surface** as unsupported in docs/help; command accepts only local JSON artifacts.
- Remote GitHub/dbt sync: **warn-and-surface** as out of scope in docs/help; no clone/network.
- Running `dbt`: **warn-and-surface** as out of scope; users provide artifacts.
- Non-Postgres `--dialect`: **surface an error** before reading files.
- Missing `--manifest`/`--catalog`/`--out`: **surface an error** with help.
- Malformed JSON or missing required artifact top-level fields: **surface an error** naming the file and field.
- Unsupported dbt artifact versions: **warn-and-surface** if needed fields are missing; otherwise parse by fields, not hard-coded version.
- dbt sources/seeds/snapshots/exposures/metrics/semantic models: **warn-and-skip**; do not emit.
- `ephemeral` or unsupported model materialization: **warn-and-skip** with model + materialization.
- Missing catalog entry for a materialized model: **warn-and-skip** the model (schema needs types).
- Unsupported catalog column type: **warn-and-skip** that column (model + column + type). Cascade skip/drop of dependent security/join/PK output with its own warning. Never throw on one bad column.
- Arrays/enums/custom/user-defined Postgres types: **warn-and-skip** columns for v1.
- **Identifier/name collisions after camel/pascal conversion (v2 fix #1):** **surface a generation error** (throw in `normalize`) listing both offending models and the colliding identifier; do not silently overwrite.
- Reserved TypeScript identifiers or invalid identifiers: sanitize deterministically; if sanitization itself collides, **surface collision error**.
- Configured security column missing from a model: **warn-and-skip** the model; never emit a partially unfiltered model when filter security is configured.
- No security selected explicitly (`--no-security` or empty prompt): **warn-and-surface** in CLI output + generated comment; emit cubes without `where` only because the user explicitly requested no cube-level security.
- Non-interactive invocation without security flags: **surface an error** requiring `--no-security` or both filter flags.
- Relationships targeting skipped models/columns: **warn-and-skip** the join, not the whole run.
- Reverse `hasMany`, many-to-many, inferred join paths: **warn-and-surface** as unsupported in config/meta; dbt relationship tests produce only direct `belongsTo`.
- **Composite primary keys (v2 fix #2):** mark every PK dimension and emit `countDistinct` baseline (single-PK column ref; composite-PK `concat_ws` SQL expression). **Never silently downgrade to plain `count`.** If the composite expression cannot be rendered deterministically, throw rather than drop PK semantics.
- Explicit measure metadata with unsupported `MeasureType`, missing column, or incompatible non-numeric aggregate: **warn-and-skip** that measure.
- Existing file at expected path without generated header: **surface conflict** unless `--force`; never overwrite silently.
- Stale generated files for removed models: `--check` **must fail** (removal drift); normal mode deletes generated-header stale files and warns; `--dry-run` reports planned deletion without deleting.
- Path traversal in model/file names or `outDir`: normalize and ensure generated relative paths stay under `outDir`; **surface error** otherwise.
- Formatting churn: rely on deterministic emitter; do not invoke a project formatter unless tests are updated to reflect exact output.
- Sandbox: full `npm run test` cannot pass (no `docker-compose`); this is pre-existing and not caused by this change. The new code is DB-free and verified via `test:cli`/`build:cli`/`lint`/`typecheck`.

## Test strategy

- Unit-test pure naming, type mapping, artifact parsing, normalization, and emitters in `tests/cli/dbt/*.test.ts` under the `cli` Vitest project (DB-free, milliseconds).
- Use `tests/fixtures/dbt/postgres-simple/**` for byte-for-byte expected output comparisons (`.ts` expected files + `tsconfig.json` self-reference for typecheck coverage).
- Use temp directories for writer/check/dry-run tests, including stale generated file detection and conflicts with non-generated files.
- Test command validation/prompt-independent modes without requiring a TTY or database.
- Verify generated fixture files compile conceptually against public imports (`drizzle-cube/server`) and do **not** use private source imports or generic public types disallowed by `src/cli/CLAUDE.md:48-49`.
- **Explicit coverage for both v2 review fixes:** (a) `normalize.test.ts` asserts a collision throws; (b) `normalize.test.ts` + `emit.test.ts` assert composite PK keeps all `primaryKey: true` dimensions and emits `countDistinct` (not `count`).
- Run targeted checks: `npm run test:cli`, `npm run build:cli`.
- Run guardrails: `npm run lint`, `npm run typecheck`. Run `npm run test` and expect it to fail only at DB setup (sandbox limitation), not on new code.

## Estimated complexity

Complex.
