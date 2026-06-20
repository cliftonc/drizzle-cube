# Executor Summary — #936 DBT Sync to Cubes v3

## What was done

Implemented the two observability hardening fixes from the architect plan,
plus additive test coverage that locks in the warn-and-skip cascade
conventions. No source modules outside the plan's manifest were touched;
no fixtures regenerated; the byte-stable emit output is unchanged.

### Source changes

- `src/cli/dbt/types.ts` — extended `WriteResult` with `missing: string[]`
  and `orphaned: string[]` fields plus updated JSDoc describing the
  check/dry-run drift detail.
- `src/cli/dbt/write-output.ts`:
  - `checkMode` now returns `missing` (sorted) and `orphaned` (already
    sorted) and sorts `updated` with `localeCompare`.
  - `dryRunMode` returns `missing: []`, `orphaned: deleted`, and sorts
    `created`/`updated`/`conflicts` for deterministic reporting.
  - `normalMode` returns `missing: []`, `orphaned: []` and sorts all
    returned arrays with `localeCompare`.
  - Module + `writeGeneratedOutput` JSDoc updated to describe the new
    check-mode path reporting.
- `src/cli/commands/dbt.ts` — `printSummary` check branch now lists the
  changed/missing/orphaned paths (capped at 20 per category with an
  `… and N more` overflow line) instead of collapsing to a boolean
  count. Non-check branches untouched. The `dbtGenerate` throw on
  `options.check && result.write.drift` is preserved (drift still exits
  non-zero).

### Test changes (all DB-free, `cli` vitest project)

- `tests/cli/dbt/write-output.test.ts`:
  - check-missing case now asserts `result.missing === ['schema.ts']`
    and `result.orphaned === []`.
  - check-orphan case now asserts `result.missing === []` and
    `result.orphaned === ['cubes/removed-model.ts']` (the on-disk
    expected file is written so only the orphan registers).
  - New `check mode reports changed, missing, and orphaned paths
    together` test staging all three drift categories.
- `tests/cli/dbt/command.test.ts`:
  - Existing `--check drift` and dry-run mocks updated with the new
    `missing`/`orphaned` fields so the new check summary branch has a
    complete `WriteResult` shape.
  - New `check summary lists changed, missing, and orphaned paths` test
    (mocked generator) asserting stdout contains the `changed:`/
    `missing:`/`orphaned:` category headers and the paths `cubes/a.ts`,
    `cubes/b.ts`, `cubes/c.ts`, and that `dbtGenerate` throws on drift.
- `tests/cli/dbt/normalize.test.ts`:
  - Strengthened the existing "drops a relationship when the target
    model was skipped" test to assert the `RELATIONSHIP_DROPPED`
    warning's `modelName` and that its message names the skipped target
    model id.
  - New "drops a relationship when the source column was skipped
    (unsupported type)" test — asserts the join is dropped with a
    `RELATIONSHIP_DROPPED` warning naming `customer_id`, and that the
    column itself is skipped with `COLUMN_SKIPPED`.
  - New "skips a model whose security column was skipped (unsupported
    type)" test — asserts the model is absent from `models` and a
    `MODEL_SKIPPED` warning mentions the security column and
    "unsupported type".

## Test / lint / typecheck results

```
$ npm run test:cli
> drizzle-cube@0.6.4 test:cli
> vitest run --project cli

 RUN  v4.1.9 /home/agent/workspace/drizzle-cube

 Test Files  8 passed (8)
      Tests  107 passed (107)
   Start at  13:51:59
   Duration  1.50s
```

(107 tests, up from 103 — +4 new tests.)

```
$ npm run build:cli
> drizzle-cube@0.6.4 build:cli
> vite build --config vite.config.cli.ts

vite v8.0.16 building client environment for production...
✓ 12 modules transformed.
dist/cli/index.cjs  74.43 kB │ gzip: 20.62 kB
✓ built in 106ms
```

```
$ npm run lint
> drizzle-cube@0.6.4 lint
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
(clean — no errors)
```

```
$ npm run typecheck
> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json
(clean — no errors)
```

The full `npm test` / `npm run test` gate is not runnable in this sandbox:
the `server` vitest project's `globalSetup` connects to Postgres on
`127.0.0.1:54333` and fails with `ECONNREFUSED` (`docker-compose`
unavailable). This is a pre-existing limitation unrelated to the dbt
generator, which is entirely DB-free and covered by the `cli` project.

## Deviations from the plan

- The plan's check-orphan test expectation (`missing: []`) required
  writing the expected `schema.ts` to disk in the test setup; the
  original test did not stage it, so without the write the file would
  also register as missing. Adjusted the test fixture accordingly —
  this matches the plan's intent (assert only the orphan registers).
- The plan listed three new normalize cascade tests; one of them
  (join-to-skipped-model) already existed as a passing test, so it was
  strengthened with the plan's additional assertions rather than
  duplicated. The other two were added verbatim.

No known issues.
