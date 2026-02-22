# Design: Custom Granularity Support

**Priority**: 5 (Low)
**Status**: Proposal
**Depends on**: [SQL Gap Filling](design-sql-gap-filling.md) (P4, for time series CTE integration)

---

## Problem Statement

Drizzle-cube supports only predefined granularities: `hour`, `day`, `week`, `month`, `quarter`, `year`. Many business use cases require custom time groupings:

- **Fiscal quarters** that don't align with calendar quarters
- **4-5-4 retail calendar** weeks
- **Custom week start** (e.g., Sunday instead of Monday)
- **Bi-weekly periods**
- **Custom business periods** (sprints, pay periods)

## How Cube.js Handles It

Cube.js has a `GranularityHelper` system that supports custom granularities:

### Definition

Custom granularities are defined on dimensions within cube definitions:

```javascript
// In Cube.js cube schema
dimensions: {
  createdAt: {
    type: 'time',
    sql: () => `${CUBE}.created_at`,
    granularities: {
      fiscal_quarter: {
        interval: '3 months',
        origin: '2024-02-01',  // Fiscal year starts Feb 1
        title: 'Fiscal Quarter'
      },
      retail_week: {
        interval: '1 week',
        origin: '2024-01-07',  // Custom week start (Sunday)
        title: 'Retail Week'
      }
    }
  }
}
```

### Resolution

In `TimeDimensionSymbol`, the granularity is resolved via `GranularityHelper::make_granularity_obj()`:

```rust
pub struct Granularity {
    interval: DateInterval,      // e.g., "3 months"
    origin: Option<String>,      // alignment point
    calendar_sql: Option<String>, // optional custom SQL for calendar
    timezone: Option<String>,
}
```

### SQL Generation

For standard granularities, `DATE_TRUNC` is used. For custom granularities with `origin`, the system computes the offset from origin:

```sql
-- Fiscal quarter (origin: 2024-02-01, interval: 3 months)
-- Aligns dates to the nearest fiscal quarter start
DATE_TRUNC('quarter', column - INTERVAL '1 month') + INTERVAL '1 month'
```

For fully custom calendars, `calendar_sql` provides raw SQL for a calendar table join.

## Current Drizzle-Cube Behavior

### Predefined granularities only

At `src/server/builders/date-time-builder.ts:29`:

```typescript
buildTimeDimensionExpression(timeDim, ctx) {
  const column = resolveSqlExpression(dim.sql, ctx)
  if (granularity) {
    return adapter.buildTimeDimension(column, granularity)
  }
  return column
}
```

Each adapter implements predefined granularities:

```typescript
// postgres-adapter.ts
buildTimeDimension(column, granularity) {
  switch (granularity) {
    case 'day':     return sql`DATE_TRUNC('day', ${column}::timestamp)`
    case 'week':    return sql`DATE_TRUNC('week', ${column}::timestamp)`
    case 'month':   return sql`DATE_TRUNC('month', ${column}::timestamp)`
    case 'quarter': return sql`DATE_TRUNC('quarter', ${column}::timestamp)`
    case 'year':    return sql`DATE_TRUNC('year', ${column}::timestamp)`
    case 'hour':    return sql`DATE_TRUNC('hour', ${column}::timestamp)`
  }
}
```

No support for custom intervals, origin alignment, or calendar tables.

## Proposed Design

### 1. Custom Granularity Definition

Extend the dimension definition to support custom granularities:

```typescript
interface TimeDimensionDefinition {
  type: 'time'
  sql: (ctx: QueryContext) => AnyColumn | SQL

  // New: custom granularities
  granularities?: Record<string, CustomGranularity>
}

interface CustomGranularity {
  /** Base interval: '1 week', '3 months', '2 weeks', etc. */
  interval: string

  /** Alignment point: dates are bucketed relative to this origin */
  origin?: string  // ISO 8601 date string

  /** Optional display title */
  title?: string
}
```

**Usage example**:

```typescript
const ordersCube = defineCube({
  name: 'Orders',
  sql: (ctx) => ({ from: orders, where: eq(orders.orgId, ctx.securityContext.orgId) }),
  dimensions: {
    createdAt: {
      type: 'time',
      sql: () => orders.createdAt,
      granularities: {
        fiscal_quarter: {
          interval: '3 months',
          origin: '2024-02-01'  // Fiscal year starts Feb 1
        },
        retail_week: {
          interval: '1 week',
          origin: '2024-01-07'  // Weeks start Sunday
        }
      }
    }
  },
  measures: {
    totalRevenue: { type: 'sum', sql: () => orders.revenue }
  }
})
```

**Query usage**:

```typescript
// Use custom granularity in a query
const result = await semanticLayer.execute({
  measures: ['Orders.totalRevenue'],
  timeDimensions: [{
    dimension: 'Orders.createdAt',
    granularity: 'fiscal_quarter',  // Custom granularity name
    dateRange: ['2024-01-01', '2024-12-31']
  }]
}, securityContext)
```

### 2. Interval Parsing

Parse custom interval strings into components:

```typescript
interface ParsedInterval {
  value: number
  unit: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
}

function parseInterval(interval: string): ParsedInterval {
  const match = interval.match(/^(\d+)\s+(hours?|days?|weeks?|months?|quarters?|years?)$/)
  if (!match) throw new Error(`Invalid interval: ${interval}`)
  return {
    value: parseInt(match[1]),
    unit: normalizeUnit(match[2])
  }
}
```

### 3. Origin-Aligned Bucketing

The core algorithm: given a date and an origin, compute which bucket the date falls into.

**PostgreSQL**:

```typescript
// For interval-based custom granularities with origin
buildCustomTimeDimension(column: SQL, interval: ParsedInterval, origin: string): SQL {
  if (interval.unit === 'month' || interval.unit === 'quarter' || interval.unit === 'year') {
    // For month-based intervals, compute months from origin
    const months = intervalToMonths(interval)
    return sql`
      ${sql.raw(`'${origin}'`)}::timestamp + (
        FLOOR(
          EXTRACT(EPOCH FROM (${column}::timestamp - ${sql.raw(`'${origin}'`)}::timestamp))
          / EXTRACT(EPOCH FROM INTERVAL '${sql.raw(String(months))} months')
        ) * INTERVAL '${sql.raw(String(months))} months'
      )
    `
  }

  // For day/week-based intervals, compute days from origin
  const days = intervalToDays(interval)
  return sql`
    ${sql.raw(`'${origin}'`)}::timestamp + (
      FLOOR(
        EXTRACT(EPOCH FROM (${column}::timestamp - ${sql.raw(`'${origin}'`)}::timestamp))
        / (${days} * 86400)
      ) * ${days} * INTERVAL '1 day'
    )
  `
}
```

**MySQL**:

```typescript
buildCustomTimeDimension(column: SQL, interval: ParsedInterval, origin: string): SQL {
  const days = intervalToDays(interval)
  return sql`
    DATE_ADD(
      ${sql.raw(`'${origin}'`)},
      INTERVAL (FLOOR(DATEDIFF(${column}, ${sql.raw(`'${origin}'`)}) / ${days}) * ${days}) DAY
    )
  `
}
```

**SQLite**:

```typescript
buildCustomTimeDimension(column: SQL, interval: ParsedInterval, origin: string): SQL {
  const days = intervalToDays(interval)
  return sql`
    DATE(
      ${sql.raw(`'${origin}'`)},
      '+' || (CAST((JULIANDAY(${column}) - JULIANDAY(${sql.raw(`'${origin}'`)})) / ${days} AS INTEGER) * ${days}) || ' days'
    )
  `
}
```

### 4. Granularity Resolution

When processing a query, resolve the granularity name to either a predefined granularity or a custom definition:

```typescript
function resolveGranularity(
  dimensionName: string,
  granularityName: string,
  cubesMap: Map<string, Cube>
): ResolvedGranularity {
  const [cubeName, dimName] = dimensionName.split('.')
  const cube = cubesMap.get(cubeName)
  const dim = cube?.dimensions?.[dimName]

  // Check predefined granularities first
  if (['hour', 'day', 'week', 'month', 'quarter', 'year'].includes(granularityName)) {
    return { type: 'predefined', granularity: granularityName }
  }

  // Check custom granularities on the dimension
  const custom = dim?.granularities?.[granularityName]
  if (custom) {
    return {
      type: 'custom',
      interval: parseInterval(custom.interval),
      origin: custom.origin || '1970-01-01',
      title: custom.title
    }
  }

  throw new Error(`Unknown granularity '${granularityName}' for ${dimensionName}`)
}
```

### 5. Integration with DateTimeBuilder

Update `buildTimeDimensionExpression()` to handle custom granularities:

```typescript
buildTimeDimensionExpression(timeDim, ctx) {
  const column = resolveSqlExpression(dim.sql, ctx)
  const resolved = resolveGranularity(timeDim.dimension, timeDim.granularity, ctx.cubesMap)

  if (resolved.type === 'predefined') {
    return adapter.buildTimeDimension(column, resolved.granularity)
  }

  // Custom granularity
  return adapter.buildCustomTimeDimension(column, resolved.interval, resolved.origin)
}
```

### 6. Integration with Time Series Gap Filling (P4)

If SQL-level gap filling is implemented, custom granularities need matching time series generation:

```typescript
buildTimeSeriesCTE(startDate, endDate, granularity: ResolvedGranularity) {
  if (granularity.type === 'predefined') {
    // Use existing implementation
    return this.buildStandardTimeSeriesCTE(startDate, endDate, granularity.granularity)
  }

  // Custom: generate series with custom interval from origin
  return this.buildCustomTimeSeriesCTE(startDate, endDate, granularity.interval, granularity.origin)
}
```

## Affected Files

| File | Change |
|------|--------|
| `src/server/types/cube.ts` | Add `CustomGranularity` type, extend `TimeDimensionDefinition` |
| `src/server/builders/date-time-builder.ts` | Add `resolveGranularity()`, handle custom granularity path |
| `src/server/adapters/base-adapter.ts` | Add `buildCustomTimeDimension()` to interface |
| `src/server/adapters/postgres-adapter.ts` | Implement origin-aligned bucketing |
| `src/server/adapters/mysql-adapter.ts` | Implement origin-aligned bucketing |
| `src/server/adapters/sqlite-adapter.ts` | Implement origin-aligned bucketing |
| `src/server/adapters/duckdb-adapter.ts` | Implement origin-aligned bucketing |
| `src/server/compiler.ts` | Validate custom granularity definitions during cube registration |

## Testing Strategy

### Core tests

1. **Fiscal quarter**: Origin Feb 1, interval 3 months → Q1=Feb-Apr, Q2=May-Jul, etc.
2. **Custom week start**: Origin Sunday → weeks start on Sunday instead of Monday
3. **Bi-weekly**: Interval 2 weeks → data grouped into 2-week buckets

### Cross-database tests

4. **All databases produce same buckets**: Given the same data and custom granularity, all databases should produce identical bucket boundaries

### Edge cases

5. **Month-boundary handling**: Interval "2 months" near Feb (28/29 days)
6. **Leap year**: Custom daily intervals spanning Feb 29
7. **Origin in the future**: Bucketing still works correctly

### Metadata tests

8. **Custom granularity in metadata**: `/meta` endpoint exposes available custom granularities per dimension
9. **Validation**: Invalid interval strings are rejected at registration time

## Open Questions

1. **Calendar table approach**: Should we support a SQL-based calendar table for arbitrary business calendars (e.g., 4-5-4 retail)? This would require a join to a calendar table rather than computation.
2. **Default origin**: What's the default origin when not specified? (`1970-01-01` is reasonable for most cases.)
3. **Month-based intervals precision**: Month boundaries are irregular (28-31 days). Should we use `DATE_TRUNC`-like semantics for month-based custom intervals?
4. **Timezone interaction**: How do custom granularities interact with timezone-aware queries?
