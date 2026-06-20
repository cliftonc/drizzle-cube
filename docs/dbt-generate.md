# `drizzle-cube dbt generate`

Generate a Drizzle ORM (Postgres) schema and Drizzle Cube semantic definitions
directly from a dbt project's build artifacts.

If your warehouse semantics already live in dbt — models, column types,
descriptions, and foreign-key relationships — this command bootstraps the
matching Drizzle schema and cubes so you don't have to hand-write them.

> **v1 is artifact-first and local-only.** It reads dbt's `manifest.json` and
> `catalog.json` from disk. It does **not** run dbt, parse `dbt_project.yml` /
> Jinja, or talk to git/GitHub. Remote-repository input and recurring sync are
> planned follow-ups built on top of this foundation.

## Prerequisites

Produce the two artifacts from your dbt project (they land in `target/`):

```bash
dbt docs generate   # writes target/manifest.json and target/catalog.json
```

`catalog.json` is required: v1 generates the Drizzle schema too, and it needs the
database column types that only the catalog records.

## Usage

```bash
npx drizzle-cube dbt generate \
  --manifest target/manifest.json \
  --catalog  target/catalog.json \
  --dialect  postgres \
  --out      ./src/cubes/generated \
  --security-column organisation_id \
  --security-context organisationId
```

### Required options

| Option | Description |
|--------|-------------|
| `--manifest <path>` | Path to dbt `manifest.json`. |
| `--catalog <path>`  | Path to dbt `catalog.json`. |
| `--dialect postgres`| Target dialect. Only `postgres` is supported in v1; any other value fails. |
| `--out <dir>`       | Output directory for generated files. |

### Security options

Multi-tenant filtering is an explicit choice — the generator never guesses a
tenant column. Pick one of:

| Option | Description |
|--------|-------------|
| `--security-column <col>` | Tenant/organisation column (e.g. `organisation_id`). Each cube emits `where: eq(table.<col>, ctx.securityContext.<context>)`. |
| `--security-context <prop>` | Security-context property to compare against. Defaults to the camelCase of `--security-column`. |
| `--no-security` | Explicitly generate cubes **without** a tenant filter. Prints a warning. |

In an interactive terminal, if you pass none of these you'll be prompted for the
column name; **leaving the answer empty** means "no security" (same as
`--no-security`). In a non-interactive context (CI), you must pass either
`--security-column` or `--no-security`.

> If `--security-column` is set but a model lacks that column, that model is
> skipped with a warning, and any join pointing at it is dropped (so the
> generated cubes always compile and register cleanly).

### Modes

| Option | Description |
|--------|-------------|
| `--dry-run` | Print the file plan without writing anything. |
| `--check`   | Exit non-zero if the generated output differs from what's on disk. Intended for CI to ensure committed output is up to date. |

## What gets generated

```
<out>/
  schema.ts          # Postgres Drizzle tables + `schema` object + `Schema` type
  cubes/
    orders.ts        # export const ordersCube = defineCube('Orders', { ... })
    customers.ts
  index.ts           # export const allCubes = [ ... ]
```

Register the result with any adapter:

```ts
import { allCubes } from './src/cubes/generated/index.js'
// createCubeApp({ cubes: allCubes, drizzle: db, schema, ... })
```

Every file carries a generated header and the output is fully deterministic, so
re-running on unchanged artifacts produces a zero diff. Generated files are
owned by the tool — edit your dbt metadata (or regenerate), not the output.

## Mapping rules (v1)

- **Models** — only materialized relations (`table`, `view`, `incremental`,
  `materialized_view`) become cubes. `ephemeral` models, sources, seeds,
  snapshots, and other resources are skipped.
- **Columns / types** — the catalog's Postgres types map to `pg-core` builders
  and Drizzle Cube dimension types:

  | Postgres type | Drizzle builder | Dimension type |
  |---------------|-----------------|----------------|
  | `integer`, `bigint`, `smallint` | `integer` | `number` |
  | `numeric`, `decimal`, `real`, `double precision` | `real` | `number` |
  | `text`, `varchar`, `char`, `uuid` | `text` | `string` |
  | `boolean` | `boolean` | `boolean` |
  | `timestamp`, `timestamptz`, `date`, `time` | `timestamp` | `time` |
  | `json`, `jsonb` | `jsonb` | `string` |

  A column whose type isn't supported causes its model to be **skipped with a
  warning** (rather than emitting broken TypeScript).
- **Primary keys** — a column is treated as the primary key if it has both a
  dbt `unique` and `not_null` test, or `meta.drizzle_cube.primary_key: true`.
  Detected PKs become `primaryKey: true` dimensions and a `countDistinct`
  `count` measure; otherwise a plain `count` is emitted.
- **Measures** — conservative by design: a baseline `count`, plus only the
  measures you explicitly declare in dbt metadata (see below). No `sum`/`avg`
  is invented for numeric columns.
- **Joins** — direct `belongsTo` joins are generated from dbt `relationships`
  tests, using string `targetCube` references. Reverse/`hasMany`/many-to-many
  joins are not inferred.
- **Descriptions / titles** — dbt model and column descriptions flow into cube,
  dimension, and measure `description`s; titles are humanized from names.

### dbt metadata overrides (`meta.drizzle_cube.*`)

Add a `meta.drizzle_cube` block in your dbt YAML to override conventions:

```yaml
models:
  - name: orders
    meta:
      drizzle_cube:
        cube_name: Orders          # cube name override
        table: orders              # Drizzle table export override
        measures:                  # explicit measures
          - name: totalAmount
            type: sum              # sum | avg | min | max | count | countDistinct
            column: amount
            title: Total Amount
            description: Sum of all order amounts.
    columns:
      - name: id
        meta:
          drizzle_cube:
            primary_key: true
      - name: customer_id
        meta:
          drizzle_cube:
            property: customerId   # Drizzle property / dimension name override
```

## Limitations (v1)

- Postgres only — other dialects are not generated.
- No remote/GitHub input, no `dbt` execution, no YAML/Jinja parsing.
- Sources, seeds, snapshots, exposures, metrics, semantic models, and ephemeral
  models are out of scope.
- Generated files are overwritten on regenerate; manual edits are not merged.

## Roadmap

The local generation contract here is the foundation for later **remote
repository input** and a **GitHub Action / recurring sync** workflow, which will
wrap this same deterministic core once the CLI contract is proven.
