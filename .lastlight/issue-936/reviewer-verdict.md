# Reviewer Verdict — Issue #936

VERDICT: REQUEST_CHANGES

## Summary
The implementation is well structured and the targeted CLI/dbt test suite plus typecheck pass. However, primary-key and not-null detection only reads non-standard `column.tests` arrays, so common dbt manifests where `unique`/`not_null` generic tests are represented as separate test nodes will silently generate weaker schema/cube output than planned.

## Issues
### Critical

### Important
- `src/cli/dbt/parse-artifacts.ts:86` / `src/cli/dbt/normalize.ts:26` — The planned primary-key confidence path from dbt `unique` + `not_null` tests is not implemented for normal dbt artifacts. `getPrimaryKeyCandidates()` only inspects `node.columns[*].tests`, and `notNullFromColumn()` does the same for `not_null`; in typical dbt manifests those tests are separate `resource_type: 'test'` nodes attached to the model/column (as with the relationships parser already implemented). As a result, models that rely on standard dbt tests instead of constraints or `meta.drizzle_cube.primary_key` will not get `.primaryKey()`/`.notNull()` and their baseline count measure falls back from `countDistinct(id)` to plain `count`, contrary to the architect plan and dbt artifact behavior. Please parse attached `unique`/`not_null` test nodes for the model column and add fixture coverage where the tests are represented as manifest test nodes rather than embedded column arrays.

### Suggestions

### Nits

## Test Results
```text
$ npm run typecheck
npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json

$ npx vitest run tests/cli/dbt --config .lastlight/issue-936/vitest-cli-review.config.ts
npm warn Unknown env config "store-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

 RUN  v4.1.9 /home/agent/workspace/drizzle-cube


 Test Files  7 passed (7)
      Tests  58 passed (58)
   Start at  06:02:51
   Duration  1.16s (transform 175ms, setup 0ms, import 301ms, tests 89ms, environment 1ms)
```
