# Time Dimensions

Time dimensions are specialized dimensions that represent dates, timestamps, and time-based data in your analytics cubes. They enable powerful time-series analysis, trend visualization, and date-based filtering with granular control over time periods and date ranges.

## Overview

Time dimensions in Drizzle Cube provide:
- **Granular Time Analysis**: Break down data by year, quarter, month, week, day, or hour
- **Flexible Date Ranges**: Support for relative dates ("last 30 days") and absolute ranges
- **Type-Safe Queries**: Full TypeScript support with Drizzle schema integration
- **Time Zone Handling**: Consistent UTC-based calculations
- **Performance Optimization**: Efficient query generation for time-based filters

## Basic Time Dimension Structure

```typescript
dimensions: {
  createdAt: {
    name: "createdAt",
    title: "Created Date",
    type: "time",
    sql: employees.createdAt
  },
  date: {
    name: "date", 
    title: "Activity Date",
    type: "time",
    sql: productivity.date
  }
}
```

## Usage in Queries

Time dimensions are used in the `timeDimensions` array of queries, not in the regular `dimensions` array:

```typescript
const query = {
  measures: ["Employees.count"],
  dimensions: ["Employees.departmentName"],
  timeDimensions: [{
    dimension: "Employees.createdAt",
    granularity: "month",
    dateRange: ["2023-01-01", "2023-12-31"]
  }]
}
```

## Granularity Options

Time dimensions support various granularity levels for grouping data:

| Granularity | Description | Format Example | Use Case |
|-------------|-------------|----------------|----------|
| `year` | Annual grouping | `2023` | Year-over-year trends |
| `quarter` | Quarterly grouping | `2023-Q1` | Quarterly reports |
| `month` | Monthly grouping | `2023-01` | Monthly analysis |
| `week` | Weekly grouping | `2023-W01` | Weekly trends |
| `day` | Daily grouping | `2023-01-15` | Daily metrics |
| `hour` | Hourly grouping | `2023-01-15 14:00` | Hourly patterns |

### Granularity Examples

```typescript
// Monthly sales trends
const monthlyTrends = {
  measures: ["Sales.totalRevenue"],
  timeDimensions: [{
    dimension: "Sales.date",
    granularity: "month",
    dateRange: "this year"
  }]
}

// Daily activity for the last 30 days
const dailyActivity = {
  measures: ["Users.activeCount"],
  timeDimensions: [{
    dimension: "Users.lastLoginAt",
    granularity: "day",
    dateRange: "last 30 days"
  }]
}

// Hourly patterns for today
const hourlyPatterns = {
  measures: ["Orders.count"],
  timeDimensions: [{
    dimension: "Orders.createdAt",
    granularity: "hour",
    dateRange: "today"
  }]
}
```

## Date Range Options

Time dimensions support flexible date range filtering with both relative and absolute date ranges.

### Relative Date Ranges

Relative date ranges automatically calculate based on the current date. See the [Complete Date Range Reference](#complete-date-range-reference) table below for all supported options.

### Absolute Date Ranges

Specify exact start and end dates using arrays:

```typescript
// Specific date range
dateRange: ["2023-01-01", "2023-12-31"]

// Single date (same start and end)
dateRange: ["2023-06-15", "2023-06-15"]

// Partial dates (will be parsed appropriately)
dateRange: ["2023-01", "2023-12"] // January to December 2023
```

### Date Range Examples

```typescript
// Relative date range examples
const examples = [
  {
    title: "Today"s Activity",
    query: {
      measures: ["Orders.count"],
      timeDimensions: [{
        dimension: "Orders.createdAt",
        granularity: "hour",
        dateRange: "today"
      }]
    }
  },
  {
    title: "This Month"s Sales",
    query: {
      measures: ["Sales.totalRevenue"],
      timeDimensions: [{
        dimension: "Sales.date",
        granularity: "day",
        dateRange: "this month"
      }]
    }
  },
  {
    title: "Last 90 Days Trend",
    query: {
      measures: ["Users.signupCount"],
      timeDimensions: [{
        dimension: "Users.createdAt",
        granularity: "week",
        dateRange: "last 90 days"
      }]
    }
  },
  {
    title: "Quarterly Comparison",
    query: {
      measures: ["Revenue.total"],
      timeDimensions: [{
        dimension: "Revenue.date",
        granularity: "quarter",
        dateRange: "last 4 quarters"
      }]
    }
  },
  {
    title: "Specific Campaign Period",
    query: {
      measures: ["Campaigns.conversions"],
      timeDimensions: [{
        dimension: "Campaigns.startDate",
        granularity: "day",
        dateRange: ["2023-06-01", "2023-06-30"]
      }]
    }
  }
]
```

## Complete Date Range Reference

### Standard Relative Ranges

| Range String | Description | Calculation |
|--------------|-------------|-------------|
| today | Current day | 00:00:00 to 23:59:59 today |
| yesterday | Previous day | 00:00:00 to 23:59:59 yesterday |
| this week | Current week | Monday 00:00 to Sunday 23:59 |
| this month | Current month | 1st 00:00 to last day 23:59 |
| this quarter | Current quarter | Quarter start to quarter end |
| this year | Current year | Jan 1st 00:00 to Dec 31st 23:59 |
| last week | Previous week | Previous Monday to Sunday |
| last month | Previous month | Previous month start to end |
| last quarter | Previous quarter | Previous quarter start to end |
| last year | Previous year | Previous Jan 1st to Dec 31st |

### Rolling Period Ranges

| Range String | Description | Calculation |
|--------------|-------------|-------------|
| last 7 days | Last 7 days | 7 days ago 00:00 to now |
| last 30 days | Last 30 days | 30 days ago 00:00 to now |
| last 90 days | Last 90 days | 90 days ago 00:00 to now |
| last 12 months | Last 12 months | 12 months ago to now |

### Dynamic Pattern Ranges

| Pattern | Example | Description |
|---------|---------|-------------|
| last N days | last 14 days | Last N days including today |
| last N weeks | last 4 weeks | Last N weeks rolling |
| last N months | last 6 months | Last N months rolling |
| last N quarters | last 2 quarters | Last N quarters rolling |
| last N years | last 3 years | Last N years rolling |

## Multiple Time Dimensions

You can include multiple time dimensions in a single query:

```typescript
const complexTimeQuery = {
  measures: ["Orders.count", "Orders.totalValue"],
  dimensions: ["Orders.status"],
  timeDimensions: [
    {
      dimension: "Orders.createdAt",
      granularity: "week",
      dateRange: "last 12 weeks"
    },
    {
      dimension: "Orders.shippedAt", 
      granularity: "day",
      dateRange: "last 30 days"
    }
  ]
}
```

## Time Dimension Filtering

Time dimensions can also be used in filters for more complex queries:

```typescript
const filteredQuery = {
  measures: ["Sales.revenue"],
  dimensions: ["Products.category"],
  timeDimensions: [{
    dimension: "Sales.date",
    granularity: "month",
    dateRange: "this year"
  }],
  filters: [
    {
      member: "Sales.createdAt",
      operator: "inDateRange",
      values: ["2023-Q2"] // Second quarter only
    }
  ]
}
```

## Advanced Time Patterns

### Business Quarter Analysis
```typescript
const quarterlyBusiness = {
  measures: ["Revenue.total", "Revenue.growth"],
  dimensions: ["Revenue.region"],
  timeDimensions: [{
    dimension: "Revenue.date",
    granularity: "quarter",
    dateRange: "last 8 quarters" // 2 years of quarters
  }]
}
```

### Seasonal Comparison
```typescript
const seasonalAnalysis = {
  measures: ["Sales.volume"],
  dimensions: ["Products.category"],
  timeDimensions: [{
    dimension: "Sales.date", 
    granularity: "month",
    dateRange: ["2022-12-01", "2024-02-28"] // Winter seasons
  }]
}
```

### Rolling 12-Month Windows
```typescript
const rollingAnalysis = {
  measures: ["Users.retention"],
  timeDimensions: [{
    dimension: "Users.firstLoginAt",
    granularity: "month",
    dateRange: "last 12 months"
  }]
}
```

## Time Zone Considerations

Drizzle Cube handles time zones consistently:

- **Server Processing**: All calculations use UTC internally
- **Database Queries**: Times are normalized to UTC before comparison
- **Client Display**: Format times according to user"s timezone in the frontend
- **Date Boundaries**: Day, week, month boundaries calculated in UTC

```typescript
// Time dimension definition with timezone awareness
dimensions: {
  orderTime: {
    name: "orderTime",
    title: "Order Time",
    type: "time",
    sql: orders.createdAt, // Stored in UTC in database
    description: "Order creation time (UTC)"
  }
}
```

## Performance Optimization

### Indexing Time Columns
Ensure time dimension columns are indexed in your database:

```sql
-- PostgreSQL example
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_employees_hire_date ON employees(created_at);
```

### Efficient Date Range Queries
```typescript
// Good: Use appropriate granularity
const efficientQuery = {
  measures: ["Sales.revenue"],
  timeDimensions: [{
    dimension: "Sales.date",
    granularity: "month", // Don"t use "day" for yearly analysis
    dateRange: "this year"
  }]
}

// Avoid: Over-granular queries for large time ranges
const inefficientQuery = {
  measures: ["Sales.revenue"],
  timeDimensions: [{
    dimension: "Sales.date", 
    granularity: "hour", // Too granular for 2-year analysis
    dateRange: "last 2 years"
  }]
}
```

## Common Time Dimension Patterns

### Standard Date Fields
```typescript
// Employee hire dates
createdAt: {
  name: "createdAt",
  title: "Hire Date",
  type: "time",
  sql: employees.createdAt
}

// Activity dates
activityDate: {
  name: "activityDate",
  title: "Activity Date", 
  type: "time",
  sql: activities.date
}

// Update timestamps
updatedAt: {
  name: "updatedAt",
  title: "Last Modified",
  type: "time",
  sql: records.updatedAt
}
```

### Computed Time Fields
```typescript
// Business day flag
businessDay: {
  name: "businessDay",
  title: "Business Day",
  type: "boolean",
  sql: sql`EXTRACT(DOW FROM ${activities.date}) BETWEEN 1 AND 5`
}

// Time period categories  
timePeriod: {
  name: "timePeriod",
  title: "Time Period",
  type: "string",
  sql: sql`
    CASE 
      WHEN ${activities.date} >= CURRENT_DATE - INTERVAL "7 days" THEN "This Week"
      WHEN ${activities.date} >= CURRENT_DATE - INTERVAL "30 days" THEN "This Month"
      WHEN ${activities.date} >= CURRENT_DATE - INTERVAL "90 days" THEN "This Quarter"
      ELSE "Earlier"
    END
  `
}
```

## Testing Time Dimensions

```typescript
import { describe, it, expect } from "vitest"

describe("Time Dimensions", () => {
  it("should handle relative date ranges", async () => {
    const query = {
      measures: ["Sales.count"],
      timeDimensions: [{
        dimension: "Sales.date",
        granularity: "day",
        dateRange: "last 7 days"
      }]
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: "test-org"
    })
    
    const data = result.rawData()
    expect(data).toHaveLength(7) // Should have 7 days
    expect(data[0]["Sales.date"]).toBeDefined()
  })
  
  it("should handle absolute date ranges", async () => {
    const query = {
      measures: ["Users.signupCount"],
      timeDimensions: [{
        dimension: "Users.createdAt",
        granularity: "month",
        dateRange: ["2023-01-01", "2023-12-31"]
      }]
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: "test-org"  
    })
    
    const data = result.rawData()
    expect(data).toHaveLength(12) // 12 months
    expect(data[0]["Users.createdAt"]).toMatch(/2023-/)
  })
  
  it("should handle multiple granularities", async () => {
    const weeklyQuery = {
      measures: ["Orders.count"],
      timeDimensions: [{
        dimension: "Orders.createdAt",
        granularity: "week",
        dateRange: "last 4 weeks"
      }]
    }
    
    const monthlyQuery = {
      measures: ["Orders.count"],
      timeDimensions: [{
        dimension: "Orders.createdAt", 
        granularity: "month",
        dateRange: "last 4 months"
      }]
    }
    
    const weeklyResult = await semanticLayer.load(weeklyQuery, { organisationId: "test" })
    const monthlyResult = await semanticLayer.load(monthlyQuery, { organisationId: "test" })
    
    expect(weeklyResult.rawData()).toHaveLength(4)
    expect(monthlyResult.rawData()).toHaveLength(4)
  })
})
```

## Best Practices

1. **Use Appropriate Granularity**: Match granularity to your analysis needs
2. **Index Time Columns**: Ensure database performance with proper indexes
3. **Relative Ranges**: Prefer relative ranges for dynamic dashboards
4. **UTC Consistency**: Store all times in UTC in your database
5. **Boundary Awareness**: Understand how date boundaries are calculated
6. **Performance Testing**: Test queries with large date ranges
7. **Business Logic**: Use computed dimensions for business-specific time logic

## Common Use Cases

### Dashboard Time Controls
```typescript
// Dynamic dashboard with user-selectable time ranges
const dashboardQuery = (timeRange: string) => ({
  measures: ["Metrics.value"],
  dimensions: ["Metrics.category"],
  timeDimensions: [{
    dimension: "Metrics.date",
    granularity: "day",
    dateRange: timeRange // "last 30 days", "this month", etc.
  }]
})
```

### Trend Analysis
```typescript
// Year-over-year comparison
const yearOverYear = {
  measures: ["Sales.revenue"],
  timeDimensions: [{
    dimension: "Sales.date",
    granularity: "month",
    dateRange: "last 24 months"
  }]
}
```

### Cohort Analysis
```typescript
// User cohorts by signup month
const userCohorts = {
  measures: ["Users.count", "Users.retainedCount"],
  dimensions: ["Users.cohortMonth"],
  timeDimensions: [{
    dimension: "Users.createdAt",
    granularity: "month", 
    dateRange: "last 12 months"
  }]
}
```

## Next Steps

- Learn about [Measures](/help/semantic-layer/measures) for time-based aggregations
- Explore [Dimensions](/help/semantic-layer/dimensions) for categorical analysis
- Review [Query Builder](/help/client/query-builder) for interactive time controls
- See [Performance](/help/advanced/performance) for time dimension optimization