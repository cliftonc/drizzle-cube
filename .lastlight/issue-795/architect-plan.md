# Architect Plan for #795: Query-Time Dynamic Measures

## Problem Statement

`SemanticQuery.measures` is currently typed as `string[]`, so inline dynamic measure objects cannot pass through the public query type (`src/server/types/query.ts:14-21`). The regular validation path iterates measures and calls `split('.')` on every entry, which will fail or mis-validate object entries (`src/server/compiler.ts:761-787`). The SQL pipeline also assumes all measures are static measure names, including logical planning (`src/server/logical-plan/logical-planner.ts:76-82`), logical measure refs (`src/server/logical-plan/logical-plan-builder.ts:816-828`), and SQL selections (`src/server/physical-plan/drizzle-sql-builder.ts:92-109`). Runtime annotations and cached results are produced around the SQL-facing query result, so dynamic measures need a deliberate post-processing hook after database execution and before cache storage/return (`src/server/executor.ts:1121-1166`).

## Summary of What Needs to Change

Add a mixed measure query type with dynamic measure objects, validate dynamic formula syntax and references at query validation time, strip dynamic entries out of every SQL-planning path, evaluate formulas over returned static measure row values after DB execution, and append runtime-only measure annotations. Keep static `/meta` unchanged because metadata is generated from registered cube measures only (`src/server/compiler.ts:366-478`). Update normalization, cache normalization, AI/MCP schemas, and tests so object entries are preserved and documented without changing SQL generation semantics.

## Files to Modify

- `src/server/types/query.ts:6-21`: Import `MeasureFormat`, add `DynamicMeasure` and `QueryMeasure`, and change `SemanticQuery.measures?: string[]` to `QueryMeasure[]`.
- `src/server/types/core.ts:154-159`: No structural change expected; reuse `MeasureAnnotation.format` for dynamic annotations. `QueryWarning.measures?: string[]` at `src/server/types/core.ts:35-38` can remain static strings.
- `src/server/query-measures.ts` or similar new helper: Add shared helpers such as `isDynamicMeasure`, `splitQueryMeasures`, `getStaticMeasureNames`, `getDynamicMeasures`, `stripDynamicMeasures`, and `getMeasureOutputKey`. This avoids scattering `typeof measure === 'string'` checks across planner code.
- `src/server/dynamic-measures.ts` or similar new helper: Add a tiny in-house arithmetic tokenizer/parser/evaluator for numeric literals, fully qualified measure references, parentheses, and `+ - * /`. Return referenced measure names during parse/validation and evaluate with row contexts at runtime.
- `src/server/compiler.ts:761-787`: Validate static string entries with the existing cube/measure checks and validate dynamic object entries for identifier `name`, parseable formula, fully-qualified references, known referenced measures, and references present as static string entries in the same `query.measures` array.
- `src/server/compiler.ts:897-924`: Filter validation currently checks filter member names against dimensions/measures by string. Leave dynamic measure names invalid for v1; add tests that a dynamic bare name in filters fails.
- `src/adapters/utils.ts:77-90`: `buildTransformedQuery()` should expose static measure names only or explicit mixed output depending on Cube.js compatibility; avoid object entries in fields that consumers expect to be strings.
- `src/adapters/utils.ts:215-226` and `src/adapters/utils.ts:346-368`: Dry-run cube collection and normalized per-cube query output call string helpers on measures; use only static measure names.
- `src/adapters/utils.ts:994-1008`: Update `normalizeQueryFields()` so it fixes double-prefixed string measures but preserves dynamic measure objects verbatim.
- `src/adapters/utils.ts:1035-1085`: Build order `queryFields` from static measures plus dimensions only. Do not include dynamic measure names; this keeps dynamic measure ordering unsupported in v1.
- `src/server/cache-utils.ts:67-85`: Normalize mixed measures deterministically. Preserve dynamic measure definitions in the cache key because `QueryExecutor` caches final `QueryResult` objects (`src/server/executor.ts:1165-1179`). Sort only static string measures if existing cache order-insensitivity is required, but preserve enough dynamic definition data (`name`, `formula`, `title`, `format`) to distinguish final responses.
- `src/server/executor.ts:147-218`: Generate cache keys from the original mixed query so dynamic formulas do not collide.
- `src/server/executor.ts:613-676`: In `executeStandardQuery()`, strip dynamic measures before building context, preloading filters, planning, SQL building, numeric field collection, gap filling, and static annotation generation. Then apply dynamic measures to filled rows and append dynamic annotations before returning.
- `src/server/executor.ts:1094-1166`: Apply the same regular-query-with-cache flow changes as `executeStandardQuery()` because this is the main cached regular execution path.
- `src/server/executor.ts:1222-1300`: Update `generateAnnotations()` to ignore dynamic entries when generating static annotations or accept a SQL-facing query. Add a helper to append dynamic annotations using `title || name`, `shortTitle`, `type: 'number'`, and optional `format`.
- `src/server/logical-plan/logical-planner.ts:76-82`, `src/server/logical-plan/logical-planner.ts:308-310`, `src/server/logical-plan/logical-planner.ts:476`, `src/server/logical-plan/logical-planner.ts:819-821`, and `src/server/logical-plan/logical-planner.ts:1575-1603`: Prefer passing stripped SQL-facing queries into the planner. If any public analysis path can still receive mixed queries, guard these loops with static-measure helpers.
- `src/server/logical-plan/logical-plan-builder.ts:132-135`, `src/server/logical-plan/logical-plan-builder.ts:349-410`, and `src/server/logical-plan/logical-plan-builder.ts:816-828`: Prefer stripped queries. These paths call `split('.')`, `startsWith`, and window-measure checks on measure entries.
- `src/server/physical-plan/drizzle-sql-builder.ts:92-109` and `src/server/physical-plan/drizzle-sql-builder.ts:537-538`: Prefer stripped queries so resolved measures, selections, and numeric fields only see static strings.
- `src/server/physical-plan/drizzle-plan-builder.ts:901-919`: Prefer stripped queries so keys deduplication checks only static measure names.
- `src/server/builders/group-by-builder.ts:84-91`: Prefer stripped queries or guard measure loops because group-by behavior only needs static measure presence.
- `src/server/physical-plan/processors/window-processor.ts:24-28`: Prefer stripped queries because post-aggregation window logic expects static measure names.
- `src/server/ai/query-schema.ts:16-21` and `src/server/ai/query-schema.ts:181-191`: Update JSON schema and DSL reference to document `QueryMeasure = string | DynamicMeasure`, formula constraints, static base measure requirement, and no filters/order on dynamic measures.
- `src/adapters/mcp-transport.ts:428-497`: It imports `QUERY_PARAMS_SCHEMA`, so schema changes mostly propagate. Update load/discover description reminders if they remain string-only.
- `src/adapters/mcp-tools.ts:238-240`: No execution change expected because it delegates to `buildToolList()`, but verify composable tool definitions pick up the updated schema.
- `src/server/agent/tools.ts:67-75` and `src/server/agent/tools.ts:89-92`: `execute_query` picks up `QUERY_PARAMS_SCHEMA`; update the portlet `query` description if needed so dynamic measures are not omitted from agent guidance.
- `src/server/ai/validation.ts:103` and `src/server/ai/validation.ts:550-602`: If this validation layer is used independently of compiler validation, update measure loops to tolerate dynamic objects or explicitly ignore them for static schema validation while deferring formula validation to compiler/shared helpers.
- `src/server/prompts/single-step-prompt.ts:48`: Update prompt type snippet from `measures?: string[]` to mixed query measures.
- `src/client/types.ts:440`, `src/client/shared/types.ts:65`, and nearby client utilities from the grep results: Consider whether public client types must accept dynamic measure objects. At minimum, update shared query types that compile against `SemanticQuery`; UI selection utilities can ignore object entries unless the feature is exposed in the builder.
- `package.json:376-385`: Prefer no new dependency. If executor chooses a library instead, add it under runtime `dependencies`, not dev-only.
- Tests: Add focused unit tests and integration tests in `tests/query-validation.test.ts:45-109`, `tests/calculated-measures.test.ts:64-147` or a new `tests/dynamic-measures.test.ts`, `tests/query-builder.unit.test.ts:136-160`, plus adapter/schema tests if present.

## Implementation Approach

1. Add the public types and helpers first. Use an identifier regex such as `/^[A-Za-z_][A-Za-z0-9_]*$/` for dynamic measure names so result keys are bare identifiers and dots are rejected.
2. Implement the formula parser/evaluator in-house to avoid a runtime dependency and minimize attack surface. Tokenize only numbers, fully-qualified member references (`Cube.measure`), parentheses, and arithmetic operators. Parse with precedence (`*`/`/` before `+`/`-`) and reject any unknown character, function syntax, string literal, SQL keyword token, bare identifier, or malformed expression.
3. During parse, collect formula references. Require every reference to be exactly a static string measure selected in the same `query.measures`, and verify those references exist in the cube registry using the same lookup as static measures.
4. Update `validateQueryAgainstCubes()` so static entries follow the existing validation path and dynamic entries follow dynamic validation. Invalid object shape, missing `name`, missing `formula`, unknown referenced measure, unselected referenced measure, and invalid syntax should make the whole query invalid.
5. Add `stripDynamicMeasures(query)` and use it at the regular query execution boundary. The safest minimal boundary is inside `executeStandardQuery()` and `executeRegularQueryWithCache()` before `createQueryContext()`, `preloadFilterCache()`, `buildRegularQueryArtifacts()`, `drizzlePlanBuilder.build()`, `collectNumericFields()`, `applyGapFilling()`, and `generateAnnotations()`.
6. Keep cache keys based on the original mixed query. Since cached values are final `QueryResult` objects (`src/server/executor.ts:1165-1179`), dynamic definitions must be included in `normalizeQuery()`. Normalize static strings and dynamic objects deterministically enough to avoid cache misses due to object key order.
7. Evaluate dynamic measures after base row mapping and gap filling. For each row, process query measure entries in order: skip static strings; for dynamic entries, build a context from row values for static selected measures and assign `row[dynamic.name]`. This naturally gives later dynamic entries last-write-wins behavior for collisions with dimensions, time dimensions, static measures, or earlier dynamics.
8. Treat runtime calculation failures as row-local `null`. Failure conditions should include missing/null operands, non-numeric operands, divide-by-zero, non-finite results, overflow to `Infinity`, and thrown evaluator errors. Decide v1 numeric coercion conservatively: accept finite `number` values only unless tests reveal drivers return numeric strings for existing measures; if coercing strings is needed, only accept trimmed decimal/exponent strings that convert to a finite number.
9. Add dynamic measure annotations after static annotations. Do not touch `generateCubeMetadata()` so `/meta` remains static-only (`src/server/compiler.ts:366-478`).
10. Update normalization and dry-run helpers to keep dynamic objects out of string-only operations. `normalizeQueryFields()` should preserve dynamic objects and only `fixDoublePrefixed()` string entries.
11. Update AI/MCP schemas and prompt/reference strings from string-only measure arrays to mixed entries. Because MCP and agent schemas share `QUERY_PARAMS_SCHEMA`, most tool schema changes should flow through automatically.
12. Review client/shared query types and utilities for TypeScript breakage after `SemanticQuery.measures` becomes mixed. Use static-measure helpers where utilities need strings; avoid exposing dynamic formula builders in the UI unless required by tests.

## Risks and Edge Cases

- Planner breakage risk is high if any dynamic object reaches string-only paths that call `split`, `startsWith`, or set membership on measures. Stripping at execution boundaries plus helper guards is the main mitigation.
- Cache correctness depends on including dynamic definitions in the key because regular execution caches the final annotated `QueryResult`, not just base SQL rows (`src/server/executor.ts:1165-1179`).
- Existing `normalizeQuery()` sorts `query.measures` (`src/server/cache-utils.ts:67-70`). Sorting mixed objects naively can produce unstable or meaningless ordering and can conflict with last-write-wins collision semantics. Dynamic normalization must preserve query order where collisions matter.
- `applyGapFilling()` receives `measureNames` from `query.measures` today (`src/server/executor.ts:1151-1153`). It should receive static measure names only; dynamic values should be computed after gap filling so filled rows can produce null/derived values consistently.
- Collision semantics are intentionally last-write-wins. Tests should cover dynamic names colliding with selected dimensions, time dimensions, static measures, and earlier dynamic measures.
- Dynamic formulas should not reference earlier dynamic measures in v1, even if row order would make it technically possible. Validation should only allow references present as static string entries.
- Division by zero should be `null`, not `Infinity`, and any non-finite result should be coerced to `null`.
- Decimal/BigInt/string numeric driver outputs need an explicit choice. Start with finite `number` only for strictness, but verify existing adapters do not return strings for aggregate numerics before finalizing.
- Comparison queries may need careful handling. Validation for comparison uses the regular validator (`src/server/executor.ts:1050-1052`), but comparison creates period queries from the original query (`src/server/executor.ts:312-319`). Either explicitly reject dynamic measures with comparison for v1 or apply dynamic post-processing after comparison merge with clear tests.
- Dry-run and SQL generation should not include dynamic formulas in SQL. SQL output for mixed queries should match the stripped static query.

## Test Strategy

- Unit-test parser/evaluator directly: valid arithmetic, parentheses and precedence, fully-qualified references, invalid tokens/functions/strings/bare identifiers, divide-by-zero, null/missing/non-number operands, and non-finite outputs.
- Add validation tests in `tests/query-validation.test.ts` for valid dynamic measure objects, missing `name`, invalid identifier with dot, missing `formula`, invalid formula syntax, unknown referenced measure, and referenced measure not included as a static string.
- Add execution tests in a new `tests/dynamic-measures.test.ts` or adjacent to `tests/calculated-measures.test.ts`: query static measures plus `{ name: 'avgOrderValue', formula: 'Orders.revenue / Orders.count' }` equivalent over existing test cubes, assert data row value and annotation.
- Add tests that dynamic annotations are returned in `annotation.measures`, while compiler metadata from `getMetadata()` remains unchanged.
- Add runtime null tests using controlled rows or a lightweight evaluator test for division by zero, missing, null, and non-numeric operands. If integration setup makes non-numeric aggregate rows hard to produce, cover non-numeric behavior at evaluator unit level.
- Add `normalizeQueryFields()` tests showing measure objects are preserved and string entries still get double-prefix fixes.
- Add tests proving dynamic measure names are not valid in `filters` or `order` in v1.
- Add collision tests where later dynamic entries overwrite prior result keys, including static measure and earlier dynamic collisions.
- Add cache-key tests in `src/server/cache-utils.ts` coverage if present, or a small unit test, ensuring different dynamic formulas produce different keys while equivalent object key order does not.
- Verification commands: run targeted Vitest files first, then `npm run typecheck` and `npm run lint`. Full `npm test` may fail in the sandbox due to missing PostgreSQL/docker-compose per `.lastlight/issue-795/guardrails-report.md:15-18` and native install limitations at `.lastlight/issue-795/guardrails-report.md:43-47`.

## Estimated Complexity

Complex.

The evaluator itself can be small, but the change crosses public types, validation, planning boundaries, cache keys, result annotations, adapters, AI/MCP schemas, and client/shared TypeScript assumptions.
