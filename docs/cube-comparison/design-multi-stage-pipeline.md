# Design: Multi-Stage Query Pipeline

**Priority**: 0 (Foundational)
**Status**: Proposal
**Prerequisite for**: All other design proposals (P1-P5)

---

## Problem Statement

Drizzle-cube currently uses a single-pass architecture where `buildUnifiedQuery()` directly assembles SQL from the flat `QueryPlan` structure. This makes it difficult to:

1. Implement advanced query strategies (multiplied measures deduplication, multi-fact groups)
2. Add optimization passes (pre-aggregation rewriting, query simplification)
3. Test query planning logic independently from SQL generation
4. Support dry-run/explain capabilities that show the logical plan
5. Extend the system with new node types without modifying the monolithic builder

The lack of a logical plan layer means every query improvement requires changes deep inside `buildUnifiedQuery()`, increasing complexity and risk.

## How Cube.js Handles It

Cube.js (Rust planner) uses a 5-phase pipeline:

```
QueryProperties → Logical Plan → PreAggregation Optimizer → Physical Plan → SQL
```

**Logical plan nodes** (in `logical_plan/`):
- `Query` — root node with source, dimensions, measures, filters
- `FullKeyAggregate` — merges subquery results
- `ResolveMultipliedMeasures` — contains regular + multiplied subqueries
- `AggregateMultipliedSubquery` — keys-based deduplication
- `KeysSubQuery` — distinct PK+dimension selection
- `MultiStageLeafMeasure`, `MultiStageMeasureCalculation` — CTE stages
- `DimensionSubQuery` — dimension-level subqueries

**Physical plan builder** (`physical_plan_builder/`) converts each logical node to physical SQL structures (`Select`, `From`, `Join`, `Cte`, `Expr`) via a processor/strategy pattern.

**Key insight**: The logical plan is a composable tree of `Rc<dyn LogicalNode>`. Each node type has a corresponding processor that converts it to physical SQL. New strategies can be added by creating new node types and processors.

## Current Drizzle-Cube Behavior

```
SemanticQuery
  → QueryPlanner.createQueryPlan()    → QueryPlan { primaryCube, joinCubes, cteCubes }
  → buildUnifiedQuery()               → Drizzle SQL (single monolithic function)
  → dbExecutor.execute()              → Results
```

The `QueryPlan` is a flat structure:
```typescript
interface QueryPlan {
  primaryCube: CubePlanEntry
  joinCubes: JoinCubePlanEntry[]
  cteCubes: CTECubePlanEntry[]
  warnings: string[]
}
```

`buildUnifiedQuery()` (at `src/server/executor.ts:837`) is ~300 lines that handles:
- CTE building
- SELECT construction for all cubes
- CTE reference replacement
- JOIN assembly
- WHERE conditions (security + filters)
- GROUP BY, HAVING, ORDER BY, LIMIT/OFFSET

All of this is interleaved in a single function, making it hard to extend or test in isolation.

## Proposed Design

### Architecture

```
SemanticQuery
  → QueryPlanner.plan()               → LogicalPlan (composable tree)
  → Optimizer.optimise()              → LogicalPlan (rewritten)
  → DrizzlePlanBuilder.build()        → Drizzle ORM constructs
  → dbExecutor.execute()              → Results
```

**The physical plan IS Drizzle** — no templates, no string building. The logical-to-physical conversion produces Drizzle `sql` calls, `select().from()` chains, etc.

### Logical Plan Node Types

```typescript
// Base interface
interface LogicalNode {
  readonly type: string
  readonly schema: LogicalSchema  // describes output columns
}

// Root query node
interface QueryNode extends LogicalNode {
  type: 'query'
  source: LogicalNode             // what to query from
  dimensions: DimensionRef[]
  measures: MeasureRef[]
  filters: Filter[]
  timeDimensions: TimeDimensionRef[]
  orderBy: OrderByRef[]
  limit?: number
  offset?: number
}

// Simple source: single cube or joined cubes
interface SimpleSource extends LogicalNode {
  type: 'simpleSource'
  primaryCube: CubeRef
  joins: JoinRef[]
}

// Full key aggregate: merges multiple subquery results
interface FullKeyAggregate extends LogicalNode {
  type: 'fullKeyAggregate'
  subqueries: LogicalNode[]       // each produces a set of measures
  dimensions: DimensionRef[]      // shared dimensions for merging
}

// CTE pre-aggregation (current approach, kept as one strategy)
interface CTEPreAggregate extends LogicalNode {
  type: 'ctePreAggregate'
  cube: CubeRef
  joinKeys: ColumnRef[]
  measures: MeasureRef[]
  dimensions: DimensionRef[]
  securityFilter: SQL
  propagatingFilters: SQL[]
  reason: 'hasMany' | 'fanOutPrevention'
}

// Keys-based deduplication (new, for multiplied measures)
interface KeysDeduplication extends LogicalNode {
  type: 'keysDeduplication'
  keysSource: LogicalNode         // SELECT DISTINCT PKs + dims
  measureSource: LogicalNode      // aggregated measures
  joinOn: ColumnRef[]             // PK columns
}

// Multi-fact merge
interface MultiFactMerge extends LogicalNode {
  type: 'multiFactMerge'
  groups: LogicalNode[]           // independent fact subqueries
  sharedDimensions: DimensionRef[]
  mergeStrategy: 'fullJoin' | 'leftJoin' | 'innerJoin'
}
```

### Logical Plan Builder

Replace the analysis portion of `QueryPlanner.createQueryPlan()` with a logical plan builder:

```typescript
class LogicalPlanBuilder {
  plan(query: SemanticQuery, cubesMap: Map<string, Cube>): LogicalNode {
    const usage = this.analyzeCubeUsage(query)
    const classification = this.classifyMeasures(usage)

    if (classification.isSimple) {
      return this.buildSimpleQuery(query, usage)
    }

    // Complex: build subqueries per measure group
    const subqueries = this.buildMeasureSubqueries(classification)
    return {
      type: 'query',
      source: { type: 'fullKeyAggregate', subqueries, dimensions: ... },
      ...
    }
  }
}
```

### Optimizer Interface

```typescript
interface PlanOptimiser {
  optimise(plan: LogicalNode, context: OptimiserContext): LogicalNode
}

// Initial optimisers:
class IdentityOptimiser implements PlanOptimiser {
  optimise(plan) { return plan }  // No-op, for initial implementation
}

// Future:
class PreAggregationOptimiser implements PlanOptimiser { ... }
class SimplifyOptimiser implements PlanOptimiser { ... }
```

### Drizzle Plan Builder (Logical → Physical)

This is the core conversion step. Each logical node type maps to Drizzle ORM constructs:

```typescript
class DrizzlePlanBuilder {
  build(plan: LogicalNode, ctx: BuildContext): DrizzleQuery {
    switch (plan.type) {
      case 'query':
        return this.buildQuery(plan as QueryNode, ctx)
      case 'simpleSource':
        return this.buildSimpleSource(plan as SimpleSource, ctx)
      case 'fullKeyAggregate':
        return this.buildFullKeyAggregate(plan as FullKeyAggregate, ctx)
      case 'ctePreAggregate':
        return this.buildCTE(plan as CTEPreAggregate, ctx)
      case 'keysDeduplication':
        return this.buildKeysDedup(plan as KeysDeduplication, ctx)
      // ...
    }
  }

  private buildQuery(node: QueryNode, ctx: BuildContext): DrizzleQuery {
    const source = this.build(node.source, ctx)
    // Apply dimensions, measures, filters, orderBy, limit via Drizzle
    // This is where sql`...`, select().from(), etc. are used
    return drizzleQuery
  }

  private buildCTE(node: CTEPreAggregate, ctx: BuildContext): DrizzleQuery {
    // Reuse existing CTEBuilder logic, but invoked from logical plan
    // instead of being deeply embedded in buildUnifiedQuery()
    return cteQuery
  }
}
```

### Migration Strategy

The migration should be incremental to avoid a big-bang rewrite:

**Phase 1: Introduce logical plan alongside existing code**
- Create `LogicalPlan` types and `LogicalPlanBuilder`
- Have `LogicalPlanBuilder` produce the same structure as current `QueryPlan`
- Both paths produce identical SQL (verified by tests)
- Feature flag to switch between old and new paths

**Phase 2: Move CTE logic to logical plan**
- CTEPreAggregate node replaces `cteCubes` array
- DrizzlePlanBuilder invokes existing `CTEBuilder` from the plan node
- Delete CTE-specific code from `buildUnifiedQuery()`

**Phase 3: Add new node types**
- `KeysDeduplication` for multiplied measures (P1)
- `MultiFactMerge` for multi-fact groups (P2)
- Each enabled behind feature flags

**Phase 4: Add optimizer passes**
- Plan simplification
- Future: pre-aggregation matching

## Affected Files

| File | Change |
|------|--------|
| `src/server/query-planner.ts` | Extract analysis logic into `LogicalPlanBuilder` |
| `src/server/executor.ts` | Replace `buildUnifiedQuery()` with `DrizzlePlanBuilder.build()` |
| `src/server/cte-builder.ts` | Invoked by `DrizzlePlanBuilder` for CTE nodes |
| `src/server/builders/measure-builder.ts` | No change (still builds measure SQL) |
| `src/server/builders/filter-builder.ts` | No change (still builds filter SQL) |
| **New**: `src/server/logical-plan/` | Logical plan types and builder |
| **New**: `src/server/drizzle-plan-builder.ts` | Logical → Drizzle conversion |
| **New**: `src/server/optimiser.ts` | Optimiser interface and passes |

## Testing Strategy

1. **Snapshot tests**: Compare SQL output from old path vs new path for all existing test queries
2. **Logical plan tests**: Verify plan structure for known query patterns (simple, hasMany, multi-cube)
3. **Round-trip tests**: LogicalPlan → DrizzleSQL → execute → same results as current path
4. **Optimiser tests**: Verify identity optimiser produces same plan; future optimisers produce valid rewrites
5. **Feature flag tests**: Both paths must pass all existing integration tests

## Key Design Decisions

### Why Drizzle ORM as physical layer (not SQL strings)?

- **Security**: Drizzle's parameterized queries prevent SQL injection by construction
- **Type safety**: TypeScript catches schema mismatches at compile time
- **Consistency**: The rest of drizzle-cube already uses Drizzle; a string-based physical layer would be a regression
- **No templates**: Unlike Cube.js's `PlanSqlTemplates`, we don't need dialect-agnostic templates because Drizzle handles dialect differences internally

### Why not copy Cube.js's architecture directly?

- Cube.js's physical plan (`Select`, `From`, `Join`) duplicates what Drizzle ORM already provides
- Cube.js uses string-based SQL rendering (`to_sql()`); we can leverage Drizzle's query builder instead
- The logical plan concepts (composable nodes, optimization passes) are valuable; the physical representation is not

### Why incremental migration?

- The current system works correctly for simple and moderately complex queries
- A big-bang rewrite risks introducing regressions
- Feature flags allow A/B testing the old vs new paths
- Each phase delivers independent value
