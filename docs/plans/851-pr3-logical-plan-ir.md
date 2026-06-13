# PR3 — Make the logical plan a real IR (Option 1)

**Issue:** [#851](https://github.com/cliftonc/drizzle-cube/issues/851) — _Semantic layer: make the logical plan a real IR, or remove it_
**Branch:** `refactor/851-logical-plan-ir` (continue on the same branch — single PR per the maintainer's instruction)
**Decision:** Option 1 (make it a real IR), chosen over Option 2 (remove the layer).
**Status:** Not started. PR1 + PR2 (a/b/c) are landed; this file captures the remaining PR3 work.

---

## Where we are (already landed on this branch)

| Commit | What |
|--------|------|
| PR1 `d0fd18e` | Extracted `validateQueryAgainstCubes` → `src/server/query-validator.ts`; broke the `compiler ↔ executor` cycle. |
| PR2a `9e9df1c` | Split `logical-planner.ts` (1,576→112 lines) into `JoinPlanner`, `CTEPlanner`, `FilterPropagation`, `PlanAnalysisReporter`, `planner-utils.ts`. `LogicalPlanner` is now a thin facade. Removed dead `findJoinInfoToCube`. |
| PR2b `09ba563` | Extracted `ModeRouter`, `QueryResultCache`, `FilterCachePreloader`, `buildAnnotations`, `postProcessResultRows` into `src/server/execution/`. `executor.ts` 1,264→939 lines. |
| PR2c `9c1af41` | Removed `defineCube` runtime re-export from `types/index.ts`; introduced `FilterCache` interface so `QueryContext.filterCache` no longer imports the runtime `FilterCacheManager`. |

All four are behaviour-preserving: typecheck clean, **2348/2348** server tests pass (postgres).

**Baseline before starting PR3:** run `npm run typecheck` and `npm run test:postgres` (expect 2348 green). Every step below must keep that green.

---

## The problem PR3 fixes (verified against the code)

1. **The logical plan is not symbolic.** `JoinRef.joinCondition: SQL` is "pre-built by the planner" (`logical-plan/types.ts:105`), `JoinRef.junctionTable.joinCondition: SQL` (`:113`), and `CTEPlanner.analyzeJoinPathToPrimary` calls `intermediateCube.sql(ctx)` to bake the security `WHERE` into the plan (`cte-planner.ts`). `JoinPlanner.buildJoinPlan` calls `resolver.buildJoinCondition(...)` and `expandBelongsToManyJoin(joinDef, ctx.securityContext)` at plan time (`join-planner.ts`).
2. **`build()` ignores the plan for most clauses.** `DrizzlePlanBuilder.build(physicalPlan, query, context)` and its processors read SELECT/WHERE/GROUP BY/HAVING/ORDER/LIMIT from the raw `query` (`physical-plan/processors/*`). Only join/CTE structure comes from the plan. So an optimiser pass rewriting `QueryNode.measures/filters/limit` changes nothing.
3. **The optimiser is vestigial.** `executor.ts:105` hard-wires `this.planOptimiser = new IdentityOptimiser()` — no constructor param/setter. `OptimiserPipeline` is only used in tests. `OptimiserContext.engineType` (`optimiser.ts:14`) covers 4 of 7 engines; `getOptimiserEngineType()` (`executor.ts:601`) casts `databend`/`snowflake` unsafely.

**Good news:** `QueryNode` already carries everything `build()` needs symbolically — `dimensions/measures/filters/timeDimensions/orderBy/limit/offset` (`types.ts:144-162`), and `DrizzlePlanBuilder.toSemanticQuery(node)` already reconstructs a `SemanticQuery` from a node. That proves step 2 is mechanically feasible.

---

## Staged plan (each stage is a separate commit; keep tests green between stages)

### Stage 1 — Injectable `PlanOptimiser` + 7-engine union  _(low risk)_

Goal: convert the optimiser from vestigial to a real injection point, covering all engines.

- **`logical-plan/optimiser.ts`**: widen `OptimiserContext.engineType` to all 7 engines:
  `'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'`.
- **`executor.ts`**:
  - `getOptimiserEngineType()` (`:601`): return the real engine for all 7; drop the unsafe `as` cast. Keep the SingleStore→MySQL mapping **only if** an optimiser pass needs it — otherwise return `singlestore` honestly and let passes decide. (Recommend: stop collapsing; return the true engine.)
  - Constructor: accept an optional `planOptimiser?: PlanOptimiser` param (4th arg, after `rlsSetup`), default `new IdentityOptimiser()`. Store it.
- **`compiler.ts`**:
  - `SemanticLayerCompiler` constructor options (`:52`): add optional `planOptimiser?: PlanOptimiser`.
  - `createQueryExecutor()` (`:128`): thread `this.planOptimiser` into `new QueryExecutor(...)`.
- **Exports**: `PlanOptimiser`/`OptimiserContext`/`OptimiserPipeline`/`IdentityOptimiser` are already exported from `logical-plan` and `server/index.ts` — confirm they're public on `drizzle-cube/server`.
- **Tests**: add a unit test that injects a custom `PlanOptimiser` (e.g. one that drops a measure or sets `limit`) and asserts via `executor.buildLogicalPlan()` / `dryRunSQL()` that the optimised plan is the one used. (After Stage 2 this rewrite will actually affect SQL; in Stage 1 it only needs to affect `optimisedPlan`.)

**Verify:** typecheck + `test:postgres`. Also `test:mysql` and `test:sqlite` once (engine union touched).

---

### Stage 2 — `build()` derives all clauses from the plan  _(medium risk)_

Goal: make optimiser rewrites take effect. The physical builder must stop trusting the raw user `query` for SELECT/WHERE/GROUP BY/HAVING/ORDER/LIMIT and instead derive them from the (optimised) `QueryNode`.

- The executor currently calls `derivePhysicalPlanContext(optimisedPlan)` then `build(physicalPlan, query, context)` (`executor.ts:546,555` and `:878,881`). The `query` it passes is the **original user query**, not the optimised plan.
- **Approach (lowest-risk):** in the executor, replace the user `query` passed to `build()` with `this.drizzlePlanBuilder.toSemanticQuery(optimisedPlan)` (promote `toSemanticQuery` to public or add a public wrapper). Then `build()` consumes a query that reflects optimiser rewrites, with **zero changes to the processors**. This is the smallest change that makes rewrites effective.
  - Caveat: confirm `toSemanticQuery` faithfully round-trips everything the processors read: `measures, dimensions, timeDimensions (dimension+granularity+dateRange+compareDateRange+fillMissingDates), filters, order, limit, offset, ungrouped`. Extend `toSemanticQuery` to cover any field it currently drops (check `timeDimensions` fidelity and `ungrouped`).
- **Better (purist) approach:** change `build(plan, context)` to take only the plan and have processors read from `QueryNode` refs directly. More invasive; defer unless Stage 3 makes it natural.
- **Decision point:** start with the `toSemanticQuery` substitution. If round-trip fidelity is complete, this single change satisfies "build derives from the plan" with minimal blast radius.

**Verify:** typecheck + full `test:postgres`. Add/extend a test: an injected optimiser that changes `limit`/`filters` must change the generated SQL (`dryRunSQL`).

---

### Stage 3 — Symbolic `LogicalNode` + move materialization to the physical builder  _(high risk — the intricate part)_

Goal: the logical plan carries **symbolic refs only**; all Drizzle SQL is materialized in `DrizzlePlanBuilder`.

This is the riskiest change and touches the most intricate code (CTE fan-out absorption). Do it in sub-steps, each green.

1. **`JoinRef` → symbolic** (`logical-plan/types.ts:97-117`):
   - Replace `joinCondition: SQL` with symbolic join info: the `CubeJoin` reference (or `{ on: JoinKeyRef[], relationship, reversed }`) needed to build the condition later. Replace `junctionTable.joinCondition: SQL` / `securitySql` with the symbolic `through` reference + `sourceCubeName`.
   - Carry enough to reconstruct exactly what `resolver.buildJoinCondition` and `expandBelongsToManyJoin` produce today.
2. **`JoinPlanner.buildJoinPlan`** (`join-planner.ts`): stop calling `resolver.buildJoinCondition(...)` and `expandBelongsToManyJoin(..., ctx.securityContext)`. Emit symbolic `JoinRef`s. (It will no longer need `ctx`/`securityContext` — note the signature change ripples to `LogicalPlanner.buildJoinPlanForPrimary` and `LogicalPlanBuilder`.)
3. **`CTEPlanner.analyzeJoinPathToPrimary`** (`cte-planner.ts`): stop calling `intermediateCube.sql(ctx)` to capture the security `WHERE`. Carry the intermediate cube ref symbolically; let the physical builder call `cube.sql(ctx)` when it materializes the CTE. (`IntermediateJoinInfo.securityFilter: SQL` becomes a cube ref.)
4. **`DrizzlePlanBuilder`** (`physical-plan/drizzle-plan-builder.ts` + processors): materialize join conditions, junction joins (belongsToMany expansion), and CTE security filters from the symbolic refs. This is where `buildJoinCondition` / `expandBelongsToManyJoin` / `cube.sql(ctx)` move to. `derivePhysicalPlanContext` already reshapes the plan into `PhysicalQueryPlan` — that is the natural materialization seam.
5. **Security context**: today `securityContext` is baked into the plan at plan time. After Stage 3 it must be applied at materialization time in `DrizzlePlanBuilder` (it already has `context`). **Critical:** preserve the multi-tenant `WHERE` on every cube/CTE/junction — add an explicit test asserting the security `WHERE` is present for primary, joined, CTE, and belongsToMany-junction cubes.
6. **`logical-plan/CLAUDE.md` guard rail #1** ("pure data structure — no SQL generation here") becomes _true_ after this stage.

**Risk controls for Stage 3:**
- Land 3.1–3.4 incrementally; run `test:postgres` after each.
- The belongsToMany + multi-hop-fan-out paths are the danger zone — `tests/multiplication-factor.test.ts`, `tests/reverse-join-path.test.ts`, `tests/query-planner-joins.test.ts`, `tests/logical-plan*.test.ts`, plus the broad join/CTE integration tests.
- Run `test:mysql` and `test:sqlite` at the end of Stage 3 (security WHERE + join materialization are engine-sensitive).
- Consider snapshotting `dryRunSQL` output for a representative set of queries before Stage 3 and diffing after — the generated SQL must be identical (this refactor is behaviour-preserving; only _where_ SQL is built changes).

---

## Cross-cutting cleanups to fold in (from issue §E)

- **`MeasureBuilder` import from planning layer** (`cte-planner.ts` imports `../builders/measure-builder`): after Stage 3, planning should not depend on a SQL-building module. `CTEPlanner` uses `MeasureBuilder.categorizeForPostAggregation` for measure classification. Move that classification into the planning/measure-ref layer, or into `planner-utils`, so the planner no longer imports `builders/`.
- **Remaining madge cycle** `types/index.ts → types/executor.ts → adapters/base-adapter.ts` (type-only `DatabaseAdapter`): out of scope for #851 unless cheap; relocating the 208-line `DatabaseAdapter` interface (+ `DatabaseCapabilities`/`TimeDimensionResult`/`WindowFunctionConfig`) into `types/` would close it.

---

## Definition of done

- [ ] `OptimiserContext.engineType` covers all 7 engines; `getOptimiserEngineType` has no unsafe cast.
- [ ] `QueryExecutor` and `SemanticLayerCompiler` accept an injectable `PlanOptimiser`.
- [ ] An injected optimiser that rewrites `measures`/`filters`/`limit` provably changes generated SQL (test).
- [ ] `JoinRef`/`IntermediateJoinInfo` carry no `SQL` and no baked `securityContext`; planning emits symbolic refs only.
- [ ] All Drizzle SQL (join conditions, junction joins, CTE security WHERE) is materialized in `DrizzlePlanBuilder`.
- [ ] Planning layer no longer imports `builders/` (`MeasureBuilder` dependency resolved).
- [ ] `logical-plan/CLAUDE.md` guard rail #1 is accurate; `src/server/CLAUDE.md` pipeline description updated.
- [ ] Security `WHERE` verified present on primary/join/CTE/junction cubes across postgres, mysql, sqlite.
- [ ] typecheck clean; full `test:postgres` (2348+), plus `test:mysql` and `test:sqlite` green.

## Key files

```
src/server/logical-plan/types.ts            JoinRef (105,113), QueryNode (144), node defs
src/server/logical-plan/optimiser.ts        OptimiserContext.engineType (14)
src/server/logical-plan/join-planner.ts     buildJoinPlan — buildJoinCondition / expandBelongsToManyJoin
src/server/logical-plan/cte-planner.ts      analyzeJoinPathToPrimary — intermediateCube.sql(ctx); MeasureBuilder import
src/server/physical-plan/drizzle-plan-builder.ts  derivePhysicalPlanContext (50), build (build site), toSemanticQuery (~170)
src/server/physical-plan/processors/*       predicates/selection processors read raw query today
src/server/executor.ts                      planOptimiser (83,105), getOptimiserEngineType (601), buildRegularQueryArtifacts (613), build call (555,881)
src/server/compiler.ts                      constructor (52), createQueryExecutor (128)
```
