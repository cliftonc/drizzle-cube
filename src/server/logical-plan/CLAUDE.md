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
├── index.ts                  Barrel exports — types, builders, optimisers
├── logical-plan-builder.ts   LogicalPlanBuilder — plan composition + analysis trace
├── logical-planner.ts        LogicalPlanner — multi-phase planning pipeline
├── optimiser.ts              PlanOptimiser interface, OptimiserPipeline, IdentityOptimiser
└── types.ts                  LogicalNode variants and reference types
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LogicalPlanBuilder` | `logical-plan-builder.ts` | Builds `LogicalNode` tree from semantic query; produces `LogicalPlanWithAnalysis` (plan + trace) |
| `LogicalPlanner` | `logical-planner.ts` | Orchestrates planning phases: cube usage, primary cube selection, join path resolution, CTE decisions |
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

1. The logical plan is a pure data structure — no SQL generation happens here
2. `LogicalPlanWithAnalysis` always includes an analysis trace for dry-run/explain output
3. Optimiser passes must be side-effect-free; they receive and return `LogicalNode` trees
4. Node types use a discriminated union on `type` field for exhaustive pattern matching
