---
name: query-building
description: Build semantic queries with measures, dimensions, filters, and time dimensions for Drizzle Cube.
---

# Query Building Skill

This skill helps you construct CubeQuery objects for querying Drizzle Cube's semantic layer.

## CubeQuery Structure

```typescript
interface CubeQuery {
  measures?: string[]                    // Aggregations
  dimensions?: string[]                  // Groupings
  timeDimensions?: TimeDimension[]       // Time-based analysis
  filters?: Filter[]                     // Data filtering
  order?: Record<string, 'asc' | 'desc'> // Sorting
  limit?: number                         // Row limit
  offset?: number                        // Pagination offset
  fillMissingDatesValue?: number | null  // Fill gaps in time series
}
```

## Field Naming Convention

All fields use `CubeName.fieldName` format:

```typescript
// Measures
'Sales.totalRevenue'
'Orders.count'
'Employees.avgSalary'

// Dimensions
'Products.category'
'Customers.region'
'Employees.department'

// Time Dimensions
'Orders.createdAt'
'Events.timestamp'
```

## Basic Query Examples

### Count Query
```typescript
{
  measures: ['Employees.count']
}
```

### Count with Dimension
```typescript
{
  measures: ['Employees.count'],
  dimensions: ['Employees.department']
}
```

### Multiple Measures
```typescript
{
  measures: [
    'Sales.totalRevenue',
    'Sales.avgOrderValue',
    'Orders.count'
  ],
  dimensions: ['Products.category']
}
```

### With Ordering and Limit
```typescript
{
  measures: ['Sales.totalRevenue'],
  dimensions: ['Customers.name'],
  order: {
    'Sales.totalRevenue': 'desc'
  },
  limit: 10
}
```

## Time Dimensions

### Basic Time Query
```typescript
{
  measures: ['Sales.totalRevenue'],
  timeDimensions: [{
    dimension: 'Orders.createdAt',
    granularity: 'month'
  }]
}
```

### With Date Range
```typescript
{
  measures: ['Sales.totalRevenue'],
  timeDimensions: [{
    dimension: 'Orders.createdAt',
    granularity: 'day',
    dateRange: ['2024-01-01', '2024-03-31']
  }]
}
```

### Predefined Date Ranges
```typescript
// Last 7 days
dateRange: 'last 7 days'

// This month
dateRange: 'this month'

// Last quarter
dateRange: 'last quarter'

// Year to date
dateRange: 'from 1 year ago to now'
```

### Granularity Options

| Granularity | Description |
|-------------|-------------|
| `hour` | Hourly aggregation |
| `day` | Daily aggregation |
| `week` | Weekly aggregation |
| `month` | Monthly aggregation |
| `quarter` | Quarterly aggregation |
| `year` | Yearly aggregation |

### Fill Missing Dates
```typescript
{
  measures: ['Orders.count'],
  timeDimensions: [{
    dimension: 'Orders.createdAt',
    granularity: 'day',
    dateRange: ['2024-01-01', '2024-01-31'],
    fillMissingDates: true
  }],
  fillMissingDatesValue: 0  // Fill gaps with 0
}
```

### Period Comparison
```typescript
{
  measures: ['Sales.totalRevenue'],
  timeDimensions: [{
    dimension: 'Sales.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-03-31'],
    compareDateRange: [
      ['2023-01-01', '2023-03-31']  // Compare to previous year
    ]
  }]
}
```

## Filters

### Filter Structure
```typescript
interface Filter {
  member: string              // Field name
  operator: FilterOperator    // Comparison operator
  values: any[]               // Values to compare
  dateRange?: string | [string, string]  // For date operators
}
```

### Filter Operators

**Equality:**
```typescript
{ member: 'Products.status', operator: 'equals', values: ['active'] }
{ member: 'Products.status', operator: 'notEquals', values: ['deleted'] }
```

**String Matching:**
```typescript
{ member: 'Products.name', operator: 'contains', values: ['Premium'] }
{ member: 'Products.name', operator: 'notContains', values: ['Test'] }
{ member: 'Products.name', operator: 'startsWith', values: ['Pro'] }
{ member: 'Products.name', operator: 'endsWith', values: ['Edition'] }
```

**Numeric Comparison:**
```typescript
{ member: 'Orders.amount', operator: 'gt', values: [100] }
{ member: 'Orders.amount', operator: 'gte', values: [100] }
{ member: 'Orders.amount', operator: 'lt', values: [1000] }
{ member: 'Orders.amount', operator: 'lte', values: [1000] }
{ member: 'Orders.amount', operator: 'between', values: [100, 500] }
```

**Array Membership:**
```typescript
{ member: 'Products.category', operator: 'in', values: ['Electronics', 'Clothing'] }
{ member: 'Products.category', operator: 'notIn', values: ['Archived', 'Draft'] }
```

**Null Checks:**
```typescript
{ member: 'Customers.email', operator: 'set', values: [] }      // NOT NULL
{ member: 'Customers.email', operator: 'notSet', values: [] }   // IS NULL
```

**Date Operators:**
```typescript
{ member: 'Orders.createdAt', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
{ member: 'Orders.createdAt', operator: 'beforeDate', values: ['2024-01-01'] }
{ member: 'Orders.createdAt', operator: 'afterDate', values: ['2024-06-01'] }
```

### Grouped Filters (AND/OR)

**AND Logic:**
```typescript
filters: [{
  type: 'and',
  filters: [
    { member: 'Products.isActive', operator: 'equals', values: [true] },
    { member: 'Products.stock', operator: 'gt', values: [0] }
  ]
}]
```

**OR Logic:**
```typescript
filters: [{
  type: 'or',
  filters: [
    { member: 'Orders.status', operator: 'equals', values: ['pending'] },
    { member: 'Orders.status', operator: 'equals', values: ['processing'] }
  ]
}]
```

**Complex Nested Logic:**
```typescript
// (isActive = true) AND (category = 'A' OR category = 'B')
filters: [{
  type: 'and',
  filters: [
    { member: 'Products.isActive', operator: 'equals', values: [true] },
    {
      type: 'or',
      filters: [
        { member: 'Products.category', operator: 'equals', values: ['A'] },
        { member: 'Products.category', operator: 'equals', values: ['B'] }
      ]
    }
  ]
}]
```

## MultiQueryConfig

Combine multiple queries with merge strategies:

```typescript
interface MultiQueryConfig {
  queries: CubeQuery[]
  mergeStrategy: 'concat' | 'merge'
  mergeKeys?: string[]       // For 'merge' strategy
  queryLabels?: string[]     // Optional labels
}
```

### Concat Strategy
Appends results with `__queryIndex` marker:

```typescript
{
  queries: [
    { measures: ['Sales.revenue'], dimensions: ['Products.category'] },
    { measures: ['Returns.total'], dimensions: ['Products.category'] }
  ],
  mergeStrategy: 'concat',
  queryLabels: ['Sales', 'Returns']
}
```

### Merge Strategy
Aligns results by common dimension:

```typescript
{
  queries: [
    { measures: ['Sales.revenue'], dimensions: ['Products.category'] },
    { measures: ['Returns.total'], dimensions: ['Products.category'] }
  ],
  mergeStrategy: 'merge',
  mergeKeys: ['Products.category']
}
```

## Query Patterns

### Top N Analysis
```typescript
{
  measures: ['Sales.totalRevenue'],
  dimensions: ['Products.name'],
  order: { 'Sales.totalRevenue': 'desc' },
  limit: 10
}
```

### Year-over-Year Comparison
```typescript
{
  measures: ['Sales.totalRevenue'],
  timeDimensions: [{
    dimension: 'Sales.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-12-31'],
    compareDateRange: [
      ['2023-01-01', '2023-12-31']
    ]
  }]
}
```

### Cohort Analysis
```typescript
{
  measures: ['Users.count'],
  dimensions: ['Users.signupMonth', 'Users.activityMonth'],
  filters: [
    { member: 'Users.signupMonth', operator: 'gte', values: ['2024-01'] }
  ]
}
```

### Funnel Query
```typescript
{
  funnel: {
    bindingKey: 'Events.userId',
    timeDimension: 'Events.timestamp',
    steps: [
      { name: 'View', cube: 'Events', filter: { member: 'Events.type', operator: 'equals', values: ['pageview'] } },
      { name: 'Cart', cube: 'Events', filter: { member: 'Events.type', operator: 'equals', values: ['add_to_cart'] } },
      { name: 'Purchase', cube: 'Events', filter: { member: 'Events.type', operator: 'equals', values: ['purchase'] } }
    ],
    includeTimeMetrics: true
  }
}
```

### Flow Query
```typescript
{
  flow: {
    bindingKey: 'Events.userId',
    timeDimension: 'Events.timestamp',
    eventDimension: 'Events.eventType',
    startingStep: {
      name: 'Purchase',
      filter: { member: 'Events.type', operator: 'equals', values: ['purchase'] }
    },
    stepsBefore: 3,
    stepsAfter: 3,
    joinStrategy: 'auto'
  }
}
```

## Query Validation

Before executing, validate your query:

1. **Field existence** - All measures/dimensions must exist in registered cubes
2. **Cube consistency** - Multi-cube queries need proper joins defined
3. **Filter validity** - Filter operators must match field types
4. **Date format** - Use ISO 8601 format (YYYY-MM-DD)

## API Execution

```typescript
// Using CubeClient directly
const result = await cubeClient.load(query)
const data = result.rawData()

// Using React hook
const { rawData, isLoading, error } = useCubeLoadQuery(query)

// SQL preview (dry run)
const { sql } = await cubeClient.sql(query)
```

## Debugging Queries

### Dry Run
Get SQL without executing:
```typescript
const result = await cubeClient.sql(query)
console.log(result.sql)
```

### Explain
Get query execution plan:
```typescript
// POST /cubejs-api/v1/explain
const explain = await fetch('/cubejs-api/v1/explain', {
  method: 'POST',
  body: JSON.stringify({ query })
})
```

## Common Mistakes

1. **Wrong field format** - Use `Cube.field`, not just `field`
2. **Missing granularity** - Time dimensions need granularity for aggregation
3. **Filter value type** - `values` must be an array, even for single values
4. **Limit without order** - Add `order` when using `limit` for consistent results
5. **Mixing time dimensions** - Use same granularity when combining time series
