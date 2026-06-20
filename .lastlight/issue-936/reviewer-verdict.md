# Reviewer Verdict — Issue #936

VERDICT: REQUEST_CHANGES

## Summary

The implementation faithfully matches the architect plan — async CLI dispatch,
pure module separation, warn-and-skip semantics, `--check` full drift detection
(incl. orphaned), composite-PK handling, byte-stable golden fixtures, and the
justified composite-`countDistinct` deviation (verified against
`src/server/builders/measure-builder.ts:475`). Typecheck, lint, `test:cli`
(90/90), and `build:cli` all pass clean. One Important correctness bug in the
no-PK baseline-measure path produces runtime-breaking generated output for a
supported scenario, and is uncovered by tests; fixing it (and adding coverage)
is warranted before merge.

## Issues

### Critical

(none)

### Important

- **No-PK baseline `count` measure is emitted without `sql`, which throws at
  query time.** `src/cli/dbt/normalize.ts:248-256` — `buildBaselineMeasure`
  calls `firstNonSecurityColumn([], securityPropertyName)` for the no-PK
  branch, passing a literal empty array. `firstNonSecurityColumn` therefore
  always returns `undefined`, so the baseline `count` measure is built with no
  `sql` property. The runtime measure builder rejects this:
  `src/server/builders/measure-builder.ts:411-414` throws
  `Measure 'count' of type 'count' is missing required 'sql' property` for any
  non-calculated, non-post-agg-window measure without `sql`. The plan
  explicitly specified "no PK → plain `count` with a stable non-security column
  when one exists" — the full `columns` array should be passed, not `[]`. All
  fixture and unit-test models have primary keys, so this path is unexercised.
  Fix: pass `columns` (the full generated-column list) into the no-PK branch
  and add a normalize test asserting a no-PK model's baseline `count` carries a
  `sql` referencing a non-security column (and degrades to no `sql` only when
  the model has no non-security columns).

### Suggestions

- **Dead local in `normalizeOne`.** `src/cli/dbt/normalize.ts:451` declares
  `columnBySqlName` and populates it in the column loop (line 473) but never
  reads it — the only reader is the identically-named map inside
  `parseExplicitMeasures` (line 288). Remove the unused map in `normalizeOne`
  to avoid confusion.

### Nits

- `src/cli/dbt/normalize.ts:453` — `let droppedPkSqlNames` is never reassigned
  (only `.add()`-ed); prefer `const`.

## Test Results

```
$ npm run typecheck
> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json
(no output — clean)

$ npm run test:cli
> vitest run --project cli
 RUN  v4.1.9 /home/agent/workspace/drizzle-cube
 Test Files  8 passed (8)
      Tests  90 passed (90)
   Duration  2.79s

$ npm run lint
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
(no output — clean)

$ npm run build:cli
> vite build --config vite.config.cli.ts
dist/cli/index.cjs  65.47 kB │ gzip: 17.63 kB
✓ built in 114ms
```

Note: the full `npm run test` (server vitest project) requires live Postgres on
`127.0.0.1:54333` via `docker-compose`, unavailable in this sandbox — a
pre-existing environmental limitation unrelated to this DB-free `cli` change,
as flagged in the architect plan.

## Re-review after Fix Cycle 1

VERDICT: APPROVED

All three prior findings are resolved and the fix introduced no new problems.

- **Important (no-PK baseline `count` sql):** `src/cli/dbt/normalize.ts:247-256`
  now threads the full generated `columns` array into `buildBaselineMeasure` →
  `firstNonSecurityColumn`, so a no-PK model's baseline `count` carries a `sql`
  referencing the first non-security column property name, degrading to no `sql`
  only when no non-security columns exist. The `sql` value is the column
  `propertyName` (a string), consistent with the single-PK `countDistinct` path
  (`pkColumns[0].propertyName`) which the cube emitter resolves identically, so
  the fix matches the existing measure-emission contract. Three new tests in
  `tests/cli/dbt/normalize.test.ts` (lines 212-261) cover the happy path,
  filter-security avoidance, and the security-only degrade path — these are
  genuine red-path assertions (the count's `sql` is asserted against the
  generated column set, not just `toBeDefined`).
- **Suggestion (dead `columnBySqlName`):** removed from `normalizeOne` (the
  column loop no longer `.set()`-s it); the only real reader remains the local
  map inside `parseExplicitMeasures`. Confirmed no dangling references.
- **Nit (`let` → `const`):** `droppedPkSqlNames` is now `const`.

The diff is minimal and surgical — only `normalize.ts` and its test changed in
source; the rest of the commit is docs/skill scaffolding and status files. No
new complexity, no behaviour change to the PK or composite-PK paths, no type
suppression.

Independent gate re-run in this sandbox:

```
$ npm run typecheck  (no errors)
$ npx vitest run --project cli tests/cli/dbt/normalize.test.ts
  Test Files  1 passed (1)   Tests  13 passed (13)
$ npm run test:cli
  Test Files  8 passed (8)   Tests  93 passed (93)
$ npm run lint  (clean)
```

No remaining concerns.
