---
name: analysis-config
description: Create and configure AnalysisConfig objects for query, funnel, and flow analysis modes in Drizzle Cube dashboards.
---

# Analysis Config Skill

This skill helps you create AnalysisConfig objects - the canonical format for persisting analysis state in Drizzle Cube. Use AnalysisConfig for:
- Dashboard portlets (via `analysisConfig` field)
- Share URLs
- localStorage persistence

## AnalysisConfig Overview

```typescript
interface AnalysisConfig {
  version: 1                              // Always 1
  analysisType: 'query' | 'funnel' | 'flow'
  activeView: 'table' | 'chart'
  charts: {
    [K in AnalysisType]?: ChartConfig     // Per-mode chart settings
  }
  query: CubeQuery | MultiQueryConfig | ServerFunnelQuery | ServerFlowQuery
}

interface ChartConfig {
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
}
```

## Query Mode (analysisType: 'query')

For standard queries and multi-query analysis.

### Single Query Example

```typescript
const singleQueryConfig: QueryAnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {
        xAxis: ['Employees.department'],
        yAxis: ['Employees.count', 'Employees.avgSalary']
      },
      displayConfig: {
        showLegend: true,
        stackType: 'none'
      }
    }
  },
  query: {
    measures: ['Employees.count', 'Employees.avgSalary'],
    dimensions: ['Employees.department'],
    filters: [
      {
        member: 'Employees.isActive',
        operator: 'equals',
        values: [true]
      }
    ],
    order: {
      'Employees.count': 'desc'
    },
    limit: 10
  }
}
```

### Multi-Query Example

Combine multiple queries with merge strategies:

```typescript
const multiQueryConfig: QueryAnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'line',
      chartConfig: {
        xAxis: ['Orders.createdAt'],
        yAxis: ['Sales.totalRevenue', 'Returns.totalRefunds']
      },
      displayConfig: {
        showLegend: true,
        showGrid: true
      }
    }
  },
  query: {
    queries: [
      {
        measures: ['Sales.totalRevenue'],
        timeDimensions: [{
          dimension: 'Orders.createdAt',
          granularity: 'month'
        }]
      },
      {
        measures: ['Returns.totalRefunds'],
        timeDimensions: [{
          dimension: 'Returns.createdAt',
          granularity: 'month'
        }]
      }
    ],
    mergeStrategy: 'merge',
    mergeKeys: ['Orders.createdAt'],
    queryLabels: ['Revenue', 'Refunds']
  }
}
```

**Merge Strategies:**
- `'concat'` - Append rows with `__queryIndex` marker (for separate series)
- `'merge'` - Align data by common dimension key (for combined visualization)

## Funnel Mode (analysisType: 'funnel')

For sequential step analysis with conversion tracking.

### Funnel Example

```typescript
const funnelConfig: FunnelAnalysisConfig = {
  version: 1,
  analysisType: 'funnel',
  activeView: 'chart',
  charts: {
    funnel: {
      chartType: 'funnel',
      chartConfig: {},
      displayConfig: {
        funnelStyle: 'funnel',           // 'funnel' or 'bars'
        funnelOrientation: 'horizontal', // 'horizontal' or 'vertical'
        showFunnelConversion: true,
        showFunnelAvgTime: true
      }
    }
  },
  query: {
    funnel: {
      // Binding key links steps together (user/entity ID)
      bindingKey: 'Events.userId',

      // Time dimension for ordering and time-to-convert
      timeDimension: 'Events.timestamp',

      // Sequential steps
      steps: [
        {
          name: 'Signup',
          cube: 'Events',
          filter: {
            member: 'Events.eventType',
            operator: 'equals',
            values: ['signup']
          }
        },
        {
          name: 'First Purchase',
          cube: 'Purchases',
          filter: {
            member: 'Purchases.amount',
            operator: 'gt',
            values: [0]
          },
          timeToConvert: 'P30D'  // Must convert within 30 days
        },
        {
          name: 'Repeat Purchase',
          cube: 'Purchases',
          filter: {
            member: 'Purchases.isRepeat',
            operator: 'equals',
            values: [true]
          },
          timeToConvert: 'P90D'
        }
      ],

      // Optional: track time metrics between steps
      includeTimeMetrics: true,

      // Optional: overall time window for the entire funnel
      globalTimeWindow: 'P180D'
    }
  }
}
```

### Cross-Cube Funnel

When the binding key has different names in different cubes:

```typescript
query: {
  funnel: {
    // Map the binding key across cubes
    bindingKey: [
      { cube: 'Signups', dimension: 'Signups.userId' },
      { cube: 'Purchases', dimension: 'Purchases.customerId' }
    ],
    timeDimension: [
      { cube: 'Signups', dimension: 'Signups.createdAt' },
      { cube: 'Purchases', dimension: 'Purchases.purchaseDate' }
    ],
    steps: [
      { name: 'Signup', cube: 'Signups', filter: {...} },
      { name: 'Purchase', cube: 'Purchases', filter: {...} }
    ]
  }
}
```

### Time Window Formats (ISO 8601 Duration)

| Format | Duration |
|--------|----------|
| `PT1H` | 1 hour |
| `PT24H` | 24 hours |
| `P1D` | 1 day |
| `P7D` | 7 days |
| `P30D` | 30 days |
| `P90D` | 90 days |

## Flow Mode (analysisType: 'flow')

For bidirectional path analysis with Sankey diagram visualization.

### Flow Example

```typescript
const flowConfig: FlowAnalysisConfig = {
  version: 1,
  analysisType: 'flow',
  activeView: 'chart',
  charts: {
    flow: {
      chartType: 'sankey',
      chartConfig: {},
      displayConfig: {}
    }
  },
  query: {
    flow: {
      // Binding key identifies entities
      bindingKey: 'Events.userId',

      // Time dimension for ordering events
      timeDimension: 'Events.timestamp',

      // Event dimension for node labels
      eventDimension: 'Events.eventType',

      // Starting step (anchor point)
      startingStep: {
        name: 'Purchase',
        filter: {
          member: 'Events.eventType',
          operator: 'equals',
          values: ['purchase']
        }
      },

      // Explore N steps before the starting step
      stepsBefore: 3,

      // Explore N steps after the starting step
      stepsAfter: 3,

      // Join strategy
      joinStrategy: 'auto'  // 'auto' | 'lateral' | 'window'
    }
  }
}
```

### Flow Output Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `sankey` | Aggregate by (layer, event_type) | Standard flow visualization, paths converge |
| `sunburst` | Path-qualified nodes | Hierarchical tree, each path unique |

## Complete CubeQuery Reference

```typescript
interface CubeQuery {
  // Core query fields
  measures?: string[]              // e.g., ['Sales.count', 'Sales.revenue']
  dimensions?: string[]            // e.g., ['Products.category']

  // Time dimensions with granularity
  timeDimensions?: Array<{
    dimension: string              // e.g., 'Orders.createdAt'
    granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
    dateRange?: string | [string, string]
    fillMissingDates?: boolean
    compareDateRange?: (string | [string, string])[]
  }>

  // Filters
  filters?: Filter[]

  // Ordering
  order?: { [key: string]: 'asc' | 'desc' }

  // Pagination
  limit?: number
  offset?: number

  // Missing date handling
  fillMissingDatesValue?: number | null
}
```

## Filter Operators

```typescript
type FilterOperator =
  // Equality
  | 'equals' | 'notEquals'
  // String matching
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  // Numeric comparison
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween'
  // Array membership
  | 'in' | 'notIn'
  // Null checks
  | 'set' | 'notSet' | 'isEmpty' | 'isNotEmpty'
  // Date operations
  | 'inDateRange' | 'beforeDate' | 'afterDate'
  // Regex
  | 'regex' | 'notRegex'
```

### Filter Examples

```typescript
// Simple filter
{
  member: 'Products.category',
  operator: 'equals',
  values: ['Electronics']
}

// Numeric range
{
  member: 'Orders.amount',
  operator: 'between',
  values: [100, 500]
}

// Date range
{
  member: 'Orders.createdAt',
  operator: 'inDateRange',
  values: ['2024-01-01', '2024-12-31']
}

// Grouped filters (AND/OR)
{
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
}
```

## Supported Chart Types

| Chart Type | Best For | Required Config |
|------------|----------|-----------------|
| `bar` | Comparisons | xAxis, yAxis |
| `line` | Trends over time | xAxis, yAxis |
| `area` | Trends with volume | xAxis, yAxis |
| `pie` | Proportions | yAxis (single measure) |
| `scatter` | Correlation | xAxis, yAxis |
| `radar` | Multi-dimensional | yAxis (multiple measures) |
| `table` | Detailed data | None |
| `funnel` | Conversion flows | Funnel query |
| `sankey` | Path analysis | Flow query |
| `kpiNumber` | Single value | yAxis (single measure) |
| `kpiDelta` | Change indicator | yAxis, previous period |
| `markdown` | Text content | displayConfig.content |
| `bubble` | 3+ dimensions | xAxis, yAxis, sizeField |
| `activityGrid` | Heatmap | dateField, valueField |

## Default Config Factories

Use these to create default configs:

```typescript
import {
  createDefaultQueryConfig,
  createDefaultFunnelConfig,
  createDefaultFlowConfig,
  createDefaultConfig
} from 'drizzle-cube/client'

// Create default for specific type
const queryConfig = createDefaultQueryConfig()
const funnelConfig = createDefaultFunnelConfig()
const flowConfig = createDefaultFlowConfig()

// Or use generic factory
const config = createDefaultConfig('query')  // 'query' | 'funnel' | 'flow'
```

## Type Guards

```typescript
import {
  isQueryConfig,
  isFunnelConfig,
  isFlowConfig,
  isMultiQuery,
  isValidAnalysisConfig
} from 'drizzle-cube/client'

// Check analysis type
if (isQueryConfig(config)) {
  // config.query is CubeQuery | MultiQueryConfig
}

if (isFunnelConfig(config)) {
  // config.query is ServerFunnelQuery
}

if (isFlowConfig(config)) {
  // config.query is ServerFlowQuery
}

// Check if multi-query
if (isQueryConfig(config) && isMultiQuery(config)) {
  // config.query is MultiQueryConfig with queries[]
}

// Validate unknown data
if (isValidAnalysisConfig(unknownData)) {
  // unknownData is AnalysisConfig
}
```

## Period Comparison

Compare data across time periods:

```typescript
{
  measures: ['Sales.revenue'],
  timeDimensions: [{
    dimension: 'Sales.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-03-31'],
    compareDateRange: [
      ['2023-01-01', '2023-03-31']  // Previous year comparison
    ]
  }]
}
```

## Workspace Persistence

For localStorage persistence across mode switches:

```typescript
interface AnalysisWorkspace {
  version: 1
  activeType: AnalysisType
  modes: {
    query?: QueryAnalysisConfig
    funnel?: FunnelAnalysisConfig
    flow?: FlowAnalysisConfig
  }
}

// Create default workspace
import { createDefaultWorkspace } from 'drizzle-cube/client'
const workspace = createDefaultWorkspace()
```
