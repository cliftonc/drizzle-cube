# Design: SQL-Level Time Series Gap Filling

**Priority**: 4 (Low)
**Status**: Proposal
**Depends on**: None (can be implemented independently)

---

## Problem Statement

Drizzle-cube currently fills gaps in time series data using JavaScript after query execution (in `src/server/gap-filler.ts`). This works but has limitations:

1. **No SQL-level window functions on contiguous dates**: Window functions like `LAG()`, `LEAD()`, or running averages need contiguous rows in the result set. Post-execution gap filling happens too late.
2. **Inefficiency for sparse data**: The database returns only rows with data, then JavaScript generates all missing time buckets. For large date ranges with sparse data, this means transferring data then expanding it client-side.
3. **COALESCE(value, 0)**: SQL-level gap filling naturally produces `0` or `NULL` for missing periods via `LEFT JOIN` + `COALESCE`, which is cleaner for downstream processing.

## How Cube.js Handles It

Cube.js generates a `TimeSeries` CTE using database-specific functions:

### PostgreSQL

```sql
WITH time_series AS (
  SELECT generate_series(
    '2024-01-01'::timestamp,
    '2024-03-31'::timestamp,
    '1 day'::interval
  ) AS date_from
)
SELECT
  ts.date_from,
  COALESCE(SUM(data.revenue), 0) AS total_revenue
FROM time_series ts
LEFT JOIN (
  SELECT DATE_TRUNC('day', created_at) AS date_from, revenue
  FROM orders
  WHERE ...
) data ON ts.date_from = data.date_from
GROUP BY ts.date_from
ORDER BY ts.date_from
```

### MySQL (Recursive CTE)

```sql
WITH RECURSIVE time_series AS (
  SELECT DATE('2024-01-01') AS date_from
  UNION ALL
  SELECT DATE_ADD(date_from, INTERVAL 1 DAY)
  FROM time_series
  WHERE date_from < DATE('2024-03-31')
)
SELECT ts.date_from, ...
FROM time_series ts LEFT JOIN data ON ...
```

### Multi-stage integration

For rolling windows, the time series CTE is the foundation:

```sql
WITH time_series AS (...),
leaf_measure AS (
  SELECT ts.date_from, COALESCE(SUM(measure), 0)
  FROM time_series ts LEFT JOIN data ON ...
  GROUP BY ts.date_from
),
rolling_window AS (
  SELECT date_from,
    AVG(measure) OVER (ORDER BY date_from ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
  FROM leaf_measure
)
SELECT * FROM rolling_window
```

## Current Drizzle-Cube Behavior

### Post-execution gap filling

At `src/server/gap-filler.ts`:

```typescript
export function fillGaps(
  data: Record<string, unknown>[],
  timeDimension: TimeDimensionConfig,
  granularity: string
): Record<string, unknown>[] {
  const buckets = generateTimeBuckets(startDate, endDate, granularity)
  // Create a map of existing data points
  // Fill missing buckets with zero/null values
  return filledData
}
```

This runs after the database query returns results. The database never sees the gap-filled rows.

### Limitations

- Window functions in the query can't reference gap-filled rows
- Gap filling happens per-query, not composable with other SQL operations
- The JavaScript gap filler must handle date formatting differences across databases

## Proposed Design

### 1. Time Series CTE Generator

Add database-specific time series CTE generation to the adapter layer:

```typescript
// In DatabaseAdapter interface
interface DatabaseAdapter {
  // Existing methods...

  /**
   * Generate a time series CTE that produces all date buckets
   * for the given range and granularity.
   */
  buildTimeSeriesCTE(
    startDate: Date | string,
    endDate: Date | string,
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): { sql: SQL; alias: string; dateColumn: string }
}
```

### 2. Database-Specific Implementations

**PostgreSQL** (`src/server/adapters/postgres-adapter.ts`):

```typescript
buildTimeSeriesCTE(startDate, endDate, granularity) {
  const interval = granularityToInterval(granularity) // '1 day', '1 month', etc.
  return {
    sql: sql`
      SELECT generate_series(
        ${startDate}::timestamp,
        ${endDate}::timestamp,
        ${sql.raw(`'${interval}'::interval`)}
      ) AS date_from
    `,
    alias: 'time_series',
    dateColumn: 'date_from'
  }
}
```

**MySQL** (`src/server/adapters/mysql-adapter.ts`):

```typescript
buildTimeSeriesCTE(startDate, endDate, granularity) {
  const addExpr = granularityToDateAdd(granularity) // 'INTERVAL 1 DAY', etc.
  return {
    sql: sql`
      SELECT ${startDate} AS date_from
      UNION ALL
      SELECT DATE_ADD(date_from, ${sql.raw(addExpr)})
      FROM time_series
      WHERE date_from < ${endDate}
    `,
    alias: 'time_series',
    dateColumn: 'date_from',
    recursive: true  // MySQL needs WITH RECURSIVE
  }
}
```

**SQLite** (`src/server/adapters/sqlite-adapter.ts`):

```typescript
buildTimeSeriesCTE(startDate, endDate, granularity) {
  const modifier = granularityToSqliteModifier(granularity) // '+1 day', '+1 month', etc.
  return {
    sql: sql`
      SELECT DATE(${startDate}) AS date_from
      UNION ALL
      SELECT DATE(date_from, ${sql.raw(`'${modifier}'`)})
      FROM time_series
      WHERE date_from < DATE(${endDate})
    `,
    alias: 'time_series',
    dateColumn: 'date_from',
    recursive: true
  }
}
```

**DuckDB** (`src/server/adapters/duckdb-adapter.ts`):

```typescript
buildTimeSeriesCTE(startDate, endDate, granularity) {
  // DuckDB supports generate_series like PostgreSQL
  const interval = granularityToInterval(granularity)
  return {
    sql: sql`
      SELECT generate_series(
        ${startDate}::timestamp,
        ${endDate}::timestamp,
        INTERVAL ${sql.raw(`'${interval}'`)}
      ) AS date_from
    `,
    alias: 'time_series',
    dateColumn: 'date_from'
  }
}
```

### 3. Integration with Query Building

When a time dimension has `fillMissingDates: true` and a date range is specified, use the SQL-level CTE instead of post-execution gap filling:

```typescript
// In buildUnifiedQuery() or DrizzlePlanBuilder
if (timeDimension.fillMissingDates && timeDimension.dateRange) {
  const tsCte = adapter.buildTimeSeriesCTE(
    timeDimension.dateRange[0],
    timeDimension.dateRange[1],
    timeDimension.granularity
  )

  // Add time series CTE
  ctes.push(tsCte)

  // Wrap the data query as a subquery
  // LEFT JOIN time_series ON data.date = time_series.date_from
  // COALESCE measures with 0
}
```

### 4. Fallback to JavaScript

Keep the current JavaScript gap filler as a fallback for:
- Queries without explicit date ranges (can't generate time series without bounds)
- Databases that don't support the required CTE syntax
- Cases where SQL-level gap filling adds unacceptable query complexity

```typescript
const usesSqlGapFilling = timeDimension.fillMissingDates
  && timeDimension.dateRange
  && adapter.supportsTimeSeriesCTE

if (!usesSqlGapFilling) {
  // Fall back to JavaScript gap filling (existing behavior)
  result = fillGaps(result, timeDimension, granularity)
}
```

## Affected Files

| File | Change |
|------|--------|
| `src/server/adapters/base-adapter.ts` | Add `buildTimeSeriesCTE()` to interface |
| `src/server/adapters/postgres-adapter.ts` | Implement with `generate_series()` |
| `src/server/adapters/mysql-adapter.ts` | Implement with recursive CTE |
| `src/server/adapters/sqlite-adapter.ts` | Implement with recursive CTE |
| `src/server/adapters/duckdb-adapter.ts` | Implement with `generate_series()` |
| `src/server/executor.ts` | Integrate time series CTE into query building |
| `src/server/gap-filler.ts` | Keep as fallback, no changes needed |

## Testing Strategy

### Correctness tests

1. **Basic gap filling**: Query with daily granularity over 30 days, only 10 have data → 30 rows with gaps filled as 0
2. **Monthly granularity**: 12-month range, 3 months with data → 12 rows
3. **Multiple measures**: Gap-filled rows should have 0 for all measures

### Database-specific tests

4. **PostgreSQL**: `generate_series()` produces correct intervals
5. **MySQL**: Recursive CTE terminates correctly, handles month boundaries
6. **SQLite**: Date modifier produces correct intervals
7. **DuckDB**: `generate_series()` works correctly

### Edge cases

8. **Empty result**: No data in range → all rows are gap-filled zeros
9. **Single day range**: Start = end → one row
10. **Timezone handling**: Ensure time series respects the query's timezone context

### Fallback tests

11. **No date range**: Falls back to JavaScript gap filling
12. **SQL and JS produce identical results**: For queries that can use either path

## Open Questions

1. **Week granularity alignment**: When generating weekly time series, should weeks start on Monday or Sunday? (Should be configurable or follow locale.)
2. **Quarter granularity**: Fiscal vs calendar quarters? (Calendar for now.)
3. **Performance**: Is recursive CTE on MySQL/SQLite performant for large ranges (365+ days)?
4. **NULL vs 0**: Should gap-filled measures be `0` or `NULL`? (Cube.js uses 0 via COALESCE; current JS gap filler may use either.)
