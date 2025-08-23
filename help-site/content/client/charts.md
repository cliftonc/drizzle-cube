# Charts

Drizzle Cube provides a comprehensive set of chart components built on Recharts with Tailwind CSS styling. These components are designed to work seamlessly with Cube.js-compatible data and provide interactive, responsive visualizations for your analytics dashboards.

## Installation

```bash
# Full client (includes all charts)
npm install drizzle-cube react react-dom recharts

# Charts only (optimized bundle - ~550 bytes + chunks)
npm install drizzle-cube react react-dom recharts
```

## Import Options

```tsx
// Full client import
import { RechartsBarChart, RechartsLineChart } from 'drizzle-cube/client';

// Charts-only import (smaller bundle)
import { 
  RechartsBarChart, 
  RechartsLineChart, 
  RechartsAreaChart,
  RechartsPieChart,
  RechartsScatterChart,
  RechartsRadarChart,
  RechartsRadialBarChart,
  RechartsTreeMapChart,
  DataTable
} from 'drizzle-cube/client/charts';

// Chart utilities
import { 
  formatChartData, 
  CHART_COLORS, 
  POSITIVE_COLOR, 
  NEGATIVE_COLOR 
} from 'drizzle-cube/client/charts';
```

## Overview

The chart components are React-based visualization tools that automatically handle data transformation, formatting, and responsive design. They support various chart types, interactive features like legends and tooltips, and flexible configuration options.

### Bundle Size Optimization

When using charts-only imports, you get:
- **Minimal footprint**: ~550 bytes main bundle + shared chunks
- **On-demand loading**: Heavy dependencies (Recharts, icons) loaded as separate chunks
- **Tree shaking**: Unused chart types are eliminated from the bundle
- **Shared dependencies**: Common utilities shared across chart components

## Available Chart Types

### Bar Chart

The most versatile chart for categorical data comparison and time series visualization.

```tsx
import { RechartsBarChart } from 'drizzle-cube/client'

<RechartsBarChart
  resultSet={resultSet}
  chartConfig={{
    xAxis: ['Employees.createdAt'],
    yAxis: ['Employees.count'],
    series: ['Employees.departmentName']  // Creates separate series per department
  }}
  displayConfig={{
    showLegend: true,
    stackedBarChart: false,
    showGrid: true,
    showTooltip: true
  }}
/>
```

**Key Features:**
- Time dimension support with automatic formatting
- Multiple series from dimension fields
- Stacking support for grouped data
- Interactive legend with hover effects
- Automatic positive/negative value coloring
- Responsive design with proper margins

### Line Chart

Perfect for time series data and trend analysis.

```tsx
import { RechartsLineChart } from 'drizzle-cube/client'

<RechartsLineChart
  resultSet={resultSet}
  chartConfig={{
    xAxis: ['Productivity.date'],
    yAxis: ['Productivity.avgLinesOfCode', 'Productivity.avgHappinessIndex'],
    series: ['Productivity.employeeName']
  }}
  displayConfig={{
    showLegend: true,
    showGrid: true,
    smoothLines: true
  }}
/>
```

### Area Chart

Great for showing cumulative data and filled regions.

```tsx
import { RechartsAreaChart } from 'drizzle-cube/client'

<RechartsAreaChart
  resultSet={resultSet}
  chartConfig={{
    xAxis: ['Orders.createdAt'],
    yAxis: ['Orders.totalRevenue'],
    series: ['Orders.region']
  }}
  displayConfig={{
    showLegend: true,
    stackedArea: true,
    fillOpacity: 0.6
  }}
/>
```

### Pie Chart

Ideal for showing proportional data and composition.

```tsx
import { RechartsPieChart } from 'drizzle-cube/client'

<RechartsPieChart
  resultSet={resultSet}
  chartConfig={{
    dimension: 'Employees.departmentName',
    measure: 'Employees.count'
  }}
  displayConfig={{
    showLegend: true,
    showLabels: true,
    innerRadius: 0  // Use > 0 for donut chart
  }}
/>
```

### Scatter Chart

Perfect for correlation analysis and plotting relationships.

```tsx
import { RechartsScatterChart } from 'drizzle-cube/client'

<RechartsScatterChart
  resultSet={resultSet}
  chartConfig={{
    xAxis: ['Employees.salary'],
    yAxis: ['Productivity.avgLinesOfCode'],
    series: ['Employees.departmentName']
  }}
  displayConfig={{
    showLegend: true,
    showGrid: true,
    pointSize: 6
  }}
/>
```

### Additional Chart Types

```tsx
// Radar Chart - for multi-dimensional comparisons
import { RechartsRadarChart } from 'drizzle-cube/client'

// Radial Bar Chart - for circular bar visualization  
import { RechartsRadialBarChart } from 'drizzle-cube/client'

// Tree Map Chart - for hierarchical data
import { RechartsTreeMapChart } from 'drizzle-cube/client'
```

### Data Table

While not a chart, the DataTable component provides tabular data display:

```tsx
import { DataTable } from 'drizzle-cube/client'

<DataTable
  resultSet={resultSet}
  config={{
    showPagination: true,
    pageSize: 20,
    sortable: true
  }}
/>
```

## Chart Configuration

### Chart Config Structure

```typescript
interface ChartConfig {
  // Axis configuration
  xAxis?: string[]           // X-axis dimensions/measures
  yAxis?: string[]           // Y-axis measures
  series?: string[]          // Series-creating dimensions
  
  // Legacy format support
  x?: string                 // Single X-axis field
  y?: string[]              // Y-axis measures
}
```

### Display Config Options

```typescript
interface DisplayConfig {
  // Legend
  showLegend?: boolean       // Show/hide legend
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  
  // Grid and axes
  showGrid?: boolean         // Show grid lines
  showXAxis?: boolean        // Show X-axis
  showYAxis?: boolean        // Show Y-axis
  
  // Tooltips and interactions
  showTooltip?: boolean      // Show hover tooltips
  
  // Chart-specific options
  stackedBarChart?: boolean  // Stack bars (Bar Chart)
  stackedArea?: boolean      // Stack areas (Area Chart)
  smoothLines?: boolean      // Smooth line curves (Line Chart)
  fillOpacity?: number       // Fill opacity (0-1)
  
  // Styling
  colors?: string[]          // Custom color palette
  margin?: {                 // Custom margins
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}
```

## Data Transformation

Charts automatically transform Cube.js result sets into chart-ready format:

### Basic Data Flow

```typescript
// Cube.js query result
const resultSet = {
  rawData: () => [
    { 
      'Employees.departmentName': 'Engineering',
      'Employees.createdAt': '2023-01-01 00:00:00+00',
      'Employees.count': 15 
    },
    // ... more data
  ]
}

// Automatic transformation for charts
// X-axis: Formatted time dimensions (2023-01)
// Y-axis: Measure values (15)  
// Series: Department names (Engineering)
```

### Time Dimension Handling

Time dimensions are automatically formatted based on query granularity:

```typescript
// Query with monthly granularity
timeDimensions: [{
  dimension: 'Employees.createdAt',
  granularity: 'month',
  dateRange: ['2023-01-01', '2023-12-31']
}]

// Chart displays: 2023-01, 2023-02, 2023-03...
```

**Supported Granularities:**
- `year` → 2023
- `quarter` → 2023-Q1  
- `month` → 2023-01
- `week` → 2023-W01
- `day` → 2023-01-15
- `hour` → 2023-01-15 14:00

### Series Data Handling

Use the `series` field to create multiple data series:

```typescript
// Query result with series dimension
const data = [
  { dept: 'Engineering', month: '2023-01', count: 15 },
  { dept: 'Marketing', month: '2023-01', count: 8 },
  { dept: 'Engineering', month: '2023-02', count: 18 },
  { dept: 'Marketing', month: '2023-02', count: 10 }
]

// Chart Config
chartConfig: {
  xAxis: ['month'],
  yAxis: ['count'], 
  series: ['dept']
}

// Results in separate lines/bars for Engineering and Marketing
```

## Advanced Features

### Interactive Legends

Charts support interactive legends with hover effects:

```tsx
<RechartsBarChart
  resultSet={resultSet}
  chartConfig={{
    xAxis: ['Employees.createdAt'],
    yAxis: ['Employees.count'],
    series: ['Employees.departmentName']
  }}
  displayConfig={{
    showLegend: true,
    // Hovering legend items fades other series
  }}
/>
```

### Custom Styling

Override default styles with custom configurations:

```tsx
<RechartsBarChart
  resultSet={resultSet}
  chartConfig={{ /* ... */ }}
  displayConfig={{
    colors: ['#3B82F6', '#EF4444', '#10B981'], // Custom color palette
    margin: { top: 20, right: 30, bottom: 60, left: 40 },
    showGrid: true
  }}
/>
```

### Responsive Design

Charts are automatically responsive and adapt to container size:

```tsx
// Chart will resize automatically within container
<div className="w-full h-96">
  <RechartsBarChart
    resultSet={resultSet}
    chartConfig={{ /* ... */ }}
  />
</div>
```

## Error Handling

Charts include built-in error boundaries and handling:

```tsx
// Automatic error states for:
// - Missing data
// - Invalid configuration
// - Data transformation errors
// - Chart rendering failures

<RechartsBarChart
  resultSet={null}  // Shows "No data available" state
  chartConfig={{ /* ... */ }}
/>
```

## Best Practices

1. **Time Dimensions**: Always use `timeDimensions` in queries for proper time formatting
2. **Series Configuration**: Use `series` field for multi-dimensional data
3. **Performance**: Limit data points for large datasets (use filters/pagination)
4. **Responsive Design**: Ensure proper container sizing
5. **Color Accessibility**: Use accessible color palettes
6. **Loading States**: Handle loading states in parent components

## Usage with useCubeQuery Hook

Combine charts with the `useCubeQuery` hook for complete analytics components:

```tsx
import { useCubeQuery } from 'drizzle-cube/client'
import { RechartsBarChart } from 'drizzle-cube/client'

function EmployeeAnalytics() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName'],
    timeDimensions: [{
      dimension: 'Employees.createdAt',
      granularity: 'month',
      dateRange: ['2023-01-01', '2023-12-31']
    }]
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <RechartsBarChart
      resultSet={resultSet}
      chartConfig={{
        xAxis: ['Employees.createdAt'],
        yAxis: ['Employees.count'],
        series: ['Employees.departmentName']
      }}
      displayConfig={{
        showLegend: true,
        showGrid: true,
        stackedBarChart: false
      }}
    />
  )
}
```

## Styling and Theming

Charts use Tailwind CSS for styling and support custom theming:

```tsx
// Custom chart container styling
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-semibold mb-4">Employee Growth</h3>
  <RechartsBarChart
    resultSet={resultSet}
    chartConfig={{ /* ... */ }}
    displayConfig={{
      colors: ['#3B82F6', '#EF4444', '#10B981']
    }}
  />
</div>
```

## Performance Optimization

### Data Limiting

```tsx
// Limit data points for better performance
const query = {
  measures: ['Employees.count'],
  dimensions: ['Employees.createdAt'],
  limit: 100  // Limit to 100 data points
}
```

### Lazy Loading

```tsx
// Lazy load chart components
import { lazy, Suspense } from 'react'

const RechartsBarChart = lazy(() => import('drizzle-cube/client').then(m => ({ 
  default: m.RechartsBarChart 
})))

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <RechartsBarChart /* ... */ />
    </Suspense>
  )
}
```

## Testing Charts

```tsx
import { render, screen } from '@testing-library/react'
import { RechartsBarChart } from 'drizzle-cube/client'

const mockResultSet = {
  rawData: () => [
    { 'Employees.departmentName': 'Engineering', 'Employees.count': 15 }
  ]
}

test('renders bar chart with data', () => {
  render(
    <RechartsBarChart
      resultSet={mockResultSet}
      chartConfig={{
        xAxis: ['Employees.departmentName'],
        yAxis: ['Employees.count']
      }}
    />
  )
  
  expect(screen.getByRole('img')).toBeInTheDocument() // SVG chart
})
```

## Troubleshooting

### Common Issues

**Chart not rendering:**
- Verify resultSet contains data
- Check chartConfig matches your query fields
- Ensure proper container sizing

**Time dimensions not formatting:**
- Use `timeDimensions` in query (not just `dimensions`)
- Specify proper `granularity`
- Check timestamp format in raw data

**Series not appearing:**
- Verify `series` field matches dimension name
- Check if data contains the series dimension
- Ensure `showLegend: true` for multi-series visibility

**Performance issues:**
- Limit data points with query filters
- Use pagination for large datasets  
- Consider data aggregation at query level

## Next Steps

- Learn about [Dashboards](/help/client/dashboards) for layout and grid systems
- Explore [Hooks](/help/client/hooks) for data fetching patterns
- Review [React Client](/help/client) overview
- Check out dashboard examples in the repository

## Roadmap Ideas

- Additional chart types (Gantt, Funnel, Sankey)
- Advanced chart annotations and markers
- Export functionality (PNG, PDF, CSV)
- Real-time chart updates and streaming data
- Custom chart theme builder
- Chart drilling and navigation capabilities