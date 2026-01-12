---
name: dashboard-config
description: Create and configure dashboards with portlets (charts/widgets) using DashboardConfig in Drizzle Cube.
---

# Dashboard Config Skill

This skill helps you create and configure analytics dashboards using DashboardConfig and PortletConfig structures.

## DashboardConfig Overview

```typescript
interface DashboardConfig {
  portlets: PortletConfig[]           // Array of chart widgets
  layoutMode?: 'grid' | 'rows'        // Layout strategy
  grid?: DashboardGridSettings        // Grid configuration
  rows?: RowLayout[]                  // Row-based layout
  colorPalette?: string               // Color palette name
  filters?: DashboardFilter[]         // Dashboard-level filters
  eagerLoad?: boolean                 // Load all portlets immediately
}
```

## Complete Dashboard Example

```typescript
const dashboardConfig: DashboardConfig = {
  layoutMode: 'grid',

  grid: {
    cols: 12,           // 12-column grid
    rowHeight: 80,      // Pixels per row unit
    minW: 2,           // Minimum portlet width
    minH: 2            // Minimum portlet height
  },

  colorPalette: 'blue',

  // Dashboard-level filters applied to all portlets
  filters: [
    {
      id: 'dateFilter',
      label: 'Date Range',
      filter: {
        member: 'Orders.createdAt',
        operator: 'inDateRange',
        values: ['2024-01-01', '2024-12-31']
      },
      isUniversalTime: true  // Applies to all timeDimensions
    },
    {
      id: 'regionFilter',
      label: 'Region',
      filter: {
        member: 'Customers.region',
        operator: 'equals',
        values: ['North America']
      }
    }
  ],

  portlets: [
    // Portlet configs here...
  ]
}
```

## PortletConfig Structure

```typescript
interface PortletConfig {
  id: string                          // Unique identifier
  title: string                       // Display title

  // NEW: Use analysisConfig (recommended)
  analysisConfig?: AnalysisConfig     // Complete analysis configuration

  // Grid position (required)
  w: number                           // Width in grid units (1-12)
  h: number                           // Height in grid units
  x: number                           // X position (0-11)
  y: number                           // Y position (row)

  // Filter integration
  dashboardFilterMapping?: string[]   // Filter IDs to apply
  eagerLoad?: boolean                 // Override lazy loading

  // DEPRECATED: Legacy fields (still supported for backward compatibility)
  // query?: string                   // JSON string - use analysisConfig
  // chartType?: ChartType            // Use analysisConfig.charts
  // chartConfig?: ChartAxisConfig    // Use analysisConfig.charts
  // displayConfig?: ChartDisplayConfig // Use analysisConfig.charts
}
```

## Portlet Examples

### Bar Chart Portlet

```typescript
{
  id: 'revenue-by-department',
  title: 'Revenue by Department',
  w: 6,
  h: 4,
  x: 0,
  y: 0,
  dashboardFilterMapping: ['dateFilter'],
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'bar',
        chartConfig: {
          xAxis: ['Departments.name'],
          yAxis: ['Sales.totalRevenue']
        },
        displayConfig: {
          showLegend: false,
          orientation: 'vertical',
          stackType: 'none'
        }
      }
    },
    query: {
      measures: ['Sales.totalRevenue'],
      dimensions: ['Departments.name'],
      order: { 'Sales.totalRevenue': 'desc' },
      limit: 10
    }
  }
}
```

### KPI Number Portlet

```typescript
{
  id: 'total-revenue',
  title: 'Total Revenue',
  w: 3,
  h: 2,
  x: 0,
  y: 0,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'kpiNumber',
        chartConfig: {
          yAxis: ['Sales.totalRevenue']
        },
        displayConfig: {
          prefix: '$',
          decimals: 0,
          valueColorIndex: 0  // Use first palette color
        }
      }
    },
    query: {
      measures: ['Sales.totalRevenue']
    }
  }
}
```

### KPI Delta Portlet (with comparison)

```typescript
{
  id: 'revenue-change',
  title: 'Revenue vs Last Month',
  w: 3,
  h: 2,
  x: 3,
  y: 0,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'kpiDelta',
        chartConfig: {
          yAxis: ['Sales.totalRevenue']
        },
        displayConfig: {
          prefix: '$',
          decimals: 0,
          positiveColorIndex: 2,   // Green
          negativeColorIndex: 1,   // Red
          showHistogram: true
        }
      }
    },
    query: {
      measures: ['Sales.totalRevenue'],
      timeDimensions: [{
        dimension: 'Sales.createdAt',
        granularity: 'month',
        compareDateRange: [
          ['2024-02-01', '2024-02-29'],  // Current
          ['2024-01-01', '2024-01-31']   // Previous
        ]
      }]
    }
  }
}
```

### Line Chart with Time Series

```typescript
{
  id: 'revenue-trend',
  title: 'Revenue Trend',
  w: 8,
  h: 4,
  x: 0,
  y: 4,
  dashboardFilterMapping: ['dateFilter'],
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'line',
        chartConfig: {
          xAxis: ['Sales.createdAt'],
          yAxis: ['Sales.totalRevenue']
        },
        displayConfig: {
          showLegend: true,
          showGrid: true,
          showTooltip: true
        }
      }
    },
    query: {
      measures: ['Sales.totalRevenue'],
      timeDimensions: [{
        dimension: 'Sales.createdAt',
        granularity: 'month',
        fillMissingDates: true
      }]
    }
  }
}
```

### Funnel Portlet

```typescript
{
  id: 'signup-funnel',
  title: 'Signup to Purchase Funnel',
  w: 6,
  h: 4,
  x: 6,
  y: 0,
  analysisConfig: {
    version: 1,
    analysisType: 'funnel',
    activeView: 'chart',
    charts: {
      funnel: {
        chartType: 'funnel',
        chartConfig: {},
        displayConfig: {
          funnelStyle: 'funnel',
          showFunnelConversion: true,
          showFunnelAvgTime: true
        }
      }
    },
    query: {
      funnel: {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          { name: 'Signup', cube: 'Events', filter: {...} },
          { name: 'First Visit', cube: 'Events', filter: {...} },
          { name: 'Purchase', cube: 'Events', filter: {...} }
        ],
        includeTimeMetrics: true
      }
    }
  }
}
```

### Data Table Portlet

```typescript
{
  id: 'top-customers',
  title: 'Top Customers',
  w: 6,
  h: 5,
  x: 6,
  y: 4,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'table',  // Show as table
    charts: {
      query: {
        chartType: 'table',
        chartConfig: {},
        displayConfig: {
          pivotTimeDimension: false
        }
      }
    },
    query: {
      measures: ['Orders.totalRevenue', 'Orders.count'],
      dimensions: ['Customers.name', 'Customers.email'],
      order: { 'Orders.totalRevenue': 'desc' },
      limit: 20
    }
  }
}
```

### Markdown/Text Portlet

```typescript
{
  id: 'dashboard-header',
  title: 'Sales Overview',
  w: 12,
  h: 1,
  x: 0,
  y: 0,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'markdown',
        chartConfig: {},
        displayConfig: {
          content: '# Q1 2024 Sales Dashboard\n\nKey metrics and trends',
          fontSize: 'medium',
          alignment: 'center'
        }
      }
    },
    query: {}
  }
}
```

## Grid Layout System

### Grid Settings

```typescript
grid: {
  cols: 12,        // Total columns (standard is 12)
  rowHeight: 80,   // Pixels per row unit
  minW: 2,         // Minimum width (grid units)
  minH: 2          // Minimum height (grid units)
}
```

### Grid Position Reference

| Position | Description |
|----------|-------------|
| `x: 0, w: 6` | Left half |
| `x: 6, w: 6` | Right half |
| `x: 0, w: 12` | Full width |
| `x: 0, w: 4` | Left third |
| `x: 4, w: 4` | Center third |
| `x: 8, w: 4` | Right third |
| `x: 0, w: 3` | Quarter width |

### Common Layout Patterns

**Two columns:**
```typescript
[
  { id: 'left', w: 6, h: 4, x: 0, y: 0 },
  { id: 'right', w: 6, h: 4, x: 6, y: 0 }
]
```

**Header + two columns:**
```typescript
[
  { id: 'header', w: 12, h: 2, x: 0, y: 0 },
  { id: 'left', w: 6, h: 4, x: 0, y: 2 },
  { id: 'right', w: 6, h: 4, x: 6, y: 2 }
]
```

**KPI row + main chart:**
```typescript
[
  { id: 'kpi1', w: 3, h: 2, x: 0, y: 0 },
  { id: 'kpi2', w: 3, h: 2, x: 3, y: 0 },
  { id: 'kpi3', w: 3, h: 2, x: 6, y: 0 },
  { id: 'kpi4', w: 3, h: 2, x: 9, y: 0 },
  { id: 'mainChart', w: 12, h: 5, x: 0, y: 2 }
]
```

## Dashboard Filters

Filters can be applied at the dashboard level and mapped to individual portlets:

```typescript
// Define filter at dashboard level
filters: [
  {
    id: 'dateFilter',
    label: 'Date Range',
    filter: {
      member: 'Orders.createdAt',
      operator: 'inDateRange',
      values: ['2024-01-01', '2024-12-31']
    },
    isUniversalTime: true  // Apply to ALL time dimensions
  }
]

// Map filter to portlet
portlets: [
  {
    id: 'chart1',
    dashboardFilterMapping: ['dateFilter'],  // This portlet uses dateFilter
    // ...
  },
  {
    id: 'chart2',
    dashboardFilterMapping: [],  // This portlet ignores dashboard filters
    // ...
  }
]
```

## Color Palettes

Built-in palettes:
- `'default'` - Balanced color set
- `'blue'` - Blue tones
- `'green'` - Green tones
- `'warm'` - Orange/red tones
- `'cool'` - Blue/purple tones
- `'monochrome'` - Grayscale

```typescript
{
  colorPalette: 'blue',
  portlets: [...]
}
```

## Lazy Loading

By default, portlets are lazy-loaded as they scroll into view. Override with:

```typescript
// Dashboard level - load all immediately
{
  eagerLoad: true,
  portlets: [...]
}

// Portlet level - override for specific portlet
{
  id: 'important-chart',
  eagerLoad: true,  // Always load this one
  // ...
}
```

## React Usage

```tsx
import { AnalyticsDashboard } from 'drizzle-cube/client'
import 'drizzle-cube/client/styles.css'

function MyDashboard() {
  const [config, setConfig] = useState<DashboardConfig>(initialConfig)

  return (
    <AnalyticsDashboard
      config={config}
      editable={true}
      onConfigChange={setConfig}
      onSave={async (newConfig) => {
        await saveDashboard(newConfig)
      }}
      onDirtyStateChange={(isDirty) => {
        // Handle unsaved changes warning
      }}
    />
  )
}
```

## Best Practices

1. **Use analysisConfig** - Prefer the new `analysisConfig` field over legacy fields
2. **Unique IDs** - Ensure every portlet has a unique `id`
3. **Consistent grid** - Use a 12-column grid for flexibility
4. **Filter mapping** - Map dashboard filters to relevant portlets only
5. **Appropriate chart types** - Match chart type to data (KPIs for single values, lines for trends)
6. **Reasonable limits** - Set `limit` on queries to avoid huge data sets
7. **Loading strategy** - Use lazy loading for large dashboards
