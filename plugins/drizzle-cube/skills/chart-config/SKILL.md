---
name: chart-config
description: Configure chart axis mappings and display options for all chart types in Drizzle Cube.
---

# Chart Config Skill

This skill helps you configure charts using ChartAxisConfig and ChartDisplayConfig for optimal visualizations.

## ChartAxisConfig

Maps data fields to chart axes:

```typescript
interface ChartAxisConfig {
  xAxis?: string[]      // Dimension fields for X axis
  yAxis?: string[]      // Measure fields for Y axis
  series?: string[]     // Fields for grouping/series
  sizeField?: string    // Bubble chart size (numeric)
  colorField?: string   // Bubble chart color (dimension)
  dateField?: string[]  // Activity grid date field
  valueField?: string[] // Activity grid value field
  yAxisAssignment?: Record<string, 'left' | 'right'>  // Dual-axis
}
```

## ChartDisplayConfig

Controls visual appearance:

```typescript
interface ChartDisplayConfig {
  // Common options
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  colors?: string[]                   // Custom color array
  orientation?: 'horizontal' | 'vertical'
  stackType?: 'none' | 'normal' | 'percent'

  // Axis formatting
  xAxisFormat?: AxisFormatConfig
  leftYAxisFormat?: AxisFormatConfig
  rightYAxisFormat?: AxisFormatConfig

  // KPI options
  prefix?: string
  suffix?: string
  decimals?: number
  valueColorIndex?: number
  positiveColorIndex?: number
  negativeColorIndex?: number
  showHistogram?: boolean

  // Funnel options
  funnelStyle?: 'bars' | 'funnel'
  funnelOrientation?: 'horizontal' | 'vertical'
  showFunnelConversion?: boolean
  showFunnelAvgTime?: boolean

  // Markdown options
  content?: string
  fontSize?: 'small' | 'medium' | 'large'
  alignment?: 'left' | 'center' | 'right'

  // Table options
  pivotTimeDimension?: boolean
}
```

## Axis Format Config

```typescript
interface AxisFormatConfig {
  unit?: 'number' | 'currency' | 'percent' | 'duration' | 'bytes'
  abbreviate?: boolean      // 1000 → 1K
  decimals?: number         // Decimal places
  currencyCode?: string     // USD, EUR, etc.
  prefix?: string
  suffix?: string
}
```

## Chart Type Reference

### Bar Chart
```typescript
chartType: 'bar'
chartConfig: {
  xAxis: ['Products.category'],
  yAxis: ['Sales.revenue', 'Sales.count']
}
displayConfig: {
  orientation: 'vertical',    // 'vertical' or 'horizontal'
  stackType: 'none',          // 'none', 'normal', 'percent'
  showLegend: true,
  showGrid: true
}
```

**Stacked Bar:**
```typescript
displayConfig: {
  stackType: 'normal',  // Stack values
  // OR
  stackType: 'percent'  // 100% stacked
}
```

**Horizontal Bar:**
```typescript
displayConfig: {
  orientation: 'horizontal'
}
```

### Line Chart
```typescript
chartType: 'line'
chartConfig: {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue']
}
displayConfig: {
  showLegend: true,
  showGrid: true,
  showTooltip: true
}
```

**Multiple Series:**
```typescript
chartConfig: {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue'],
  series: ['Products.category']  // Group by category
}
```

### Area Chart
```typescript
chartType: 'area'
chartConfig: {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue']
}
displayConfig: {
  stackType: 'normal',  // Stacked area
  showLegend: true
}
```

### Pie Chart
```typescript
chartType: 'pie'
chartConfig: {
  xAxis: ['Products.category'],   // Slices
  yAxis: ['Sales.revenue']        // Values
}
displayConfig: {
  showLegend: true,
  showTooltip: true
}
```

### Scatter Plot
```typescript
chartType: 'scatter'
chartConfig: {
  xAxis: ['Employees.experience'],   // X position
  yAxis: ['Employees.salary']        // Y position
}
displayConfig: {
  showGrid: true,
  showTooltip: true
}
```

### Bubble Chart
```typescript
chartType: 'bubble'
chartConfig: {
  xAxis: ['Products.price'],
  yAxis: ['Products.rating'],
  sizeField: 'Products.salesCount',     // Bubble size
  colorField: 'Products.category'       // Bubble color
}
displayConfig: {
  showLegend: true
}
```

### Radar Chart
```typescript
chartType: 'radar'
chartConfig: {
  xAxis: ['Skills.name'],        // Spokes
  yAxis: ['Employees.score']     // Values
}
displayConfig: {
  showLegend: true
}
```

### Data Table
```typescript
chartType: 'table'
chartConfig: {}  // Tables auto-configure
displayConfig: {
  pivotTimeDimension: true  // Pivot time as columns
}
```

### KPI Number
Single value display:
```typescript
chartType: 'kpiNumber'
chartConfig: {
  yAxis: ['Sales.totalRevenue']
}
displayConfig: {
  prefix: '$',
  suffix: '',
  decimals: 0,
  valueColorIndex: 0  // Palette color index
}
```

### KPI Delta
Shows change between periods:
```typescript
chartType: 'kpiDelta'
chartConfig: {
  yAxis: ['Sales.totalRevenue']
}
displayConfig: {
  prefix: '$',
  decimals: 0,
  positiveColorIndex: 2,    // Green for growth
  negativeColorIndex: 1,    // Red for decline
  showHistogram: true       // Mini sparkline
}
```

**Query for KPI Delta:**
```typescript
query: {
  measures: ['Sales.totalRevenue'],
  timeDimensions: [{
    dimension: 'Sales.createdAt',
    granularity: 'month',
    compareDateRange: [
      ['2024-02-01', '2024-02-29'],  // Current period
      ['2024-01-01', '2024-01-31']   // Previous period
    ]
  }]
}
```

### Funnel Chart
```typescript
chartType: 'funnel'
chartConfig: {}
displayConfig: {
  funnelStyle: 'funnel',         // 'funnel' or 'bars'
  funnelOrientation: 'horizontal', // 'horizontal' or 'vertical'
  showFunnelConversion: true,    // Show conversion %
  showFunnelAvgTime: true        // Show avg time between steps
}
```

### Sankey (Flow) Chart
```typescript
chartType: 'sankey'
chartConfig: {}
displayConfig: {}
// Sankey auto-configures from flow query data
```

### Activity Grid (Heatmap)
```typescript
chartType: 'activityGrid'
chartConfig: {
  dateField: ['Events.date'],
  valueField: ['Events.count']
}
displayConfig: {
  showTooltip: true
}
```

### Markdown
```typescript
chartType: 'markdown'
chartConfig: {}
displayConfig: {
  content: '# Title\n\nSome **markdown** content',
  fontSize: 'medium',    // 'small' | 'medium' | 'large'
  alignment: 'center'    // 'left' | 'center' | 'right'
}
```

### Treemap
```typescript
chartType: 'treemap'
chartConfig: {
  xAxis: ['Products.category', 'Products.subcategory'],  // Hierarchy
  yAxis: ['Sales.revenue']  // Size
}
displayConfig: {
  showTooltip: true
}
```

## Dual-Axis Configuration

For charts with different scales:

```typescript
chartConfig: {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue', 'Sales.count'],
  yAxisAssignment: {
    'Sales.revenue': 'left',   // Left Y axis
    'Sales.count': 'right'     // Right Y axis
  }
}
displayConfig: {
  leftYAxisFormat: {
    unit: 'currency',
    abbreviate: true
  },
  rightYAxisFormat: {
    unit: 'number'
  }
}
```

## Common Display Patterns

### Currency Formatting
```typescript
displayConfig: {
  leftYAxisFormat: {
    unit: 'currency',
    currencyCode: 'USD',
    abbreviate: true,    // $1.5M instead of $1,500,000
    decimals: 0
  }
}
```

### Percentage Formatting
```typescript
displayConfig: {
  leftYAxisFormat: {
    unit: 'percent',
    decimals: 1
  }
}
```

### Duration Formatting
```typescript
displayConfig: {
  leftYAxisFormat: {
    unit: 'duration'  // Auto-formats seconds to human readable
  }
}
```

### Custom Colors
```typescript
displayConfig: {
  colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']
}
```

## Chart Selection Guide

| Data Type | Recommended Chart | Why |
|-----------|-------------------|-----|
| Single value | `kpiNumber` | Clear, prominent display |
| Period comparison | `kpiDelta` | Shows change direction |
| Trend over time | `line` | Shows progression |
| Category comparison | `bar` | Easy comparison |
| Part of whole | `pie` | Shows proportions |
| Correlation | `scatter` | Shows relationships |
| 3+ dimensions | `bubble` | Size/color encoding |
| Detailed data | `table` | Full data access |
| Conversions | `funnel` | Step-by-step drop-off |
| User journeys | `sankey` | Path visualization |
| Activity patterns | `activityGrid` | Calendar heatmap |

## Best Practices

1. **Match chart to question** - Use line for "how did it change?", bar for "how do they compare?"
2. **Limit categories** - Pie charts work best with 5-7 slices max
3. **Use consistent colors** - Stick to the palette
4. **Format appropriately** - Use abbreviation for large numbers
5. **Show legends when needed** - Required for multiple series
6. **Enable tooltips** - Helps users explore data
7. **Consider mobile** - Horizontal bars may work better on small screens
