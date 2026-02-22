# Design: Precise Per-Cube Multiplication Factor Computation

**Priority**: 3 (Medium)
**Status**: Proposal
**Depends on**: [Multiplied Measures](design-multiplied-measures.md) (P1, for measure classification)

---

## Problem Statement

Drizzle-cube's `detectHasManyInQuery()` scans ALL registered cubes for hasMany relationships, not just cubes in the current query's join tree. This produces imprecise results:

1. **Over-detection**: May create CTEs for cubes that aren't actually multiplied in the current join
2. **Under-detection**: May miss indirect multiplication through cubes not directly referenced
3. **Inaccuracy**: Doesn't distinguish between which specific cubes are multiplied — it's a binary "hasMany exists somewhere" check

## How Cube.js Handles It

Cube.js computes a precise per-cube `multiplication_factor` from the actual join tree:

### JoinGraph.findMultiplicationFactorFor()

In `JoinGraph.ts:300-327`:

```javascript
findMultiplicationFactorFor(cube, joinTree) {
  // Walk the join tree recursively
  // hasMany from A → B means A's rows are multiplied
  // belongsTo from A → B means B's rows are multiplied
  return multiplicationFactor  // HashMap<String, bool>
}
```

The result is a map: `{ "Orders": false, "LineItems": true, "Products": false }` — precisely identifying which cubes have their rows multiplied in this specific join.

### Usage in measure classification

```rust
// multiplied_measures_collector.rs
fn is_multiplied(cube_name: &str, join: &JoinDefinition) -> bool {
    join.static_data().multiplication_factor
        .get(cube_name)
        .copied()
        .unwrap_or(false)
}
```

This is used by `full_key_aggregate_measures()` to classify each measure as regular or multiplied.

## Current Drizzle-Cube Behavior

### detectHasManyInQuery()

At `src/server/query-planner.ts:754`:

```typescript
detectHasManyInQuery(cubeNames: string[]): Map<string, HasManyInfo> {
  // Searches ALL registered cubes (not just query cubes)
  // for hasMany relationships involving any cube in cubeNames
  for (const [cubeName, cube] of this.cubesMap) {
    for (const [joinName, join] of Object.entries(cube.joins || {})) {
      if (join.relationship === 'hasMany') {
        // Check if target cube is in the query
        // ...
      }
    }
  }
}
```

### getCTEReason()

At `src/server/query-planner.ts:809`:

```typescript
getCTEReason(cubeName: string, hasManyInfo: HasManyInfo): 'hasMany' | 'fanOutPrevention' | null {
  // If this cube is the target of a hasMany → 'hasMany'
  // If this cube's measures would be inflated → 'fanOutPrevention'
  // Otherwise → null
}
```

### Problems with current approach

1. Scans ALL cubes, not just those in the join tree
2. Binary classification (hasMany vs fanOutPrevention vs null) rather than per-cube multiplication factor
3. May create unnecessary CTEs for cubes that aren't actually multiplied in the current query's join path

## Proposed Design

### 1. Compute multiplication factor from the join tree

Walk the actual join plan (not all registered cubes) to determine which cubes are multiplied:

```typescript
interface MultiplicationFactor {
  /** Map from cube name to whether its rows are multiplied in this join */
  factors: Map<string, boolean>
}

function computeMultiplicationFactor(
  joinPlan: JoinPlan,
  cubesMap: Map<string, Cube>
): MultiplicationFactor {
  const factors = new Map<string, boolean>()

  // Primary cube starts as not multiplied
  factors.set(joinPlan.primaryCube, false)

  // Walk each join in the plan
  for (const join of joinPlan.joins) {
    const relationship = join.relationship

    if (relationship === 'hasMany') {
      // hasMany from A → B: A's rows are multiplied by B
      factors.set(join.fromCube, true)
      // B itself is not multiplied (it's the "many" side, but its rows are unique)
      if (!factors.has(join.toCube)) {
        factors.set(join.toCube, false)
      }
    } else if (relationship === 'belongsTo') {
      // belongsTo from A → B: B's rows might be multiplied if A has multiple rows per B
      // But belongsTo means A has at most one B, so B is NOT multiplied
      if (!factors.has(join.toCube)) {
        factors.set(join.toCube, false)
      }
    } else if (relationship === 'hasOne') {
      // hasOne: no multiplication in either direction
      if (!factors.has(join.toCube)) {
        factors.set(join.toCube, false)
      }
    } else if (relationship === 'belongsToMany') {
      // belongsToMany: both sides are potentially multiplied
      factors.set(join.fromCube, true)
      factors.set(join.toCube, true)
    }
  }

  // Propagate: if cube A is multiplied and A → B is hasMany,
  // then any cube reachable through B is also multiplied
  propagateMultiplication(factors, joinPlan)

  return { factors }
}
```

### 2. Propagation rules

Multiplication propagates through the join tree:

```typescript
function propagateMultiplication(
  factors: Map<string, boolean>,
  joinPlan: JoinPlan
): void {
  let changed = true
  while (changed) {
    changed = false
    for (const join of joinPlan.joins) {
      // If the source cube is multiplied, and the join is hasMany,
      // then cubes downstream of the target are also multiplied
      if (factors.get(join.fromCube) && join.relationship === 'hasMany') {
        // All cubes reachable from toCube inherit multiplication
        for (const downstream of getDownstreamCubes(join.toCube, joinPlan)) {
          if (!factors.get(downstream)) {
            factors.set(downstream, true)
            changed = true
          }
        }
      }
    }
  }
}
```

### 3. Replace detectHasManyInQuery()

Replace the broad scan with precise per-cube computation:

```typescript
// Before (in query-planner.ts)
const hasManyMap = this.detectHasManyInQuery(cubeNames)
for (const cube of cubeNames) {
  const reason = this.getCTEReason(cube, hasManyMap.get(cube))
  // ...
}

// After
const multiplicationFactor = computeMultiplicationFactor(joinPlan, this.cubesMap)
for (const cube of cubeNames) {
  const isMultiplied = multiplicationFactor.factors.get(cube) ?? false
  if (isMultiplied) {
    // This cube needs special handling (CTE or keys-based dedup)
  }
}
```

### 4. Integration with measure classification (P1)

The multiplication factor feeds directly into the measure classification from P1:

```typescript
function classifyMeasures(
  measures: MeasureRef[],
  multiplicationFactor: MultiplicationFactor,
  cubesMap: Map<string, Cube>
): MeasureClassification {
  for (const measure of measures) {
    const isMultiplied = multiplicationFactor.factors.get(measure.cubeName) ?? false
    // ... classify as regular, multiplied, or deduplicationSafe
  }
}
```

## Affected Files

| File | Change |
|------|--------|
| `src/server/query-planner.ts` | Replace `detectHasManyInQuery()` + `getCTEReason()` with `computeMultiplicationFactor()` |
| `src/server/cube-utils.ts` | Add `computeMultiplicationFactor()`, `propagateMultiplication()` |
| `src/server/executor.ts` | Use multiplication factor for CTE/dedup strategy selection |

## Testing Strategy

### Unit tests for multiplication factor computation

1. **Simple hasMany**: A hasMany B → A multiplied, B not
2. **Chain**: A hasMany B belongsTo C → A multiplied, B not, C not
3. **Diamond**: A hasMany B, A hasMany C, B belongsTo D, C belongsTo D → A multiplied
4. **belongsToMany**: A belongsToMany B → both multiplied
5. **No hasMany**: All belongsTo → no multiplication

### Comparison tests

6. **Compare with current behavior**: For existing test queries, verify that the new multiplication factor produces the same CTE decisions as the current approach (or produces better decisions with documented rationale)

### Regression tests

7. **All existing multi-cube tests pass**: The new detection should be a drop-in improvement
8. **Over-detection eliminated**: Verify that cubes outside the join tree are not incorrectly flagged

## Open Questions

1. **hasMany chain propagation**: If A hasMany B and B hasMany C, is A doubly-multiplied? (Likely yes — the fan-out compounds.)
2. **belongsToMany symmetry**: Should both sides always be treated as multiplied, or only the side that's being aggregated?
3. **Backward compatibility**: Should the old `detectHasManyInQuery()` be kept as a fallback during migration?
