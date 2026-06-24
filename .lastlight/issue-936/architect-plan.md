# Architect plan for #936 — DBT Sync to Cubes

## Problem Statement

The current CLI entry point only routes `charts init|list`, so there is no `drizzle-cube dbt generate` surface for reading dbt artifacts or writing generated files (`src/cli/index.ts:23-47`). Drizzle Cube’s authoring model expects users to already have Drizzle schema objects and hand-written cubes with `defineCube`, direct column references, measures, dimensions, joins, and tenant filters (`README.md:49-83`, `dev/server/cubes.ts:23-89`). The server contracts require dimensions to map to `string | number | time | boolean`, measures to existing `MeasureType` values, and joins to direct Drizzle column references (`src/server/types/core.ts:178-213`, `src/server/types/cube.ts:113-138`, `src/server/types/cube.ts:163-222`). The dev schema shows the Postgres Drizzle style this generator should emit (`pgTable` and `drizzle-orm/pg-core` builders in `dev/server/schema.ts:6-24`), but there is currently no code to derive that schema from dbt `manifest.json`/`catalog.json`.

## Summary of what needs to change

Add an artifact-first, local-only CLI command `drizzle-cube dbt generate` that reads dbt `manifest.json` and `catalog.json`, normalizes materialized Postgres models into an internal generation graph, and emits deterministic Drizzle schema plus one cube file per materialized model. The command must support interactive security prompting, CI-safe `--security-column`/`--security-context` or `--no-security`, `--dry-run`, `--check`, and safe overwrites of owned generated files. Implement the generator as pure, testable modules under `src/cli/dbt/`, add Vitest fixtures/expected output, update the CLI bundle config for new Node builtins, and document the workflow and v1 limitations.

## Files to modify — exhaustive manifest

### Existing files

1. `src/cli/index.ts` (`src/cli/index.ts:13-47`)
   - Import `dbtGenerate` and `printDbtHelp` from `./commands/dbt.js`.
   - Replace the current top-level synchronous routing with an async `main(): Promise<void>` wrapped in `main().catch(...)` so async file I/O/prompt failures print a concise error to `stderr` and exit `1`.
   - Keep existing `charts init|list` behavior unchanged, but invoke it inside the async router.
   - Add routing for `command === 'dbt' && subcommand === 'generate'` to call `await dbtGenerate(process.argv.slice(4))`.
   - Add routing for unknown `dbt` subcommands to print `printDbtHelp()`.
   - Update root help text to list both `drizzle-cube charts` and `drizzle-cube dbt`.
   - Do not add new dependencies; keep Node stdlib only.

2. `vite.config.cli.ts` (`vite.config.cli.ts:12-14`)
   - Extend `rollupOptions.external` to include every Node builtin used by the new command modules: `node:fs`, `node:path`, `node:util`, `node:readline/promises`, `node:process`, plus the existing non-prefixed `fs` and `path`.
   - If executor chooses `fs.promises` from `node:fs` rather than `node:fs/promises`, do not add `node:fs/promises`; if they import `node:fs/promises`, add it here too.

3. `README.md` (`README.md:244-251` Documentation section)
   - Add a bullet/link for the new dbt artifact generator: `dbt artifact generator — generate Postgres Drizzle schema and cubes from local dbt manifest/catalog artifacts` linking to `docs/dbt-generate.md`.
   - Add a short CLI example near the documentation link or immediately after Quick Start: `npx drizzle-cube dbt generate --manifest target/manifest.json --catalog target/catalog.json --dialect postgres --out ./src/cubes/generated --no-security`.
   - Mention that `--no-security` is an explicit opt-out and that production multi-tenant deployments should configure `--security-column`/`--security-context`.

4. `tsconfig.tests.json` (`tsconfig.tests.json:8-18`)
   - No change expected if tests are `.ts` under `tests/cli/dbt/**`; keep as-is unless the executor creates `.tsx` tests (do not create `.tsx` tests for this feature).
   - If fixture import helpers require JSON imports from tests, `resolveJsonModule` is already inherited from `tsconfig.json`; no change required.

### New production files under `src/cli/dbt/`

5. `src/cli/commands/dbt.ts` (new file)
   - Export `async function dbtGenerate(args: string[] = process.argv.slice(4)): Promise<void>`.
   - Export `function printDbtHelp(): void`.
   - Use `parseArgs({ args, options, allowPositionals: false, strict: true })` with options:
     - `manifest: { type: 'string' }`
     - `catalog: { type: 'string' }`
     - `dialect: { type: 'string' }`
     - `out: { type: 'string' }`
     - `config: { type: 'string' }`
     - `security-column: { type: 'string' }`
     - `security-context: { type: 'string' }`
     - `no-security: { type: 'boolean' }`
     - `dry-run: { type: 'boolean' }`
     - `check: { type: 'boolean' }`
     - `force: { type: 'boolean' }`
     - `help: { type: 'boolean', short: 'h' }`
   - Validate required `--manifest`, `--catalog`, `--dialect postgres`, and `--out`; unsupported dialect must throw/print a clear error.
   - Load optional generator config via `loadGeneratorConfig`.
   - Resolve security mode:
     - CLI flags override config.
     - `--no-security` conflicts with `--security-column`/`--security-context`.
     - Non-interactive mode (`!process.stdin.isTTY || !process.stdout.isTTY`) requires either complete security config or explicit `--no-security`.
     - Interactive mode with no security input prompts: `Tenant/organisation filter column (blank for no cube-level security):`; if non-empty, prompt for context property with default lower-camel of the column.
   - Call `loadDbtArtifacts`, `normalizeDbtArtifacts`, `generateDbtFiles`, and `writeGeneratedFiles`.
   - Print concise file plan/results (`Generated N files`, `Would write`, `Output is current`, etc.) and warnings (notably no-security).

6. `src/cli/dbt/types.ts` (new file)
   - Define minimal dbt artifact types used by parser:
     - `DbtManifest`, `DbtManifestNode`, `DbtManifestColumn`, `DbtCatalog`, `DbtCatalogNode`, `DbtCatalogColumn`, `DbtTestNode`.
     - Keep unknown dbt fields as `Record<string, unknown>` instead of exhaustive dbt schemas.
   - Define command/config types:
     - `DbtGenerateOptions`, `GeneratorConfig`, `SecurityConfig` (`{ mode: 'none' } | { mode: 'column'; column: string; context: string }`), `GeneratorWarning`.
   - Define normalized IR:
     - `GeneratedModel` with `uniqueId`, `dbtName`, `relationName`, `schemaName?`, `databaseName?`, `tableExportName`, `cubeName`, `cubeVarName`, `fileName`, `title`, `description?`, `columns`, `primaryKeyColumn?`, `joins`, `measures`.
     - `GeneratedColumn` with `dbName`, `propertyName`, `dimensionName`, `title`, `description?`, `catalogType`, `drizzleBuilder`, `drizzleImport`, `dimensionType`, `primaryKey`, `notNull`.
     - `GeneratedJoin` with source/target model IDs, cube names, source/target column property names, and relationship fixed to `'belongsTo'`.
     - `GeneratedMeasure` with `name`, `title`, `type`, optional `columnPropertyName`, optional `description`, optional `format`.
     - `GeneratedFile` with `path` (relative to out root) and `content`.
   - Export `GENERATED_HEADER_PREFIX = '// Generated by drizzle-cube dbt generate.'`.

7. `src/cli/dbt/errors.ts` (new file)
   - Define `export class DbtGenerateError extends Error` for expected user-facing failures.
   - Define `assert(condition, message): asserts condition` helper if useful.
   - Keep this separate so command catches can distinguish expected generation errors from unexpected stack traces.

8. `src/cli/dbt/naming.ts` (new file)
   - Export deterministic helpers:
     - `toCamelCase(sqlName: string): string`
     - `toPascalCase(sqlName: string): string`
     - `toFileName(modelName: string): string` (lower-kebab or snake-to-kebab; must be stable)
     - `humanizeName(name: string): string`
     - `toSafeIdentifier(identifier: string, fallbackPrefix: string): string`
     - `quoteTsString(value: string): string` (use `JSON.stringify`)
     - `makeUniqueName(base, used)` for collision handling.
   - Handle reserved words/prototype-polluting keys (`__proto__`, `constructor`, `prototype`) by prefixing with the fallback prefix.
   - Preserve acronyms deterministically enough for fixture expectations; do not attempt schema introspection.

9. `src/cli/dbt/config.ts` (new file)
   - Export `async function loadGeneratorConfig(configPath?: string): Promise<GeneratorConfig>`.
   - Config must be JSON only for v1; no YAML dependency.
   - Supported config shape:
     ```json
     {
       "security": { "mode": "none" }
       // or { "mode": "column", "column": "organisation_id", "context": "organisationId" },
       "models": {
         "orders": {
           "cubeName": "Orders",
           "tableExportName": "orders",
           "columns": {
             "customer_id": { "propertyName": "customerId", "dimensionName": "customerId", "dimensionType": "number" }
           },
           "measures": [
             { "name": "totalAmount", "type": "sum", "column": "amount", "title": "Total Amount" }
           ]
         }
       },
       "typeOverrides": { "money": { "drizzleBuilder": "numeric", "dimensionType": "number" } }
     }
     ```
   - Validate enough to fail clear messages for invalid top-level types, invalid security mode, invalid measure type, or non-string override fields.
   - Document precedence in code comments and docs: CLI security flags > config > dbt `meta.drizzle_cube` > naming/type defaults for non-security settings, except dbt column-level metadata can override column names/measures before model config appends/overrides explicit measures.

10. `src/cli/dbt/parse-artifacts.ts` (new file)
    - Export `async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<{ manifest: DbtManifest; catalog: DbtCatalog }>`.
    - Read JSON with `fs.promises.readFile`; wrap JSON parse errors with artifact path.
    - Validate required shapes: `manifest.nodes` object and `catalog.nodes` object.
    - Export helper selectors:
      - `getModelNodes(manifest)` returning manifest nodes where `resource_type === 'model'`.
      - `isMaterializedModel(node)` returning true for materializations `table`, `view`, `incremental`, `materialized_view`; false for `ephemeral`; false/skip for missing materialization with warning.
      - `getCatalogNode(catalog, uniqueId)`.
      - `getRelationshipTests(manifest)` returning relationship tests parsed from dbt generic test nodes.
      - `getPrimaryKeyCandidates(manifest, modelUniqueId)` using dbt constraints if available, `meta.drizzle_cube.primary_key`, or columns that have both `unique` and `not_null` tests.
    - Relationship tests must support common dbt manifest shapes:
      - `test_metadata.name === 'relationships'` with `test_metadata.kwargs.field`, `to`, and `column_name`/`field`.
      - `depends_on.nodes` containing source and target model unique IDs.
      - Fall back to skip with warning when source/target/columns cannot be resolved.

11. `src/cli/dbt/postgres-types.ts` (new file)
    - Export `mapPostgresCatalogType(catalogType: string, overrides?: GeneratorConfig['typeOverrides']): PostgresTypeMapping`.
    - `PostgresTypeMapping` fields: `drizzleImport`, `builderExpression(columnNameLiteral: string): string`, `dimensionType?: 'string' | 'number' | 'time' | 'boolean'`, `supportsDimension: boolean`.
    - Supported v1 mappings:
      - `smallint`, `int2`, `integer`, `int`, `int4`, `serial`, `serial4` -> `integer('col')`, dimension `number`.
      - `bigint`, `int8`, `bigserial`, `serial8` -> `bigint('col', { mode: 'number' })`, dimension `number`.
      - `numeric`, `decimal`, `money` -> `numeric('col')`, dimension `number`.
      - `real`, `float4` -> `real('col')`, dimension `number`.
      - `double precision`, `float8` -> `doublePrecision('col')`, dimension `number`.
      - `text`, `varchar`, `character varying`, `character`, `char`, `uuid` -> `text('col')`, dimension `string` (use `uuid('col')` only if executor chooses to add a tested uuid mapping and import).
      - `boolean`, `bool` -> `boolean('col')`, dimension `boolean`.
      - `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `timestamptz` -> `timestamp('col')`, dimension `time`.
      - `date` -> `date('col')`, dimension `time`.
      - `time`, `time without time zone`, `time with time zone`, `timetz` -> `time('col')`, dimension `time`.
      - `json`, `jsonb` -> `jsonb('col')`, `supportsDimension: false` unless config/dbt meta supplies `dimensionType`.
    - Strip length/precision suffixes such as `varchar(255)` and `numeric(10,2)` before matching.
    - Unsupported types must throw `DbtGenerateError` naming model/column/type at normalization time.

12. `src/cli/dbt/normalize.ts` (new file)
    - Export `function normalizeDbtArtifacts(input): { models: GeneratedModel[]; warnings: GeneratorWarning[] }`.
    - Inputs: artifacts, config, security config, dialect fixed to postgres.
    - Include only materialized dbt model nodes (`table`, `view`, `incremental`, `materialized_view`); skip `ephemeral` and non-model nodes with warning.
    - Require a matching catalog node for every included model; fail if missing.
    - Build table/cube/column names using dbt `meta.drizzle_cube` overrides, config overrides, then naming defaults.
    - Build columns by joining manifest column descriptions/meta with catalog column type metadata; stable sort by catalog index if present, otherwise column name.
    - Determine primary key only when confident: dbt constraints primary key, `meta.drizzle_cube.primary_key`, or unique+not_null tests; otherwise `primaryKeyColumn` undefined.
    - Security validation: if `{ mode: 'column' }`, every generated model must contain that SQL column; fail listing missing models.
    - Measures:
      - Always emit `count` measure. If primary key known, type `countDistinct` over primary key; otherwise type `count` over no column if compiler supports optional `sql` (`src/server/types/cube.ts:218-222`), or over first primary-like ID column only when explicit.
      - Add explicit measures from dbt `meta.drizzle_cube.measures` and config `models[model].measures` only; validate measure type against `MeasureType` values in `src/server/types/core.ts:178-208` and validate referenced column exists.
      - Do not infer `sum`/`avg` from numeric columns.
    - Joins:
      - Convert supported dbt `relationships` tests to source-model `belongsTo` joins only.
      - Use string `targetCube` names in IR/output.
      - Deduplicate duplicate tests by `(sourceModel, targetModel, sourceColumn, targetColumn)`.
    - Return models sorted by `cubeName`/`dbtName` for deterministic output.

13. `src/cli/dbt/emit-schema.ts` (new file)
    - Export `function emitSchemaFile(models: GeneratedModel[], sourceInfo): GeneratedFile`.
    - Emit `<out>/schema.ts` content only; returned path must be `schema.ts`.
    - Header:
      ```ts
      // Generated by drizzle-cube dbt generate.
      // Source: manifest=<path>, catalog=<path>, dialect=postgres.
      // Do not edit manually; change dbt metadata or generator config instead.
      ```
    - Import used `pg-core` builders sorted alphabetically, always including `pgTable`; include `bigint`, `boolean`, `date`, `doublePrecision`, `integer`, `jsonb`, `numeric`, `real`, `text`, `time`, `timestamp` only when used.
    - Emit each table:
      ```ts
      export const orders = pgTable('orders', {
        id: integer('id').primaryKey(),
        customerId: integer('customer_id').notNull(),
      })
      ```
    - Apply `.primaryKey()` and `.notNull()` only when confidently known from normalized metadata/catalog; do not emit indexes/relations in v1.
    - Emit `export const schema = { ... }` and `export type Schema = typeof schema` at bottom.

14. `src/cli/dbt/emit-cubes.ts` (new file)
    - Export `function emitCubeFiles(models: GeneratedModel[], options): GeneratedFile[]`.
    - For each model emit `cubes/<fileName>.ts`.
    - Per-cube imports:
      - `import { eq } from 'drizzle-orm'` only if security mode column applies.
      - `import { defineCube } from 'drizzle-cube/server'`.
      - `import type { BaseQueryDefinition, QueryContext } from 'drizzle-cube/server'`.
      - `import { <own table>, <target join tables...> } from '../schema.js'` sorted and deduped.
    - Emit `export const <cubeVarName> = defineCube('<CubeName>', { ... })`.
    - Emit `sql: (ctx: QueryContext): BaseQueryDefinition => ({ from: table, where: eq(table.securityProp, ctx.securityContext.contextProp) })` when security configured.
    - Emit `sql: (): BaseQueryDefinition => ({ from: table })` when no-security.
    - Emit deterministic `title`, optional `description`, `dimensions`, `measures`, and optional `joins` blocks.
    - Dimensions use direct `table.property` references and only supported dimension types.
    - Count measure rules from normalize; explicit measures include `sql: table.property` and optional descriptions/formats.
    - Joins use string target references:
      ```ts
      Customers: {
        targetCube: 'Customers',
        relationship: 'belongsTo',
        on: [{ source: orders.customerId, target: customers.id }]
      }
      ```
    - Export `index.ts` importing every cube file with `.js` extension and exporting named cubes plus `allCubes` array.

15. `src/cli/dbt/generator.ts` (new file)
    - Export `async function generateDbtFiles(options: DbtGenerateOptions): Promise<{ files: GeneratedFile[]; warnings: GeneratorWarning[] }>`.
    - Orchestrate load/normalize/emit; keep command thin.
    - Ensure returned file list is sorted by path: `schema.ts`, `cubes/*.ts`, `index.ts`.

16. `src/cli/dbt/write-output.ts` (new file)
    - Export `async function writeGeneratedFiles(files: GeneratedFile[], outDir: string, mode: { dryRun?: boolean; check?: boolean; force?: boolean }): Promise<WriteResult>`.
    - Resolve paths with `path.resolve(outDir, file.path)` and verify every target starts with resolved out dir; reject path traversal.
    - Normal write mode:
      - Create directories recursively.
      - If file exists and does not start with `GENERATED_HEADER_PREFIX`, fail unless `force` is true.
      - Overwrite generated files deterministically.
    - `dryRun`: do not write; return planned paths and whether each would be create/update/unchanged.
    - `check`: do not write; fail/return non-current if any file is missing or content differs; command exits non-zero.
    - Do not delete stale generated files in v1; optionally warn about generated files under `outDir` not in the current file set.

### New tests and fixtures

17. `tests/cli/dbt/naming.test.ts` (new file)
    - Cover snake/kebab/space to camel/pascal/file/human names.
    - Cover reserved/prototype-polluting identifiers and duplicate collision handling.

18. `tests/cli/dbt/postgres-types.test.ts` (new file)
    - Cover every supported type mapping listed for `src/cli/dbt/postgres-types.ts`.
    - Cover stripped precision/length forms (`varchar(255)`, `numeric(10,2)`).
    - Cover unsupported type failure and type override success.

19. `tests/cli/dbt/parse-artifacts.test.ts` (new file)
    - Use `tests/fixtures/dbt/postgres-simple/manifest.json` and `catalog.json`.
    - Assert only model nodes are returned, materialization helper handles `table`, `view`, `incremental`, `materialized_view`, and skips `ephemeral`.
    - Assert relationship test extraction finds `orders.customer_id -> customers.id`.
    - Assert malformed JSON / missing `nodes` shape errors include the artifact path.

20. `tests/cli/dbt/normalize.test.ts` (new file)
    - Assert normalized models include `Customers` and `Orders`, skip the fixture’s ephemeral helper model, and include deterministic columns/descriptions.
    - Assert security column configured as `organisation_id` requires both models to contain that column.
    - Assert missing security column fails with model names.
    - Assert count/countDistinct behavior and explicit `meta.drizzle_cube.measures` / config measures.
    - Assert relationship tests produce only `belongsTo` joins on source cube.

21. `tests/cli/dbt/emit.test.ts` (new file)
    - Assert emitted `schema.ts`, `cubes/customers.ts`, `cubes/orders.ts`, and `index.ts` exactly match expected fixture files.
    - Include both security and no-security expected outputs if practical; minimum exact match for security plus targeted assertion for no-security warning/output.
    - Assert second emit with same artifacts is byte-for-byte identical.

22. `tests/cli/dbt/write-output.test.ts` (new file)
    - Use temporary directories.
    - Cover normal write, `dryRun`, `check` success/failure, refusal to overwrite non-generated files without `force`, and path traversal rejection.

23. `tests/cli/dbt/command.test.ts` (new file)
    - Call `dbtGenerate(args)` directly with fixture paths and temp output.
    - Cover missing required args, unsupported dialect, non-interactive security requiring `--no-security` or full security flags, `--dry-run`, and `--check` exit/error behavior.
    - Mock/stub `process.stdin.isTTY`/`process.stdout.isTTY` only if testing prompt branching; avoid actual interactive prompts in CI.

24. `tests/fixtures/dbt/postgres-simple/manifest.json` (new file)
    - Minimal dbt manifest fixture with:
      - `model.project.customers` materialized `table`, columns `id`, `name`, `organisation_id`, `created_at` with descriptions.
      - `model.project.orders` materialized `incremental` or `table`, columns `id`, `customer_id`, `organisation_id`, `amount`, `status`, `ordered_at` with descriptions.
      - `model.project.order_rollup_ephemeral` materialized `ephemeral` to assert skip.
      - Relationship test node for `orders.customer_id` references `customers.id`.
      - Unique/not_null tests or constraints sufficient to identify `id` primary keys.
      - One explicit measure via `meta.drizzle_cube.measures`, e.g. `amount` has `[{ "name": "totalAmount", "type": "sum", "title": "Total Amount" }]`.

25. `tests/fixtures/dbt/postgres-simple/catalog.json` (new file)
    - Matching catalog fixture keyed by the same model unique IDs.
    - Include catalog types: `integer`, `text`, `numeric(10,2)`, `timestamp without time zone`.
    - Include column indexes/order where dbt catalog supports it; otherwise expected output sorts by column name.

26. `tests/fixtures/dbt/postgres-simple/config-security.json` (new file)
    - JSON config using `{ "security": { "mode": "column", "column": "organisation_id", "context": "organisationId" } }` and at least one model/measure override used in normalize tests.

27. `tests/fixtures/dbt/postgres-simple/expected/security/schema.ts` (new file)
    - Exact expected schema for fixture with generated header and `pgTable` imports.

28. `tests/fixtures/dbt/postgres-simple/expected/security/cubes/customers.ts` (new file)
    - Exact expected generated customer cube with security `where`, countDistinct over `id`, dimensions, no reverse joins.

29. `tests/fixtures/dbt/postgres-simple/expected/security/cubes/orders.ts` (new file)
    - Exact expected generated order cube with security `where`, `Customers` belongsTo join, dimensions, countDistinct/count, and explicit `totalAmount` measure.

30. `tests/fixtures/dbt/postgres-simple/expected/security/index.ts` (new file)
    - Exact expected index exporting named cube constants and `allCubes` sorted deterministically.

31. `tests/fixtures/dbt/postgres-simple/expected/no-security/schema.ts` (new file, optional but recommended)
    - Same schema expected under no-security run. If duplicate with security, tests may reuse `expected/security/schema.ts`; if committed, keep exact.

32. `tests/fixtures/dbt/postgres-simple/expected/no-security/cubes/customers.ts` (new file, optional but recommended)
    - Expected customer cube with no `eq` import and `sql: (): BaseQueryDefinition => ({ from: customers })`.

33. `tests/fixtures/dbt/postgres-simple/expected/no-security/cubes/orders.ts` (new file, optional but recommended)
    - Expected order cube with no cube-level `where`, but joins/measures otherwise identical.

34. `tests/fixtures/dbt/postgres-simple/expected/no-security/index.ts` (new file, optional but recommended)
    - Same index expected under no-security run. If duplicate with security, tests may reuse `expected/security/index.ts`; if committed, keep exact.

### New documentation

35. `docs/dbt-generate.md` (new file)
    - Document the command:
      ```bash
      npx drizzle-cube dbt generate \
        --manifest target/manifest.json \
        --catalog target/catalog.json \
        --dialect postgres \
        --out ./src/cubes/generated
      ```
    - Explain required local dbt artifacts and how to produce them (`dbt docs generate` or dbt commands that write `target/manifest.json` and `target/catalog.json`; do not make the CLI run dbt in v1).
    - Explain security modes:
      - interactive prompt with blank = intentional no-security,
      - non-interactive `--security-column organisation_id --security-context organisationId`,
      - explicit `--no-security` opt-out warning.
    - Explain output layout (`schema.ts`, `cubes/*.ts`, `index.ts`) and generated ownership header.
    - Document supported v1 model scope: materialized models only; no sources/seeds/snapshots/ephemeral.
    - Document Postgres-only type subset and unsupported type behavior.
    - Document measure and relationship semantics: baseline count/countDistinct, explicit measures only, direct `belongsTo` joins from dbt relationships tests.
    - Document `--dry-run`, `--check`, and `--force`.
    - Explicitly list out-of-scope future work: GitHub sync/clone/auth, running dbt, YAML/Jinja parsing, non-Postgres adapters, reverse/many-to-many inference.

## Commands

From `.lastlight/issue-936/guardrails-report.md`, executor must run these exact guardrail commands before handing off:

```bash
npm run test
npm run lint
npm run typecheck
```

Recommended targeted commands during implementation (in addition to the required guardrails above):

```bash
npm run build:cli
npx vitest run tests/cli/dbt
```

## Implementation approach

1. **Prepare CLI routing**
   - Add `src/cli/commands/dbt.ts` with help and argument parsing skeleton.
   - Refactor `src/cli/index.ts` into async routing without changing existing `charts` behavior.
   - Update `vite.config.cli.ts` externals for new Node builtins.

2. **Build pure generator foundations**
   - Add `types.ts`, `errors.ts`, and `naming.ts` first; write and run `naming.test.ts`.
   - Add `postgres-types.ts` and exhaustive mapper tests before normalizer integration.

3. **Parse artifacts and config**
   - Implement JSON loading and minimal validation in `parse-artifacts.ts`.
   - Implement JSON-only config loading/validation in `config.ts`.
   - Create the `postgres-simple` fixture artifacts and parser tests.

4. **Normalize into IR**
   - Implement materialization filtering, catalog joins, naming overrides, primary-key detection, explicit measures, security validation, and relationship-test conversion in `normalize.ts`.
   - Keep warning collection deterministic and test warnings/errors directly.

5. **Emit deterministic TypeScript**
   - Implement `emit-schema.ts` and `emit-cubes.ts` from normalized IR.
   - Commit expected fixture outputs and exact-match tests.
   - Use stable sort order everywhere: models, columns, joins, measures, imports, object keys, file paths.

6. **Write/check outputs safely**
   - Implement `write-output.ts` with path traversal guard, generated-header ownership checks, dry-run/check modes, and force override.
   - Add temp-dir tests for write behavior.

7. **Wire end-to-end command**
   - Implement security mode resolution and optional interactive prompt in `commands/dbt.ts`.
   - Wire `generateDbtFiles` and `writeGeneratedFiles`; ensure expected `DbtGenerateError`s produce concise stderr and non-zero exit when run via CLI.
   - Add direct command tests avoiding actual TTY prompts.

8. **Document**
   - Add `docs/dbt-generate.md` and link/example from `README.md`.
   - Include v1 limitations and the explicit no-security warning prominently, because repo guidance is security-first.

9. **Verify**
   - Run targeted tests (`npx vitest run tests/cli/dbt`) while iterating.
   - Run `npm run build:cli` to catch CJS bundle/external issues.
   - Run required guardrails: `npm run test`, `npm run lint`, `npm run typecheck`.

## Risks and edge cases

- **dbt artifact shape drift:** dbt manifest/catalog formats vary by version. Keep parser intentionally minimal, support common `relationships` test shapes, and skip/fail with actionable messages when fields are missing.
- **Catalog type ambiguity:** Postgres type strings may include precision, arrays, enums, domains, or adapter-specific names. Support a documented subset and fail clearly unless a config type override exists.
- **Security foot-gun:** Project docs say every cube should filter by `securityContext`, but maintainer requested an empty prompt path. Non-interactive runs must require explicit `--no-security`, and docs/CLI output must warn when no cube-level security is generated.
- **Generated code type correctness:** Runtime types are not generic (`QueryContext`, `Cube` in `src/server/types/cube.ts`), even though dev examples use generics outside the compiled `src` tree. Generated code should use non-generic public types to compile in user projects.
- **Name collisions/reserved identifiers:** Multiple dbt models/columns can normalize to the same JS identifier. The normalizer must detect and disambiguate deterministically or fail clearly.
- **Relationship extraction ambiguity:** dbt relationships tests can reference sources, refs, or expressions. V1 should only emit joins when both sides resolve to included materialized model nodes and concrete columns.
- **Primary-key confidence:** Do not mark primary keys unless constraints/meta/tests prove them. Count measure should remain valid without inventing PKs.
- **Manual edits:** Generated files should be treated as owned artifacts. Refuse to overwrite non-generated files without `--force`; do not attempt AST merges.
- **No stale deletion:** Leaving stale generated files may confuse users after dbt model removal. V1 can warn rather than delete; document this.
- **No public docs network:** `CLAUDE.md` asks to review `https://www.drizzle-cube.dev/llms.txt`; network fetch failed in this environment, so the implementation plan relies on repository source/docs as source of truth.

## Test strategy

- Unit-test pure helpers (`naming.ts`, `postgres-types.ts`) for deterministic conversions and full mapping coverage.
- Fixture-test artifact parsing and normalization against `tests/fixtures/dbt/postgres-simple/**`, including materialization filtering, descriptions, PK detection, explicit measures, security validation, and relationships.
- Snapshot/exact-file-test emitters against committed expected outputs to prevent churn and enforce deterministic generation.
- Temp-dir-test writer modes: write, dry-run, check current/different, non-generated overwrite refusal, force, and path traversal.
- Command-test argument validation and non-interactive security behavior by calling `dbtGenerate(args)` directly.
- End with required guardrails from the report: `npm run test`, `npm run lint`, `npm run typecheck`; also run `npm run build:cli` to verify CLI bundling.

## Estimated complexity

Complex.
