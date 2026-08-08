# Reviewer Verdict — Issue #936

VERDICT: REQUEST_CHANGES

## Summary

The dbt generator is well covered for the happy-path fixture and targeted typecheck/CLI tests pass, but it does not yet meet the plan's collision and composite-primary-key requirements. In particular, sanitized model/file/export collisions can silently overwrite generated output, and composite primary keys are downgraded to a plain count measure without a warning.

## Issues

### Critical

- `src/cli/dbt/normalize.ts:120-128` derives `tableExportName`, `cubeName`, `cubeExportName`, and `fileName` per model without tracking names already used by other models. Two dbt models that normalize to the same names (for example `orders.total` and `orders_total`) will produce duplicate exports and the same `cubes/<fileName>.ts` path; `writeGeneratedOutput` will then write both entries in order and the later file silently replaces the earlier one. The architect plan explicitly required model/file identifier collisions to be surfaced rather than silently overwriting output, and this is a dropped-output correctness bug.

### Important

- `src/cli/dbt/emit-cubes.ts:14-22` emits `type: 'count'` whenever more than one primary-key column is present. The repo's CLI guidance requires composite primary keys to keep one `primaryKey: true` dimension per key column and a baseline `countDistinct` measure; the architect plan allowed a fallback only with a warning if a composite expression cannot compile. The current implementation silently changes the metric semantics for composite-key models, and the planned composite-PK test coverage was not added.

### Suggestions

None.

### Nits

None.

## Test Results

```text
$ npm run typecheck && npm run test:cli -- tests/cli/dbt
npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json

npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> drizzle-cube@0.6.4 test:cli
> vitest run --project cli tests/cli/dbt


 RUN  v4.1.9 /home/agent/workspace/drizzle-cube


 Test Files  7 passed (7)
      Tests  22 passed (22)
   Start at  08:00:26
   Duration  1.09s (transform 144ms, setup 0ms, import 249ms, tests 74ms, environment 0ms)
```

## Re-review after Fix Cycle 1

VERDICT: APPROVED

## Summary

The fix cycle addressed both previously blocking issues. `normalizeDbtArtifacts` now rejects generated table export, cube name, cube export, and file name collisions before output is emitted, and composite primary keys now retain all `primaryKey: true` dimensions with a generated `countDistinct` baseline measure. I reviewed only the fix commit and did not find new regressions in the changed paths.

## Test Results

```text
$ npm run typecheck && npm run test:cli -- tests/cli/dbt/normalize.test.ts tests/cli/dbt/emit.test.ts
npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json

npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> drizzle-cube@0.6.4 test:cli
> vitest run --project cli tests/cli/dbt/normalize.test.ts tests/cli/dbt/emit.test.ts


 RUN  v4.1.9 /home/agent/workspace/drizzle-cube


 Test Files  2 passed (2)
      Tests  10 passed (10)
   Start at  08:07:34
   Duration  402ms (transform 110ms, setup 0ms, import 149ms, tests 24ms, environment 0ms)
```
