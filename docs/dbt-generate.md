# Generate schema and cubes from dbt artifacts

`drizzle-cube dbt generate` reads local dbt JSON artifacts and emits deterministic Drizzle `pg-core` schema plus Drizzle Cube definitions.

```bash
npx drizzle-cube dbt generate \
  --manifest target/manifest.json \
  --catalog target/catalog.json \
  --dialect postgres \
  --out ./src/cubes/generated \
  --security-column organisation_id \
  --security-context organisationId
```

## Inputs

Provide artifacts produced outside Drizzle Cube, for example by running dbt in your own project/CI and keeping the resulting `target/manifest.json` and `target/catalog.json`. The CLI reads those JSON files only.

The generator does not run `dbt`, parse raw dbt YAML/Jinja, connect to a database, clone remote repositories, or call any network service.

## Options

| Option | Required | Description |
| --- | --- | --- |
| `--manifest <path>` | Yes | Path to dbt `manifest.json`. |
| `--catalog <path>` | Yes | Path to dbt `catalog.json`. |
| `--dialect postgres` | Yes | v1 supports Postgres artifacts only. |
| `--out <dir>` | Yes | Output directory for generated files. |
| `--security-column <column>` | Security mode | SQL column used for row-level filtering. |
| `--security-context <property>` | Security mode | `ctx.securityContext` property compared to the security column. Must be a plain identifier such as `organisationId`. |
| `--no-security` | Security mode | Explicitly emit cubes without cube-level security filters. |
| `--dry-run` | No | Report creates/updates/deletes/conflicts without writing. |
| `--check` | No | Fail if generated output differs, including stale generated files. |
| `--force` | No | Overwrite non-generated conflicts at expected paths. |

## Security modes

Security is explicit and never inferred.

- Use `--security-column` with `--security-context` to emit `where: eq(table.column, ctx.securityContext.property)` in every cube.
- Use `--no-security` to deliberately emit no cube-level filter. The CLI prints a warning and generated cube files contain a comment.
- In non-interactive environments, one of those modes is required.
- When filter security is configured, any model missing the configured SQL column is skipped instead of being emitted unfiltered.

## Output layout

Given `--out ./src/cubes/generated`, output is:

```text
src/cubes/generated/
  schema.ts
  index.ts
  cubes/
    <model>.ts
```

`schema.ts` contains generated Drizzle table definitions. Models in a schema other than `public` are emitted as `pgSchema('<schema>').table(...)`, so queries target the schema dbt built them in rather than the connection's `search_path`. The schema name comes from the artifacts, so generate from the target you will query (usually production), not a personal dev schema. Imports use `.js` specifiers so the output works under both `Bundler` and `NodeNext` module resolution. Each cube imports from `drizzle-cube/server` and uses direct Drizzle table/column references. `index.ts` exports named cube exports, `schema`, and `allCubes`.

## Primary keys

Each cube gets a `count` measure. With a primary key it is a `countDistinct` over the key; a composite key is counted as `concat_ws('|', ...)` of its columns and declared once in `schema.ts` with `primaryKey({ columns })`.

The key comes from, in order:

1. columns with `meta: { drizzle_cube: { primary_key: true } }`
2. a dbt `primary_key` constraint on the model or a column
3. a `dbt_utils.unique_combination_of_columns` test
4. a single column with both `unique` and `not_null` tests

If several columns are each `unique` and `not_null`, the first in catalog order is used and a warning names the alternatives. A declared composite key is emitted whole or not at all: if one of its columns is skipped, the cube gets no key (and a plain `count`) with a warning, because a partial key would count wrongly. If a column is already called `count`, the measure is renamed (`count2`) with a warning.

## Joins

Each dbt `relationships` test whose `to` is a `ref()` becomes a `belongsTo` join from the tested model to the referenced model. The planner also walks these joins in reverse, so no `hasMany` join is emitted for the other side.

- A model with several foreign keys to the same model (billing and referring customer) keeps the first by column order. The planner uses one join between two cubes and cannot choose between them, so the others are skipped with a warning.
- Self-referencing relationships (a parent id on the same model) are skipped with a warning; self-joins are not supported.
- `source()` targets are not models and are skipped with a warning.

## Warn-and-skip behavior

Unsupported inputs are reported as warnings and omitted when possible. A skipped model also drops dependent joins with a dedicated warning so emitted references still resolve.

The generator warns and skips:

- unsupported or missing materializations such as `ephemeral` and `materialized_view`
- missing catalog metadata for a materialized model
- unsupported Postgres column types
- invalid explicit measure metadata
- relationships whose source/target model or column was skipped, that point at a `source()`, that reference their own model, or that duplicate an existing join to the same model
- models missing the configured security column

## Postgres type support

v1 maps common Postgres catalog types:

- integers: `smallint`, `integer`, `int`, `int2`, `int4`, `serial`, `smallserial`
- big integers: `bigint`, `int8`, `bigserial`
- decimals: `numeric`, `decimal` (Drizzle runtime values are strings; cube dimensions are typed as `number`)
- floats: `real`, `float4`, `double precision`, `float8`
- text: `text`, `varchar`, `character varying`, `char`, `character`
- UUIDs: `uuid` (string dimension)
- booleans: `boolean`, `bool`
- time: `date`, `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `timestamptz` (emitted with `withTimezone: true`)
- time of day: `time`, `timetz` (string dimension, since there is no date to bucket by)
- JSON: `json`, `jsonb`

Arrays, enums, geometry/network types, user-defined/custom types, and unknown types are skipped with warnings.

## Drift checks and generated ownership

Generated files start with:

```ts
// Generated by drizzle-cube dbt generate.
```

Normal generation overwrites files with this header, refuses to overwrite non-generated files unless `--force` is provided, and removes stale generated files no longer expected from current artifacts.

`--dry-run` writes nothing and reports planned creates, updates, deletes, and conflicts.

`--check` writes nothing and fails on missing, changed, conflicting, or stale generated files. This includes orphaned generated cube files for dbt models that were removed upstream.

## v1 limitations

Unsupported in v1:

- raw dbt project files, YAML, and Jinja parsing
- running dbt from the CLI
- remote GitHub repositories or cloning/syncing dbt projects
- non-Postgres dialects
- sources, seeds, snapshots, exposures, metrics, semantic models, and ephemeral models
- many-to-many joins, self-joins, and more than one join between the same two models
- merge-preserving manual edits inside generated files
