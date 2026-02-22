# Design: Multi-Fact Join Group Support

**Priority**: 2 (High)
**Status**: Proposal
**Depends on**: [Multi-Stage Pipeline](design-multi-stage-pipeline.md) (P0, partially), [Multiplied Measures](design-multiplied-measures.md) (P1, for measure classification)

---

## Problem Statement

When a query references measures from cubes that require different join paths, drizzle-cube forces them into a single join tree. This can produce incorrect results or fail to find a valid join path.

**Example**:
```
Sales ──belongsTo──> Products
Inventory ──belongsTo──> Products
```

Query: `Sales.totalRevenue`, `Inventory.totalStock`, by `Products.name`

The correct approach is two independent subqueries — one for Sales+Products, one for Inventory+Products — merged on `Products.name`. A single join tree (Sales → Products → Inventory) would incorrectly join Sales rows to Inventory rows, potentially causing fan-out.

## How Cube.js Handles It

### Multi-Fact Group Detection

In `query_properties.rs:571`, `compute_join_multi_fact_groups()`:

1. Collect "join hints" from all dimensions, filters, time dimensions, segments
2. For each measure, combine its join hints with the dimension/filter hints
3. Call `join_tree_for_hints()` to get a join definition per measure
4. Group measures by their resulting join tree key

```rust
// Simplified logic
for measure in &measures {
    let measure_hints = measure.join_hints();
    let combined = merge(dimension_hints, measure_hints);
    let join = join_graph.build_join(combined);
    let key = join.key();  // deterministic key for this join tree
    groups.entry(key).or_default().push(measure);
}
```

If `groups.len() > 1`, the query is multi-fact and needs separate subqueries per group.

### Subquery Merging

The `FullKeyAggregateQueryPlanner` merges multi-fact groups:

- Each group gets its own subquery with its own join tree
- Subqueries are merged via the `FullKeyAggregate` logical node
- Physical merging uses one of three strategies:
  - **FULL OUTER JOIN** on shared dimensions (PostgreSQL, DuckDB)
  - **Keys-based** UNION + LEFT JOIN (MySQL, SQLite without FULL JOIN)
  - **INNER JOIN** when no dimensions (scalar aggregates)

```sql
-- FULL JOIN strategy
SELECT
  COALESCE(q1.product_name, q2.product_name) AS product_name,
  q1.total_revenue,
  q2.total_stock
FROM (
  SELECT p.name AS product_name, SUM(s.revenue) AS total_revenue
  FROM sales s JOIN products p ON s.product_id = p.id
  WHERE ...
  GROUP BY p.name
) q1
FULL OUTER JOIN (
  SELECT p.name AS product_name, SUM(i.stock_level) AS total_stock
  FROM inventory i JOIN products p ON i.product_id = p.id
  WHERE ...
  GROUP BY p.name
) q2 ON q1.product_name = q2.product_name
```

## Current Drizzle-Cube Behavior

Drizzle-cube uses a single join tree for all measures:

```typescript
// query-planner.ts:177 — createQueryPlan()
const primaryCube = this.choosePrimaryCube(cubeNames)
const joinPlan = this.buildJoinPlan(primaryCube, cubeNames)
// All cubes must fit into one join plan
```

For the Sales/Inventory/Products example, drizzle-cube requires:
1. Products defines `hasMany` to both Sales and Inventory
2. Join tree: Sales → Products → Inventory (or similar single tree)
3. Both fact tables are in the same join, causing potential fan-out

The star schema pattern works for simple cases because CTE pre-aggregation handles the fan-out, but it:
- Requires explicit bidirectional relationship definitions on the dimension cube
- Forces all facts through a single join tree
- May not find a valid path if facts don't share a common dimension cube

## Proposed Design

### 1. Multi-Fact Group Detection

Add join group computation to the query planner:

```typescript
interface MultiFactGroup {
  measures: MeasureRef[]
  joinTree: JoinPlan            // optimal join for this group
  dimensions: DimensionRef[]    // shared dimensions included
  filters: Filter[]             // filters relevant to this group
}

function computeMultiFactGroups(
  query: SemanticQuery,
  cubesMap: Map<string, Cube>,
  joinResolver: JoinPathResolver
): MultiFactGroup[] {
  const dimensionCubes = extractCubeNames(query.dimensions)
  const filterCubes = extractCubeNames(query.filters)
  const sharedCubes = new Set([...dimensionCubes, ...filterCubes])

  // Group measures by their optimal join tree
  const groups = new Map<string, MultiFactGroup>()

  for (const measure of query.measures) {
    const measureCube = extractCubeName(measure)
    const neededCubes = new Set([measureCube, ...sharedCubes])

    // Find optimal join tree for this measure + shared cubes
    const joinTree = joinResolver.findOptimalTree([...neededCubes])
    const key = joinTreeKey(joinTree)

    if (!groups.has(key)) {
      groups.set(key, {
        measures: [],
        joinTree,
        dimensions: query.dimensions,
        filters: query.filters
      })
    }
    groups.get(key)!.measures.push(measure)
  }

  return [...groups.values()]
}
```

### 2. Per-Group Subquery Generation

Each group gets its own complete subquery:

```typescript
function buildMultiFactSubquery(
  group: MultiFactGroup,
  ctx: QueryContext
): DrizzleSubquery {
  // Each group has its own join tree, measures, and shared dimensions
  // Generate: SELECT dims, AGG(measures) FROM joins WHERE filters GROUP BY dims
  const plan = planSingleFactGroup(group, ctx)
  return buildSubquery(plan, ctx)
}
```

### 3. Merge Strategy Selection

```typescript
type MergeStrategy = 'fullJoin' | 'leftJoin' | 'innerJoin'

function selectMergeStrategy(
  groups: MultiFactGroup[],
  capabilities: DatabaseCapabilities
): MergeStrategy {
  if (groups[0].dimensions.length === 0) {
    return 'innerJoin'  // No dimensions — scalar merge
  }
  if (capabilities.supportsFullJoin) {
    return 'fullJoin'   // Best correctness — handles non-overlapping data
  }
  return 'leftJoin'     // Fallback — first group is the "base"
}
```

### 4. Merge Assembly

```typescript
function buildMultiFactMerge(
  subqueries: DrizzleSubquery[],
  dimensions: DimensionRef[],
  strategy: MergeStrategy
): DrizzleQuery {
  if (strategy === 'fullJoin') {
    // Pairwise FULL OUTER JOIN on shared dimensions
    // SELECT COALESCE(q1.dim, q2.dim) AS dim, q1.m1, q2.m2
    return buildFullJoinMerge(subqueries, dimensions)
  }

  if (strategy === 'innerJoin') {
    // CROSS JOIN (scalar results)
    return buildInnerJoinMerge(subqueries)
  }

  // LEFT JOIN: first subquery is base, others LEFT JOIN on dims
  return buildLeftJoinMerge(subqueries, dimensions)
}
```

### 5. FULL JOIN Implementation

For databases that support FULL OUTER JOIN (PostgreSQL, DuckDB):

```typescript
function buildFullJoinMerge(
  subqueries: DrizzleSubquery[],
  dimensions: DimensionRef[]
): DrizzleQuery {
  // Build pairwise: ((q1 FULL JOIN q2) FULL JOIN q3) ...
  let result = subqueries[0]

  for (let i = 1; i < subqueries.length; i++) {
    const right = subqueries[i]
    const onConditions = dimensions.map(dim =>
      sql`${result.ref(dim)} = ${right.ref(dim)}`
    )
    result = sql`
      SELECT
        ${dimensions.map(dim =>
          sql`COALESCE(${result.ref(dim)}, ${right.ref(dim)}) AS ${sql.raw(dim.alias)}`
        ).join(', ')},
        ${result.measures.join(', ')},
        ${right.measures.join(', ')}
      FROM (${result.sql}) ${sql.raw(result.alias)}
      FULL OUTER JOIN (${right.sql}) ${sql.raw(right.alias)}
        ON ${and(...onConditions)}
    `
  }

  return result
}
```

### 6. LEFT JOIN Fallback (MySQL, SQLite)

For databases without FULL JOIN support:

```typescript
function buildLeftJoinMerge(
  subqueries: DrizzleSubquery[],
  dimensions: DimensionRef[]
): DrizzleQuery {
  // Use the largest subquery as base, LEFT JOIN others
  const base = subqueries[0]
  const joins = subqueries.slice(1)

  // SELECT base.dims, base.measures, j1.measures, j2.measures, ...
  // FROM base LEFT JOIN j1 ON dims LEFT JOIN j2 ON dims ...
  return buildWithLeftJoins(base, joins, dimensions)
}
```

**Limitation**: LEFT JOIN merge may miss rows that exist only in non-base subqueries. For full correctness on MySQL/SQLite, consider a UNION-based keys approach:

```sql
-- Keys from all subqueries
WITH all_keys AS (
  SELECT DISTINCT dim1, dim2 FROM subquery1
  UNION
  SELECT DISTINCT dim1, dim2 FROM subquery2
)
SELECT
  k.dim1, k.dim2,
  q1.measure1, q2.measure2
FROM all_keys k
LEFT JOIN subquery1 q1 ON k.dim1 = q1.dim1 AND k.dim2 = q1.dim2
LEFT JOIN subquery2 q2 ON k.dim1 = q2.dim1 AND k.dim2 = q2.dim2
```

### 7. Integration with existing star schema pattern

The current star schema pattern (dimension cube defines `hasMany` to both fact cubes) should continue to work. Multi-fact groups are an optimization: when the system detects that measures can be computed more efficiently as separate subqueries, it chooses that path.

The decision tree:

```
Multiple fact cubes in query?
  |-- NO --> single join tree (existing behavior)
  |-- YES:
       Can all facts share a single join tree?
         |-- YES --> single join tree with CTE pre-aggregation
         |-- NO  --> multi-fact groups with merge
```

## Affected Files

| File | Change |
|------|--------|
| `src/server/query-planner.ts` | Add `computeMultiFactGroups()`, modify `createQueryPlan()` |
| `src/server/executor.ts` | Add multi-fact merge path in `buildUnifiedQuery()` |
| `src/server/join-path-resolver.ts` | Add `findOptimalTree()` for multi-cube tree finding |
| `src/server/adapters/base-adapter.ts` | Add `supportsFullJoin` capability |
| `src/server/adapters/postgres-adapter.ts` | `supportsFullJoin: true` |
| `src/server/adapters/mysql-adapter.ts` | `supportsFullJoin: false` (MySQL 8 doesn't have FULL JOIN) |
| `src/server/adapters/sqlite-adapter.ts` | `supportsFullJoin: false` |
| `src/server/adapters/duckdb-adapter.ts` | `supportsFullJoin: true` |

## Testing Strategy

### Core multi-fact tests

1. **Two fact cubes, shared dimension**: Sales + Inventory by Products.name
   - Verify correct aggregation (no fan-out)
   - Verify both measures present in results

2. **Non-overlapping data**: Fact A has products 1-5, Fact B has products 3-8
   - FULL JOIN: all products appear, NULL for missing measures
   - LEFT JOIN: only base products appear (document limitation)

3. **Scalar merge**: Two fact cubes, no dimensions → INNER JOIN of two scalar subqueries

4. **Three+ fact cubes**: Verify pairwise merge chain works correctly

### Database-specific tests

5. **PostgreSQL/DuckDB**: FULL OUTER JOIN strategy
6. **MySQL/SQLite**: LEFT JOIN or UNION-keys fallback strategy

### Regression tests

7. **Existing star schema tests pass**: Current behavior preserved when single join tree is viable
8. **Security isolation**: Each subquery applies security context independently

## Open Questions

1. **Shared filters**: How to split filters between subqueries? Dimension filters apply to all groups; cube-specific filters apply only to that group's subquery.
2. **Shared time dimensions**: Time dimension filtering should be applied to all subqueries consistently.
3. **Performance**: Is the multi-subquery approach always better, or should we keep single-tree for some cases? (Likely: keep single-tree when measures share the same join tree, use multi-fact only when they diverge.)
