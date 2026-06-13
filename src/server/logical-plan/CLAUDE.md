# Logical Plan

Transforms a `SemanticQuery` into an optimizable logical node tree before physical SQL generation. The logical plan represents query intent (which cubes, measures, dimensions, joins, CTEs) without committing to SQL syntax, enabling plan-level analysis and optimization.

## Query Flow

```
SemanticQuery
  → LogicalPlanBuilder   (cube resolution, primary cube, joins, CTE decisions)
  → LogicalPlanner        (multi-phase planning)
  → OptimiserPipeline     (pluggable plan rewrites)
  → LogicalNode tree      (consumed by DrizzlePlanBuilder)
```

## Directory Layout

```
src/server/logical-plan/
├── index.ts                    Barrel exports — types, builders, optimisers
├── logical-plan-builder.ts     LogicalPlanBuilder — plan composition + analysis trace
├── logical-planner.ts          LogicalPlanner — thin facade composing the planning phases
├── join-planner.ts             JoinPlanner — join-plan construction
├── cte-planner.ts              CTEPlanner — pre-aggregation CTE decisions (fan-out prevention)
├── filter-propagation.ts       FilterPropagation — filter propagation into CTEs
├── plan-analysis-reporter.ts   PlanAnalysisReporter — dry-run/EXPLAIN trace + warnings
├── planner-utils.ts            ResolverCache + shared cube-usage helpers
├── optimiser.ts                PlanOptimiser interface, OptimiserPipeline, IdentityOptimiser
└── types.ts                    LogicalNode variants and reference types
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LogicalPlanBuilder` | `logical-plan-builder.ts` | Builds `LogicalNode` tree from semantic query; produces `LogicalPlanWithAnalysis` (plan + trace) |
| `LogicalPlanner` | `logical-planner.ts` | Facade composing the planning phases: cube usage, primary cube selection, join path resolution, CTE decisions |
| `JoinPlanner` | `join-planner.ts` | Builds the join plan (path resolution, belongsToMany expansion) |
| `CTEPlanner` | `cte-planner.ts` | Decides pre-aggregation CTEs to prevent fan-out; multi-hop absorption |
| `FilterPropagation` | `filter-propagation.ts` | Propagates related-cube filters into CTEs |
| `PlanAnalysisReporter` | `plan-analysis-reporter.ts` | Primary-cube/join-path trace + query warnings (dry-run/EXPLAIN) |
| `OptimiserPipeline` | `optimiser.ts` | Chains multiple `PlanOptimiser` passes; applies them sequentially to a plan |
| `IdentityOptimiser` | `optimiser.ts` | No-op pass-through optimiser (Phase 1 default) |

## Node Types (types.ts)

| Node | Purpose |
|------|---------|
| `QueryNode` | Root node — wraps the full query plan |
| `SimpleSource` | Single-cube scan with optional filters |
| `FullKeyAggregate` | Aggregation with full GROUP BY key |
| `CTEPreAggregate` | CTE-based pre-aggregation for performance |
| `KeysDeduplication` | Deduplication pass for multi-fact queries |
| `MultiFactMerge` | Merges results from multiple fact tables |

Reference types: `CubeRef`, `MeasureRef`, `DimensionRef`, `TimeDimensionRef`, `ColumnRef`, `OrderByRef`, `JoinRef`, `LogicalSchema`

## Guard Rails

1. The logical plan is a pure, symbolic data structure — **no Drizzle SQL and no
   baked security context**. `JoinRef` carries a `joinDef` (CubeJoin), not a
   pre-built `joinCondition`; `IntermediateJoinInfo` carries a cube ref, not a
   `securityFilter` SQL. All join conditions and the security WHERE are
   materialized by `DrizzlePlanBuilder` (the `derivePhysicalPlanContext` /
   `materializeJoin` seam and the CTE builder), using the request's security
   context at build time.
2. Planning must not import `builders/` (the SQL-generation layer). Pure measure
   classification used by planning lives in `../measure-classification.ts`.
3. `LogicalPlanWithAnalysis` always includes an analysis trace for dry-run/explain output
4. Optimiser passes must be side-effect-free; they receive and return `LogicalNode`
   trees. The executor derives the `SemanticQuery` the physical builder consumes
   from the **optimised** plan (`DrizzlePlanBuilder.toSemanticQuery`), so optimiser
   rewrites of measures/filters/limit/etc. take effect in the generated SQL.
5. Node types use a discriminated union on `type` field for exhaustive pattern matching
