# Design: PK-Aware Multiplied Measures Deduplication

**Priority**: 1 (Critical — correctness issue)
**Status**: Proposal
**Depends on**: [Multi-Stage Pipeline](design-multi-stage-pipeline.md) (P0, partially)

---

## Problem Statement

When a JOIN creates row duplication (fan-out), aggregate measures like SUM and COUNT produce incorrect inflated results. Drizzle-cube's current CTE pre-aggregation approach has a correctness gap: when the outer query groups by dimensions beyond the CTE's join key, the LEFT JOIN can produce multiple rows per CTE row, causing SUM re-aggregation to double-count.

**Example**:
```
Departments (1) ──hasMany──> Employees (many)
Employees ──belongsTo──> Teams (1)
```

Query: `Employees.count`, `Departments.totalBudget`, grouped by `Teams.name`

1. CTE aggregates Departments by `department_id` (join key)
2. Outer query JOINs: Employees LEFT JOIN Departments_CTE ON `department_id`
3. If employee rows are also grouped by `Teams.name`, the LEFT JOIN produces multiple matches per CTE row
4. `SUM(Departments.totalBudget)` in the outer query double-counts

## How Cube.js Handles It

Cube.js uses **keys-based deduplication** with primary keys:

### Step 1: Classify measures

```rust
// query_properties.rs:893
fn full_key_aggregate_measures() -> FullKeyAggregateMeasures {
    // For each measure, check multiplication_factor[cube_name]
    // If multiplied && not countDistinct → multiplied_measures
    // Otherwise → regular_measures
}
```

### Step 2: Generate keys subquery

```sql
-- Select distinct PK+dimension combinations from the full join
SELECT DISTINCT
    cube.pk_col,
    dim1, dim2, ...
FROM full_join_of_all_cubes
WHERE all_filters
```

### Step 3: Aggregate multiplied cube independently

```sql
SELECT pk_col, SUM(measure_col) as agg_measure
FROM multiplied_cube
WHERE cube_filters
GROUP BY pk_col
```

### Step 4: Join keys to aggregated measures

```sql
SELECT
    keys.dim1, keys.dim2,
    agg.agg_measure
FROM keys_subquery keys
LEFT JOIN aggregated_cube agg ON keys.pk_col = agg.pk_col
GROUP BY keys.dim1, keys.dim2
```

**Why this works**: The keys subquery provides exactly one row per unique PK+dimension combination. Joining back on PK guarantees a one-to-one match with the aggregated measures. No double-counting is possible.

### countDistinct exemption

Cube.js exempts `countDistinct` and bare `count(*)` from multiplied treatment because `COUNT(DISTINCT ...)` is naturally immune to row duplication.

```rust
// measure_symbol.rs:418
pub fn can_used_as_addictive_in_multplied(&self) -> bool {
    &self.measure_type == "countDistinct" || &self.measure_type == "countDistinctApprox"
    || (&self.measure_type == "count" && self.member_sql.is_none())
}
```

## Current Drizzle-Cube Behavior

### CTE Pre-aggregation approach

```typescript
// query-planner.ts:399 — planPreAggregationCTEs()
// Detects hasMany relationships, creates CTEs for affected cubes

// executor.ts:929-1036 — CTE re-aggregation in outer query
// hasMany CTEs: re-aggregated with SUM()
// fanOutPrevention CTEs: re-aggregated with MAX()
```

### The MAX optimization

```typescript
// executor.ts:1463 — shouldUseMaxForHasManyAtJoinKeyGrain()
// When outer GROUP BY matches exactly the CTE join key, use MAX instead of SUM
// This prevents double-counting at the join key grain
```

This optimization handles the common case but breaks when:
- Outer query groups by additional dimensions beyond the join key
- Multiple hasMany relationships compound the fan-out

### Primary keys in cube definitions

Drizzle-cube already supports `primaryKey: true` on dimensions:
```typescript
dimensions: {
  id: {
    type: 'number',
    sql: () => employees.id,
    primaryKey: true
  }
}
```

But PKs are only used for metadata/annotations, not for query planning.

## Proposed Design

### 1. Activate PK awareness in query planning

Add PK extraction to the query planner:

```typescript
// In QueryPlanner or LogicalPlanBuilder
function getPrimaryKeyColumns(cube: Cube): ColumnRef[] {
  return Object.entries(cube.dimensions)
    .filter(([_, dim]) => dim.primaryKey)
    .map(([name, dim]) => ({
      cube: cube.name,
      dimension: name,
      sql: dim.sql
    }))
}
```

### 2. Keys-based deduplication strategy

For multiplied measures, generate a keys subquery + per-cube aggregation:

```sql
-- Keys: distinct PK + dimension combinations from full join
WITH keys AS (
  SELECT DISTINCT
    employees.id AS employee_pk,
    departments.id AS department_pk,
    teams.name AS team_name
  FROM employees
  JOIN departments ON employees.department_id = departments.id
  JOIN teams ON employees.team_id = teams.id
  WHERE security_filters
),

-- Per-cube aggregation: aggregate departments independently
dept_agg AS (
  SELECT
    departments.id AS department_pk,
    SUM(departments.budget) AS total_budget
  FROM departments
  WHERE departments.organisation_id = $1
  GROUP BY departments.id
)

-- Final: join keys with aggregated measures
SELECT
  keys.team_name,
  COUNT(DISTINCT keys.employee_pk) AS employee_count,
  SUM(dept_agg.total_budget) AS department_total_budget
FROM keys
LEFT JOIN dept_agg ON keys.department_pk = dept_agg.department_pk
GROUP BY keys.team_name
```

### 3. Measure classification

Add a classification step that determines the deduplication strategy per measure:

```typescript
interface MeasureClassification {
  regular: MeasureRef[]        // safe in simple join (no multiplication)
  multiplied: MeasureRef[]     // need keys-based deduplication
  deduplicationSafe: MeasureRef[]  // countDistinct — safe even when multiplied
}

function classifyMeasures(
  measures: MeasureRef[],
  joinTree: JoinPlan,
  cubesMap: Map<string, Cube>
): MeasureClassification {
  const multiplicationFactor = computeMultiplicationFactor(joinTree)

  for (const measure of measures) {
    const cube = cubesMap.get(measure.cubeName)
    const isMultiplied = multiplicationFactor.get(measure.cubeName) ?? false

    if (!isMultiplied) {
      result.regular.push(measure)
    } else if (isDeduplicationSafe(measure, cube)) {
      // countDistinct, countDistinctApprox
      result.deduplicationSafe.push(measure)
    } else {
      result.multiplied.push(measure)
    }
  }
}
```

### 4. Strategy selection

```typescript
function selectStrategy(classification: MeasureClassification, query: SemanticQuery): QueryStrategy {
  if (classification.multiplied.length === 0) {
    // No multiplied measures — use simple join + aggregate
    return 'simple'
  }

  const hasPKs = classification.multiplied.every(m =>
    getPrimaryKeyColumns(cubesMap.get(m.cubeName)).length > 0
  )

  if (hasPKs) {
    // PKs available — use keys-based deduplication
    return 'keysDeduplication'
  }

  // Fallback to current CTE approach (still better than nothing)
  return 'ctePreAggregate'
}
```

### 5. Integration with logical plan (if P0 is implemented first)

With the multi-stage pipeline from P0:

```typescript
// Logical plan node
interface KeysDeduplication extends LogicalNode {
  type: 'keysDeduplication'
  keysSource: SimpleSource     // full join for distinct PKs + dims
  measureSource: SimpleSource  // single cube for aggregation
  joinOn: ColumnRef[]          // PK columns
  measures: MeasureRef[]
}

// DrizzlePlanBuilder converts to:
// WITH keys AS (...), cube_agg AS (...)
// SELECT ... FROM keys LEFT JOIN cube_agg ON pk
```

### 6. Without the logical plan (standalone implementation)

If P0 isn't implemented yet, the keys-based strategy can be implemented within the existing architecture:

```typescript
// In buildUnifiedQuery(), replace CTE generation for multiplied cubes
// with keys-based subqueries

function buildKeysBasedQuery(
  primaryCube: CubePlanEntry,
  multipliedCubes: MultipliedCubeEntry[],
  regularCubes: CubePlanEntry[],
  query: SemanticQuery,
  ctx: QueryContext
): DrizzleQuery {
  // 1. Build keys CTE: SELECT DISTINCT PKs + dims FROM full join
  const keysCTE = buildKeysCTE(primaryCube, allCubes, query, ctx)

  // 2. Build per-cube aggregation CTEs
  const aggCTEs = multipliedCubes.map(cube =>
    buildCubeAggregationCTE(cube, ctx)
  )

  // 3. Build outer query: keys LEFT JOIN agg CTEs
  return buildOuterQuery(keysCTE, aggCTEs, regularCubes, query, ctx)
}
```

## Affected Files

| File | Change |
|------|--------|
| `src/server/query-planner.ts` | Add measure classification, PK extraction, strategy selection |
| `src/server/executor.ts` | Add keys-based query building path in `buildUnifiedQuery()` |
| `src/server/cte-builder.ts` | Add `buildKeysCTE()` and `buildCubeAggregationCTE()` methods |
| `src/server/types/cube.ts` | Ensure PK dimension type is well-defined |
| `src/server/cube-utils.ts` | Add `getPrimaryKeyColumns()`, `computeMultiplicationFactor()` |

## Testing Strategy

### Correctness tests

1. **The core regression test**: hasMany CTE + GROUP BY beyond join key
   - Departments hasMany Employees, Employees belongsTo Teams
   - Query: `Departments.totalBudget` grouped by `Teams.name`
   - Current CTE approach should give wrong results (document the failure)
   - Keys-based approach should give correct results

2. **countDistinct exemption**: Verify `countDistinct` through hasMany still works correctly without keys-based dedup

3. **Multiple multiplied cubes**: Two cubes both on the "many" side of different joins

4. **PK-less fallback**: Cubes without PKs fall back to CTE approach

### Integration tests

5. **All existing hasMany tests pass**: The new strategy should produce identical results for cases where the CTE approach was already correct

6. **Multi-database**: Keys-based CTEs work across PostgreSQL, MySQL, SQLite, DuckDB

7. **Security isolation**: Security context properly applied in keys CTE and per-cube aggregation CTE

### Performance tests

8. **Keys CTE vs CTE pre-aggregation**: Compare query plans and execution time for representative workloads

## Migration Path

1. **Phase 1**: Add measure classification and PK extraction (no behavioral change)
2. **Phase 2**: Implement keys-based deduplication as an opt-in strategy
3. **Phase 3**: Make keys-based the default when PKs are available, CTE as fallback
4. **Phase 4**: Add the correctness regression test to the suite

## Open Questions

1. **Composite PKs**: How to handle cubes with multi-column primary keys? (Likely: use all PK columns in the keys subquery)
2. **PK requirement**: Should we require PKs on all cubes, or make the keys strategy optional?
3. **CTE vs subquery**: Should the keys query be a CTE or an inline subquery? (CTE is likely better for readability and reuse)
