# Issue: Time Dimensions from hasMany Joined Cubes

## Status
**Pre-existing issue** - Not introduced by `belongsToMany` feature implementation

## Summary
When querying with:
- Measures from a primary cube (e.g., `Departments.count`)
- Regular dimensions from the primary cube (e.g., `Departments.name`)
- Time dimensions from a `hasMany` joined cube (e.g., `Employees.createdAt`)

The query planner chooses the wrong primary cube, resulting in SQL that tries to GROUP BY a time dimension from a joined table, which may not work correctly with hasMany pre-aggregation CTEs.

## Example Query That Fails

```json
{
  "measures": [
    "Departments.count",
    "Departments.totalBudget"
  ],
  "dimensions": [
    "Departments.name"
  ],
  "timeDimensions": [
    {
      "dimension": "Employees.createdAt",
      "granularity": "month"
    }
  ]
}
```

## Generated SQL (Incorrect)

```sql
SELECT
  "departments"."name" AS "Departments.name",
  count("departments"."id") AS "Departments.count",
  sum("departments"."budget") AS "Departments.totalBudget",
  DATE_TRUNC('month', "employees"."created_at"::timestamp) AS "Employees.createdAt"
FROM
  "departments"
  LEFT JOIN "employees" ON "departments"."id" = "employees"."department_id"
WHERE
  (
    "departments"."organisation_id" = $1
    AND "employees"."organisation_id" = $2
  )
GROUP BY
  "departments"."name",
  DATE_TRUNC('month', "employees"."created_at"::timestamp)
ORDER BY
  "Employees.createdAt" ASC
```

## Problem

1. **Primary Cube Selection**: Query planner chooses `Departments` as the primary cube because:
   - `Departments` has 1 regular dimension: `Departments.name`
   - `Employees` has 0 regular dimensions (time dimensions are not counted)
   - Original `choosePrimaryCube()` only considers `query.dimensions`, not `query.timeDimensions`

2. **Join Direction**: With `Departments` as primary:
   - `Departments` → `Employees` uses the `hasMany` relationship
   - `hasMany` normally triggers pre-aggregation CTEs to prevent fan-out
   - But in this case, the time dimension from Employees needs to be in the main GROUP BY

3. **Conflict**: The system needs to both:
   - Use `Employees.createdAt` in the GROUP BY (requires it in main query)
   - Pre-aggregate Employees data (would move it to CTE)
   - These are contradictory requirements

## Root Cause

The `choosePrimaryCube()` function in `src/server/query-planner.ts` does not consider time dimensions when selecting the primary cube:

```typescript
// Original logic (line 201)
if (query.dimensions && query.dimensions.length > 0 && cubes) {
  const dimensionCubes = query.dimensions.map(d => d.split('.')[0])
  // ... only counts regular dimensions
}
```

Time dimensions are ignored, so cubes with time dimensions don't get preference when selecting the primary cube.

## Attempted Fix (Reverted)

Modified `choosePrimaryCube()` to:
1. Count time dimensions alongside regular dimensions
2. When there's a tie, prefer cubes that own time dimensions

```typescript
// Added logic to count time dimensions
if (query.timeDimensions) {
  for (const timeDim of query.timeDimensions) {
    const cubeName = timeDim.dimension.split('.')[0]
    dimensionCubes.push(cubeName)
  }
}

// Tie-breaker: prefer cubes with time dimensions
if (primaryCandidates.length > 1 && query.timeDimensions) {
  const timeDimensionCubes = new Set(
    query.timeDimensions.map(td => td.dimension.split('.')[0])
  )
  const cubesWithTimeDimensions = primaryCandidates.filter(c => timeDimensionCubes.has(c))
  if (cubesWithTimeDimensions.length > 0) {
    primaryCandidates = cubesWithTimeDimensions
  }
}
```

**Result**: Still chose `Departments` as primary (unclear why tie-breaker didn't work)

## Cube Definitions Context

### dev/server/cubes.ts

```typescript
// Employees -> Departments: belongsTo
employeesCube = defineCube('Employees', {
  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [{ source: employees.departmentId, target: departments.id }]
    }
  }
})

// Departments -> Employees: hasMany
departmentsCube = defineCube('Departments', {
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'hasMany',
      on: [{ source: departments.id, target: employees.departmentId }]
    }
  }
})
```

## Possible Solutions

### Option 1: Strongly Prefer Time Dimension Cubes
When any time dimension is present in the query, **always** choose a cube that owns a time dimension as primary, regardless of regular dimension counts.

**Pros**: Simple, predictable
**Cons**: Might not be correct for all query patterns

### Option 2: Detect Incompatible Patterns
Detect when a query uses:
- Measures from cube A
- Time dimensions from cube B
- Where A→B is hasMany

Either:
- Throw a validation error explaining the incompatibility
- Automatically swap to use cube B as primary

**Pros**: Explicit about the limitation
**Cons**: Restricts valid analytical queries

### Option 3: Support Time Dimensions in hasMany Joins
Enhance the query planner to support time dimensions from hasMany joined cubes by:
- Detecting when a time dimension is needed from a hasMany cube
- Avoiding CTE pre-aggregation for that cube
- Including the time dimension in the main query's GROUP BY

**Pros**: Most flexible, supports more query patterns
**Cons**: Complex, may reintroduce fan-out issues

### Option 4: Reverse the Join Automatically
When detecting that the time dimension cube should be primary, automatically reverse the join direction:
- Make `Employees` primary
- Join `Departments` with `belongsTo` (instead of hasMany from the other direction)

**Pros**: Solves the immediate issue, leverages existing bidirectional relationships
**Cons**: Requires sophisticated join path reversal logic

## Recommended Approach

**Option 4** seems most promising:

1. Detect when a cube with a time dimension should be primary but would require hasMany join
2. Check if there's a reverse relationship (e.g., `Employees.belongsTo.Departments` vs `Departments.hasMany.Employees`)
3. Use the reverse relationship to make the time dimension cube primary

This would require:
- Enhancing `canReachAllCubes()` to consider bidirectional relationships
- Updating `findJoinPath()` to prefer non-hasMany paths when time dimensions are involved
- Ensuring the join reversal maintains correct semantics

## Files Involved

- `src/server/query-planner.ts` - Primary cube selection and join path logic
- `src/server/types/query.ts` - Query structure with time dimensions
- `dev/server/cubes.ts` - Dev server cube definitions

## Related Code References

- `choosePrimaryCube()`: src/server/query-planner.ts:198
- `findJoinPath()`: src/server/query-planner.ts:364
- `buildJoinPlan()`: src/server/query-planner.ts:274
- `planPreAggregationCTEs()`: src/server/query-planner.ts:419

## Testing

Create a test case in `tests/query-planner-time-dimensions.test.ts`:

```typescript
it('should handle time dimensions from hasMany joined cubes', async () => {
  const query = {
    measures: ['Departments.count'],
    dimensions: ['Departments.name'],
    timeDimensions: [{
      dimension: 'Employees.createdAt',
      granularity: 'month'
    }]
  }

  // Should choose Employees as primary, not Departments
  // Should join Departments with belongsTo, not hasMany
  const result = await executor.execute(cubes, query, securityContext)
  expect(result.data).toBeDefined()
})
```

## Impact

This issue affects queries where:
- User wants to analyze aggregates from one cube (e.g., department budgets)
- Grouped by time periods from related entities (e.g., employee hire dates)
- The relationship is hasMany (one-to-many)

Common use cases:
- "Department budgets by month of employee hiring"
- "Product sales by customer registration date"
- "Order totals by shipment time windows"

## Priority

**Medium** - This is a limitation in multi-cube time dimension handling that affects certain analytical patterns. Workaround: Restructure query to use the time dimension cube as the source of measures, or use the regular dimension from the time dimension cube's side of the relationship.
