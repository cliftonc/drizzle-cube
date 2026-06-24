# Architect Plan — #936 DBT Sync to Cubes v2

## Problem Statement

Drizzle Cube currently exposes only the `charts` CLI route; `src/cli/index.ts:23-48` has no `dbt generate` command or async/error-handled command dispatch. The CLI area is intentionally DB-free and deterministic, and its local guidance explicitly requires pure parser/codegen modules plus visible warn-and-skip behavior for unsupported dbt generator inputs (`src/cli/CLAUDE.md:16-24`, `src/cli/CLAUDE.md:57-90`). Generated cube files must compile against the public authoring API exported from `drizzle-cube/server` (`src/server/index.ts:77-87`, `src/server/index.ts:120-125`) and the existing cube contract expects direct Drizzle columns for `sql`, dimensions, measures, and joins (`src/server/types/cube.ts:42-53`, `src/server/types/cube.ts:113-138`, `src/server/types/cube.ts:163-222`, `src/server/types/cube.ts:336-340`). The repository already has a DB-free CLI test project (`vitest.config.ts:50-64`, `tests/cli/charts-list.test.ts:1-10`), so the dbt artifact parser/generator should be covered there without Docker or database connections.

## Summary of what needs to change

Add a local, artifact-first `drizzle-cube dbt generate` command that reads dbt `manifest.json` and `catalog.json`, normalizes materialized Postgres models into a deterministic internal representation, and emits generated Drizzle `pg-core` schema plus one cube file per model. The command must support explicit security choices via flags or interactive prompt, no network/dbt runtime/YAML parsing, deterministic `--dry-run` and `--check` behavior, generated-file ownership checks, and visible warnings for every unsupported/skipped input. Add DB-free Vitest coverage with fixtures, update CLI build externals for new Node builtins, and document the command and v1 limitations.

## Files to modify — exhaustive manifest

### Existing files

1. `src/cli/index.ts` (`command`/`subcommand` router at `src/cli/index.ts:21-48`)
   - Import `dbtGenerate` and `printDbtHelp` from `./commands/dbt.js`.
   - Replace the synchronous top-level `if` body with an async `main()` that awaits command handlers and catches thrown `Error` values, writes `error.message` to stderr, and exits `1`.
   - Add route: `drizzle-cube dbt generate` -> `await dbtGenerate(process.argv.slice(4))`.
   - Add route/help: `drizzle-cube dbt` -> `printDbtHelp()`.
   - Update top-level help text to list both `charts` and `dbt`.

2. `vite.config.cli.ts` (`rollupOptions.external` at `vite.config.cli.ts:12-14`)
   - Extend externals for Node builtins used by the dbt command/modules: `node:fs/promises`, `node:readline/promises`, `node:process`, `node:os`, plus non-prefixed `fs/promises`, `readline/promises`, `process`, `os` if imported or referenced by the emitted bundle.

3. `README.md` (add after Quick Start section, near `README.md:41-105`, or before documentation links near `README.md:246`)
   - Add a concise section titled `Generate schema and cubes from dbt artifacts`.
   - Include the command:
     ```bash
     npx drizzle-cube dbt generate --manifest target/manifest.json --catalog target/catalog.json --dialect postgres --out ./src/cubes/generated --security-column organisation_id --security-context organisationId
     ```
   - Link to `docs/dbt-generate.md` for full options/limitations.
   - State v1 is local artifact-only, Postgres-only, and does not clone GitHub repos or run dbt.

### New source files

4. `src/cli/commands/dbt.ts`
   - Export `async function dbtGenerate(argv = process.argv.slice(4)): Promise<void>`.
   - Export `function printDbtHelp(): void`.
   - Parse options with `parseArgs`: `--manifest`, `--catalog`, `--dialect`, `--out`, `--security-column`, `--security-context`, `--no-security`, `--dry-run`, `--check`, `--force`, and optional `--config` reserved for JSON config.
   - Validate required options and unsupported dialects before reading artifacts.
   - Determine security mode:
     - If `--no-security`, use no-security and print a warning.
     - If both `--security-column` and `--security-context`, use security filter.
     - If exactly one is present, surface an error.
     - If neither and stdin/stdout are TTYs, prompt for tenant/organisation column; empty answer = no-security warning; non-empty answer prompts/derives security context default from lower-camel column name unless `--security-context` is provided.
     - If neither and non-interactive, surface an error requiring `--no-security` or both security flags.
   - Call the generator pipeline, print warnings to stderr, and print a file summary to stdout.
   - In `--check`, exit non-zero by throwing if drift is reported by writer.
   - Keep this as the only module that touches `process`, `readline`, console, or filesystem paths supplied by CLI.

5. `src/cli/dbt/types.ts`
   - Define all shared runtime types; do not use `as any`.
   - Required exports:
     - `type SecurityMode = { kind: 'filter'; columnName: string; contextProperty: string } | { kind: 'none' }`.
     - `interface DbtGenerateOptions { manifestPath: string; catalogPath: string; dialect: 'postgres'; outDir: string; security: SecurityMode; dryRun: boolean; check: boolean; force: boolean; configPath?: string }`.
     - `interface GeneratorWarning { code: string; message: string; modelName?: string; columnName?: string }`.
     - `interface GeneratedFile { path: string; content: string }` where `path` is out-dir-relative POSIX path.
     - `interface DbtModel`, `DbtColumn`, `DbtRelationshipTest`, `GeneratedModel`, `GeneratedColumn`, `GeneratedRelationship`, `GeneratedMeasure`, and `GenerationResult`.
     - Narrow string unions for supported materializations (`'table' | 'view' | 'incremental'`) and supported emitted column builders/dimension types.

6. `src/cli/dbt/naming.ts`
   - Export `toCamelCase`, `toPascalCase`, `toKebabCase`, `humanizeTitle`, `quoteStringLiteral`, `makeUniqueIdentifier`, and `sanitizeIdentifier`.
   - Implement deterministic conversion for snake_case, kebab-case, dotted dbt names, and names with spaces.
   - Surface identifier collisions to callers by returning both final names and collision warnings/errors, not by silently overwriting.

7. `src/cli/dbt/postgres-types.ts`
   - Export `mapPostgresCatalogType(type: string): { builder: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; warnings?: GeneratorWarning[] } | null`.
   - Supported v1 mappings:
     - integer-like: `smallint`, `integer`, `int`, `int2`, `int4`, `serial`, `smallserial` -> `integer`.
     - big integer-like: `bigint`, `int8`, `bigserial` -> `bigint` from `drizzle-orm/pg-core` with `{ mode: 'number' }` if emitted syntax is supported by current Drizzle; otherwise warn-and-skip until tests prove it compiles.
     - numeric/decimal: `numeric`, `decimal` -> `numeric` with string runtime values but Drizzle Cube dimension type `number`; document limitation.
     - floating: `real`, `float4`, `double precision`, `float8` -> `real`/`doublePrecision`.
     - text: `text`, `varchar`, `character varying`, `char`, `character`, `uuid` -> `text`.
     - booleans: `boolean`, `bool` -> `boolean`.
     - time: `date`, `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `timestamptz`, `time` -> `timestamp` for timestamp-like and `date` for date where supported; map dimension type to `time`.
     - JSON: `json`, `jsonb` -> `jsonb`.
   - Return `null` for arrays, enums, geometry, network types, user-defined/custom types, and anything unknown; caller must warn-and-skip the column.

8. `src/cli/dbt/parse-artifacts.ts`
   - Export `async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<ParsedDbtArtifacts>`.
   - Export pure `parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts` for tests.
   - Validate only fields needed using local type guards over `unknown`: manifest `nodes`, model `resource_type`, `name`, `alias`, `schema`, `database`, `description`, `config.materialized`, `columns`, `meta`, tests; catalog `nodes`, `columns`, column `type`, `index`, `comment`, `name`.
   - Extract dbt relationship tests from manifest test nodes, including both common forms: `test_metadata.name === 'relationships'` and `depends_on.nodes`/`column_name`/`kwargs` styles. If target model/column cannot be resolved, emit a warning and omit that relationship.
   - Do not parse raw dbt YAML/Jinja and do not run dbt.

9. `src/cli/dbt/normalize.ts`
   - Export `function normalizeDbtArtifacts(artifacts: ParsedDbtArtifacts, options: { security: SecurityMode }): { models: GeneratedModel[]; warnings: GeneratorWarning[] }`.
   - Include only materialized model resources with materialization `table`, `view`, or `incremental`.
   - Warn-and-skip `ephemeral` and unsupported materializations (`materialized_view`, `seed`, missing/unknown materialization, etc.) with model name and materialization.
   - Join manifest column descriptions/meta with catalog column types by dbt unique ID and column SQL name.
   - Use naming helpers for table exports, cube names, dimension keys, and file names; warn-and-surface error on model/column identifier collisions.
   - Detect primary keys from dbt tests/meta only when confident: accepted sources are `unique` + `not_null` tests on the column, manifest/catalog constraints if present, or `meta.drizzle_cube.primary_key: true`. Composite keys must mark every key column `primaryKey: true` and countDistinct over the composite-aware key policy described in `emit-cubes.ts` below.
   - Build baseline `count` measure for every emitted model; add explicit measures only from `meta.drizzle_cube.measures` on model or column. Invalid measure metadata -> warn-and-skip that measure.
   - Apply security policy: if `security.kind === 'filter'` and a materialized model lacks that SQL column after type mapping, warn-and-skip the entire model. Never emit a model without row-level filtering when filter security was configured.
   - Drop relationships whose source/target model was skipped or whose source/target columns were skipped, with a dedicated warning.

10. `src/cli/dbt/emit-schema.ts`
    - Export `function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile`.
    - Emit `<out>/schema.ts` content with generated header.
    - Import only actually used builders from `drizzle-orm/pg-core`, sorted alphabetically except `pgTable` first for readability.
    - Emit `export const <tableExport> = pgTable('<relation_name>', { ... })` for each model in sorted file/model order.
    - Emit column properties in deterministic catalog/dbt order, using lower-camel property names and original SQL names.
    - Emit `.primaryKey()` and `.notNull()` only when confidently known from dbt metadata/tests; otherwise leave conservative nullable builders.
    - Export `schema` object and `export type Schema = typeof schema`.

11. `src/cli/dbt/emit-cubes.ts`
    - Export `function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[]`.
    - Emit `cubes/<fileName>.ts` for every generated model and `index.ts` for the generated root.
    - Cube files import `defineCube` and public types from `drizzle-cube/server`; generated code must use non-generic `QueryContext`, `BaseQueryDefinition`, and `Cube` per `src/cli/CLAUDE.md:48-49`.
    - If any cube emits a security filter, import `eq` from `drizzle-orm` and generate `sql: (ctx: QueryContext): BaseQueryDefinition => ({ from: table, where: eq(table.securityColumn, ctx.securityContext.contextProperty) })`.
    - If no-security, generate `sql: (): BaseQueryDefinition => ({ from: table })` and include a generated comment in the cube file noting no cube-level security filter was requested.
    - Emit dimensions for all mapped columns, with `name`, `title`, `description` when present, `type`, `sql`, and `primaryKey: true` for every PK column including composite PKs.
    - Baseline measure policy:
      - If one or more primary key columns are known, emit `count` with `type: 'countDistinct'`. For single-column PK, include `sql: table.pk`. For composite PK, emit `type: 'countDistinct'` and a deterministic `sql` expression using `sql` from `drizzle-orm` only if the expression compiles; otherwise emit a warning and fall back to `type: 'count'` without dropping PK dimension markers.
      - If no PK is known, emit `count` with `type: 'count'` and no guessed PK.
    - Emit explicit measures from dbt meta only when their `type` is in `MeasureType` (`src/server/types/core.ts:178-208`) and referenced column exists; invalid references/types warn-and-skip.
    - Emit direct `belongsTo` joins from normalized relationships using string `targetCube` names to avoid circular imports.
    - `index.ts` imports every cube in deterministic order and exports both named cube exports and `allCubes` array.

12. `src/cli/dbt/write-output.ts`
    - Export `async function writeGeneratedOutput(files: GeneratedFile[], options: { outDir: string; dryRun: boolean; check: boolean; force: boolean }): Promise<WriteResult>`.
    - Enforce all writes stay under `outDir` after path normalization.
    - Generated ownership header constant: `// Generated by drizzle-cube dbt generate.`.
    - Normal mode:
      - Create directories as needed.
      - Overwrite files with the generated header.
      - If an expected path exists without the header and `force` is false, surface a conflict error.
      - If `force` is true, overwrite conflicts but warn clearly.
      - Detect existing generated-header files under `outDir` that are no longer expected; delete them in normal mode and warn that stale generated output was removed.
    - `--dry-run`: write nothing; report all creates/updates/deletes/conflicts.
    - `--check`: write/delete nothing; compare the full expected file set against the full existing generated-header file set under `outDir`; fail on changed, missing, conflicting, or stale/orphaned files.

13. `src/cli/dbt/generate.ts`
    - Export `async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult>`.
    - Orchestrate `loadDbtArtifacts` -> `normalizeDbtArtifacts` -> `emitSchema` + `emitCubes` -> `writeGeneratedOutput`.
    - Return generated files, write result, and accumulated warnings for command printing.

### New documentation

14. `docs/dbt-generate.md`
    - Document command usage, required artifacts, generating artifacts with dbt externally (`dbt docs generate`/`dbt compile` as applicable, without the CLI running dbt), options, security modes, output layout, warn-and-skip behavior, `--dry-run`, `--check`, Postgres type support, and v1 limitations.
    - Explicitly state unsupported inputs: raw dbt project/YAML/Jinja, remote GitHub repos, running dbt, non-Postgres dialects, sources/seeds/snapshots/ephemeral models, reverse/many-to-many joins, and merge-preserving manual edits.

### New tests and fixtures

15. `tests/cli/dbt/naming.test.ts`
    - Cover snake/kebab/dotted names, reserved words, invalid starting characters, humanized titles, and collision detection.

16. `tests/cli/dbt/postgres-types.test.ts`
    - Cover every supported type family listed in `src/cli/dbt/postgres-types.ts`.
    - Cover unsupported arrays/enums/custom types returning `null` so callers warn-and-skip.

17. `tests/cli/dbt/parse-artifacts.test.ts`
    - Cover model/resource extraction from fixture artifacts.
    - Cover relationship test extraction for representative dbt relationship test shape.
    - Cover malformed/missing top-level `nodes` surfacing a validation error.

18. `tests/cli/dbt/normalize.test.ts`
    - Cover materialized model inclusion and ephemeral/unsupported materialization warn-and-skip.
    - Cover unsupported column type warn-and-skip.
    - Cover configured security column missing -> model warn-and-skip.
    - Cover composite PK marking all key dimensions.
    - Cover invalid explicit measure metadata warn-and-skip.
    - Cover relationship dropped when target/source model or column was skipped.

19. `tests/cli/dbt/emit.test.ts`
    - Compare generated files against `tests/fixtures/dbt/postgres-simple/expected/**` byte-for-byte.
    - Cover security-filter and no-security variants.
    - Assert emitted cube code imports from `drizzle-cube/server` and uses direct Drizzle table/column references.

20. `tests/cli/dbt/write-output.test.ts`
    - Use temp directories to cover normal writes, generated-header overwrite, non-generated conflict, `--dry-run` no writes, `--check` success, `--check` changed file failure, `--check` stale/orphan generated file failure, and normal stale generated deletion warning.

21. `tests/cli/dbt/command.test.ts`
    - Cover required arg errors (`--manifest`, `--catalog`, `--dialect`, `--out`).
    - Cover unsupported dialect error.
    - Cover non-interactive security requirement.
    - Cover `--no-security` warning path.
    - Cover summary output for dry-run/check by mocking pipeline or using temp fixtures.

22. `tests/fixtures/dbt/postgres-simple/manifest.json`
    - Include materialized models `orders` and `customers` plus one `ephemeral_rollup` model to verify skipping.
    - Include model/column descriptions.
    - Include `unique` + `not_null` tests or `meta.drizzle_cube.primary_key` for `customers.id` and `orders.id`.
    - Include a dbt `relationships` test: `orders.customer_id` references `customers.id`.
    - Include an explicit measure in `meta.drizzle_cube.measures` for `orders.amount` (e.g. `totalAmount` sum) to verify conservative measure generation.

23. `tests/fixtures/dbt/postgres-simple/catalog.json`
    - Include catalog columns for `orders` and `customers`: integer IDs, `organisation_id`, text names/status, numeric amount, timestamp created_at, boolean active.
    - Include an unsupported column type in the ephemeral model or a separate skipped model only if expected warnings are asserted.

24. `tests/fixtures/dbt/postgres-simple/expected/schema.ts`
    - Expected generated schema file for supported materialized models only.

25. `tests/fixtures/dbt/postgres-simple/expected/cubes/orders.ts`
    - Expected generated Orders cube with security filter, dimensions, count/countDistinct baseline, explicit `totalAmount` measure, and `Customers` string-target `belongsTo` join.

26. `tests/fixtures/dbt/postgres-simple/expected/cubes/customers.ts`
    - Expected generated Customers cube with security filter, dimensions, and count/countDistinct baseline.

27. `tests/fixtures/dbt/postgres-simple/expected/index.ts`
    - Expected generated root index exporting named cubes and `allCubes`.

## Commands

Exact commands identified by `.lastlight/issue-936/guardrails-report.md`:

```bash
npm run test
npm run lint
npm run typecheck
```

Additional targeted commands the executor should run before the full suite for faster feedback:

```bash
npm run test:cli
npm run build:cli
```

## Implementation approach

1. Update `src/cli/index.ts` to async dispatch first, preserving existing `charts init|list` behavior and adding `dbt generate` help/routing.
2. Add `src/cli/dbt/types.ts` and `src/cli/dbt/naming.ts` so all downstream modules share strict types and deterministic identifiers.
3. Implement `postgres-types.ts` with a tested allowlist. Unsupported column types must return `null`; do not guess text placeholders.
4. Implement artifact loading/validation in `parse-artifacts.ts` using `unknown` + local type guards. Keep file I/O inside `loadDbtArtifacts`; expose pure `parseDbtArtifacts` for tests.
5. Implement `normalize.ts` to filter materialized models, merge manifest/catalog metadata, apply type mapping, detect PKs, parse explicit measures, apply security skip policy, and produce relationship edges only when all references resolve.
6. Implement emitters:
   - `emit-schema.ts` for `schema.ts`.
   - `emit-cubes.ts` for one cube file per model plus `index.ts`.
   - Keep imports sorted and generated content byte-stable.
7. Implement `write-output.ts` with generated-header ownership, safe path normalization, dry-run/check/full expected-vs-existing drift comparison, and stale generated file deletion in normal mode.
8. Implement `generate.ts` orchestration and wire it into `commands/dbt.ts`, including prompt handling and warning/summary output.
9. Add fixtures and DB-free Vitest tests under `tests/cli/dbt/`; do not place these tests under root `tests/` or `tests/server/` because they must not trigger database global setup.
10. Update `vite.config.cli.ts` externals after imports are finalized and run `npm run build:cli` to verify bundling.
11. Add README and `docs/dbt-generate.md` docs.
12. Verify with targeted CLI tests/build first, then the guardrail commands from the report.

## Risks and edge cases

- Raw dbt project files/YAML/Jinja: warn-and-surface as unsupported command usage in docs/help; command accepts only local JSON artifacts and never attempts parsing.
- Remote GitHub/dbt sync: warn-and-surface as out of scope in docs/help; no clone/network behavior.
- Running `dbt`: warn-and-surface as out of scope; users must provide artifacts.
- Non-Postgres `--dialect`: surface an error before reading files.
- Missing `--manifest`, `--catalog`, or `--out`: surface an error with help.
- Malformed JSON or missing required artifact top-level fields: surface an error naming the file and field.
- Unsupported dbt artifact versions: warn-and-surface if needed fields are missing; otherwise parse by fields rather than hard-coding version.
- dbt sources/seeds/snapshots/exposures/metrics/semantic models: warn-and-skip; do not emit.
- `ephemeral` or unsupported model materialization: warn-and-skip with model/materialization.
- Missing catalog entry for a materialized model: warn-and-skip that model because schema generation needs type metadata.
- Unsupported catalog column type: warn-and-skip that column with model, column, and type. If no usable columns remain or required security/relationship/PK columns are skipped, cascade warning and skip/drop dependent output.
- Arrays/enums/custom/user-defined Postgres types: warn-and-skip columns for v1.
- Identifier/name collisions after camel/pascal conversion: warn-and-surface as a generation error; do not silently overwrite a model/column/measure.
- Reserved TypeScript identifiers or invalid identifiers: sanitize deterministically; if sanitization collides, surface collision error.
- Configured security column missing from a model: warn-and-skip the model; never emit a partially unfiltered model when filter security is configured.
- No security selected explicitly (`--no-security` or empty prompt): warn-and-surface in CLI output and include a generated comment; emit cubes without `where` only because the user explicitly requested no cube-level security.
- Non-interactive invocation without security flags: surface an error requiring `--no-security` or both filter flags.
- Relationships targeting skipped models/columns: warn-and-skip the join, not the whole run.
- Reverse `hasMany`, many-to-many, and inferred join paths: warn-and-surface as unsupported when encountered in config/meta; dbt relationship tests produce only direct `belongsTo`.
- Composite primary keys: mark every PK dimension. CountDistinct over composite PK should be emitted only if the expression compiles; otherwise warn and fall back to plain `count` while retaining PK dimension markers.
- Explicit measure metadata with unsupported `MeasureType`, missing column, or incompatible non-numeric aggregate: warn-and-skip that measure.
- Existing file at expected path without generated header: surface conflict error unless `--force`; never overwrite silently.
- Stale generated files for removed models: `--check` must fail; normal mode should delete generated-header stale files and warn; `--dry-run` should report planned deletion without deleting.
- Path traversal in model/file names or `outDir`: normalize and ensure generated relative paths stay under `outDir`; surface error otherwise.
- Formatting churn: rely on deterministic emitter; do not invoke a project formatter unless tests are updated to reflect exact output.

## Test strategy

- Unit-test pure naming, type mapping, artifact parsing, normalization, and emitters in `tests/cli/dbt/*.test.ts` under the `cli` Vitest project.
- Use `tests/fixtures/dbt/postgres-simple/**` for byte-for-byte expected output comparisons.
- Use temp directories for writer/check/dry-run tests, including stale generated file detection and conflicts with non-generated files.
- Test command validation/prompt-independent modes without requiring a TTY or database.
- Verify generated fixture files compile conceptually against public imports (`drizzle-cube/server`) and do not use private source imports or generic public types disallowed by `src/cli/CLAUDE.md:48-49`.
- Run targeted checks: `npm run test:cli`, `npm run build:cli`.
- Run required guardrails: `npm run test`, `npm run lint`, `npm run typecheck`.

## Estimated complexity

Complex.
