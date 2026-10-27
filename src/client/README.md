# Drizzle Cube Client Components

React components for building analytics dashboards with minimal dependencies.

## Features

- 🎯 **Minimal Dependencies**: Only Tailwind CSS + Recharts
- 🔒 **No Auth/Navigation**: Embeds in existing apps  
- 📊 **9 Chart Types**: Bar, Line, Area, Pie, Table, Scatter, Radar, RadialBar, TreeMap
- 📱 **Responsive**: Built-in grid layout system
- 🎨 **Tailwind Styled**: Clean, customizable design
- ⚡ **TypeScript**: Full type safety

## Quick Start

```tsx
import { AnalyticsDashboard, CubeProvider, createCubeClient } from 'drizzle-cube/client'
import 'drizzle-cube/client/styles.css' // Required CSS (includes grid layout styles)

const config = {
  portlets: [
    {
      id: 'chart-1',
      title: 'Sales by Category',
      query: JSON.stringify({
        measures: ['Sales.total'],
        dimensions: ['Products.category']
      }),
      chartType: 'bar',
      chartConfig: {
        x: 'Products.category',
        y: ['Sales.total']
      },
      displayConfig: { showLegend: true },
      w: 6, h: 4, x: 0, y: 0
    }
  ],
  layouts: {}
}

function MyDashboard() {
  return (
    <AnalyticsDashboard
      config={config}
      apiUrl="/api/cube"
      editable={true}
      onConfigChange={(newConfig) => {
        // Save config changes
        console.log('Config updated:', newConfig)
      }}
    />
  )
}
```

## Individual Components

### AnalyticsPortlet

Single chart component:

```tsx
import { AnalyticsPortlet, CubeProvider, createCubeClient } from 'drizzle-cube/client'

const cubeApi = createCubeClient(undefined, { apiUrl: '/api/cube' })

function MyChart() {
  return (
    <CubeProvider cubeApi={cubeApi}>
      <AnalyticsPortlet
        query={JSON.stringify({
          measures: ['Orders.count'],
          dimensions: ['Orders.status']
        })}
        chartType="pie"
        chartConfig={{ x: 'Orders.status', y: ['Orders.count'] }}
        displayConfig={{ showLegend: true }}
        height={400}
      />
    </CubeProvider>
  )
}
```

### Chart Components

Use individual chart components directly:

```tsx
import { BarChart, LineChart, PieChart, DataTable } from 'drizzle-cube/client'

const data = [
  { category: 'A', value: 100 },
  { category: 'B', value: 200 }
]

function MyCharts() {
  return (
    <div>
      <BarChart 
        data={data} 
        chartConfig={{ x: 'category', y: ['value'] }}
        displayConfig={{ showLegend: false }}
        height={300}
      />
      
      <PieChart 
        data={data}
        chartConfig={{ x: 'category', y: ['value'] }}
        height={300}
      />
      
      <DataTable 
        data={data}
        height={300}
      />
    </div>
  )
}
```

## Chart Types

- `bar` - Bar Chart
- `line` - Line Chart  
- `area` - Area Chart
- `pie` - Pie Chart
- `table` - Data Table
- `scatter` - Scatter Plot
- `radar` - Radar Chart
- `radialBar` - Radial Bar Chart
- `treemap` - Tree Map

## Configuration

### ChartConfig

```tsx
interface ChartAxisConfig {
  x?: string        // X-axis field
  y?: string[]      // Y-axis fields
  series?: string   // Series grouping field
}
```

### DisplayConfig

```tsx
interface ChartDisplayConfig {
  showLegend?: boolean    // Show/hide legend
  showGrid?: boolean      // Show/hide grid lines
  showTooltip?: boolean   // Show/hide tooltips
  colors?: string[]       // Custom color palette
  stacked?: boolean       // Stack bars/areas
}
```

### PortletConfig

```tsx
interface PortletConfig {
  id: string
  title: string
  query: string           // JSON cube query
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  w: number              // Grid width (1-12)
  h: number              // Grid height
  x: number              // Grid X position
  y: number              // Grid Y position
}
```

## Styling

Components use Tailwind CSS classes. To customize:

```css
/* Override default colors */
.analytics-portlet {
  @apply border-blue-200 bg-blue-50;
}

/* Custom chart colors */
.recharts-wrapper .recharts-cartesian-grid line {
  @apply stroke-gray-200;
}
```

## API Integration

The client expects a Cube.js compatible API with these endpoints:

- `POST /cubejs-api/v1/load` - Execute queries
- `GET /cubejs-api/v1/meta` - Get cube metadata

See `drizzle-cube/adapters/hono` for server implementation.

### Keeping a query current (`subscribe`)

As in Cube.js, a query can subscribe to updates. Both forms refetch every 10 seconds with
`x-cache-max-age: 10`, so the server answers from a cached result no older than that and viewers in one
security context share one execution. Subscriptions do not need `features.refresh`.

```tsx
import { useCubeQuery, createCubeClient } from 'drizzle-cube/client'

// In a component: refetches while mounted and not skipped
const { resultSet } = useCubeQuery(query, { subscribe: true })

// Outside React: the callback gets the initial load, then each refetch (or the error of a failed one)
const cubeApi = createCubeClient(token, { apiUrl: '/cubejs-api/v1' })
const { unsubscribe } = cubeApi.subscribe(query, null, (error, resultSet) => {
  if (error) console.error(error)
  else render(resultSet)
})
unsubscribe() // stops refetching; a result still in flight is dropped
```

The 10-second interval is raised by `features.refresh.minIntervalSeconds` for the hook and by the client
option `minSubscribeIntervalSeconds` for `cubeApi.subscribe`, when either is larger. `manualRefresh` stops
hook subscriptions.

## Requirements

- React 18+
- Tailwind CSS configured in your app
- Import `drizzle-cube/client/styles.css` in your app

## Dependencies

- `recharts` - Charts
- `react-grid-layout` - Grid layout
- Tailwind CSS - Styling

## TypeScript

Full TypeScript support included. All components and utilities are typed.