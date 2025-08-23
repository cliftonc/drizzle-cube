# React Client

The Drizzle Cube React client provides pre-built components and hooks for creating analytics dashboards and data visualizations with minimal code.

## Installation

```bash
npm install drizzle-cube react react-dom recharts react-grid-layout
```

### Dependencies & Requirements

**Required Dependencies:**
- `react` (^18.2.0) - React framework
- `react-dom` (^18.2.0) - React DOM rendering
- `recharts` (^2.8.0) - Chart visualization library
- `react-grid-layout` (^1.4.0) - Dashboard grid layout

**Optional Dependencies:**
- `@heroicons/react` (^2.2.0) - Icons used in components
- `@tanstack/react-query` (^5.0.0) - Data fetching and caching
- `react-router-dom` (^6.8.0) - Routing for multi-page dashboards

**Tailwind CSS v3 Required:**
Components are styled with Tailwind CSS v3 classes. You must have Tailwind CSS v3 configured in your project:

```bash
npm install -D tailwindcss postcss
```

Configure your `tailwind.config.js` to include the drizzle-cube components:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/drizzle-cube/dist/**/*.js', // Include drizzle-cube components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Modular Imports

The drizzle-cube client is built with modular architecture allowing you to import only what you need:

| Import Path | Size | Contents | Use Case |
|-------------|------|----------|----------|
| `drizzle-cube/client` | Full bundle | All components, hooks, charts | Complete dashboard apps |
| `drizzle-cube/client/charts` | ~550 bytes + chunks | Chart components only | Custom UI with charts |
| `drizzle-cube/client/hooks` | ~3.2KB | React hooks only | Headless data fetching |
| `drizzle-cube/client/providers` | ~190 bytes + chunks | Context providers only | Custom implementations |
| `drizzle-cube/client/components` | ~218KB | UI components (no charts) | Dashboard without charts |
| `drizzle-cube/client/utils` | ~40 bytes | Utility functions only | Helper functions |

### Chart-Only Import
Perfect for apps that need charts but want to build custom dashboards:

```tsx
import { RechartsBarChart, RechartsLineChart, RechartsAreaChart } from 'drizzle-cube/client/charts';
import { useCubeQuery } from 'drizzle-cube/client/hooks';
import { CubeProvider } from 'drizzle-cube/client/providers';

function CustomDashboard() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/api/cube' }}>
      <div className="grid grid-cols-2 gap-4">
        <RechartsBarChart 
          data={data} 
          chartConfig={{ x: 'category', y: ['revenue'] }}
        />
        <RechartsLineChart 
          data={timeData}
          chartConfig={{ x: 'date', y: ['sales'] }}
        />
      </div>
    </CubeProvider>
  );
}
```

### Hooks-Only Import
For completely custom UI implementations:

```tsx
import { useCubeQuery, useCubeMeta } from 'drizzle-cube/client/hooks';

function CustomAnalytics() {
  const { data, isLoading } = useCubeQuery({
    measures: ['Sales.revenue'],
    dimensions: ['Sales.category']
  });

  // Build your own UI with the data
  return (
    <div>
      {data?.map(row => (
        <div key={row.category}>
          {row.category}: ${row.revenue}
        </div>
      ))}
    </div>
  );
}
```

### Dependency Optimization
When using modular imports, you only need the dependencies for what you import:

```bash
# Full client - requires all dependencies
npm install drizzle-cube react react-dom recharts react-grid-layout

# Charts only - no grid layout needed
npm install drizzle-cube react react-dom recharts

# Hooks only - minimal dependencies
npm install drizzle-cube react react-dom

# Providers only - core functionality
npm install drizzle-cube react react-dom
```

### Usage Options

**Option 1: Full Import (All Features)**
```tsx
import { AnalyticsDashboard, CubeProvider } from 'drizzle-cube/client';
```

**Option 2: Modular Imports (Optimized Bundle Size)**
Import only what you need for smaller bundle sizes:

```tsx
// Charts only (~550 bytes + shared chunks)
import { RechartsBarChart, RechartsLineChart } from 'drizzle-cube/client/charts';

// Hooks only (~3.2KB)
import { useCubeQuery, useCubeMeta } from 'drizzle-cube/client/hooks';

// Providers only (~190 bytes + shared chunks)
import { CubeProvider, createCubeClient } from 'drizzle-cube/client/providers';

// UI Components without charts (~218KB)
import { QueryBuilder, AnalyticsDashboard } from 'drizzle-cube/client/components';

// Utilities only (~40 bytes)
import { formatChartData, validateCubeQuery } from 'drizzle-cube/client/utils';
```

**Option 3: Copy-Paste for Customization**
For more control over styling and behavior, you can copy component code from the complete example at `/examples/hono/client` in the repository or view the live version at [try.drizzle-cube.dev](https://try.drizzle-cube.dev).

## Quick Start

```tsx
import React from 'react';
import { CubeProvider, AnalyticsDashboard } from 'drizzle-cube/client';

function App() {
  return (
    <CubeProvider 
      apiOptions={{ 
        apiUrl: '/api/cube',
        headers: {
          'Authorization': 'your-token', // Token is used as-is, no 'Bearer' prefix needed
          'X-Organisation-ID': '1'
        }
      }}
    >
      <AnalyticsDashboard
        initialLayout={[
          {
            id: 'revenue-chart',
            title: 'Monthly Revenue',
            chartType: 'line',
            query: {
              measures: ['Sales.totalRevenue'],
              timeDimensions: [{
                dimension: 'Sales.orderDate',
                granularity: 'month'
              }]
            }
          }
        ]}
      />
    </CubeProvider>
  );
}
```

## Core Components

### CubeProvider

The foundation component that provides cube API context:

```tsx
import { CubeProvider } from 'drizzle-cube/client';

function App() {
  return (
    <CubeProvider 
      apiOptions={{
        apiUrl: '/api/cube',
        headers: {
          'Authorization': 'your-jwt-token', // Token is used as-is, no 'Bearer' prefix needed
          'X-Organisation-ID': '123'
        }
      }}
    >
      {/* Your dashboard components */}
    </CubeProvider>
  );
}
```

### AnalyticsDashboard

A complete dashboard with drag-and-drop layout:

```tsx
import { AnalyticsDashboard } from 'drizzle-cube/client';

<AnalyticsDashboard
  initialLayout={[
    {
      id: 'sales-overview',
      title: 'Sales Overview', 
      chartType: 'bar',
      query: {
        measures: ['Sales.totalRevenue', 'Sales.orderCount'],
        dimensions: ['Sales.productCategory']
      },
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'sales-trend',
      title: 'Sales Trend',
      chartType: 'line', 
      query: {
        measures: ['Sales.totalRevenue'],
        timeDimensions: [{
          dimension: 'Sales.orderDate',
          granularity: 'day'
        }]
      },
      layout: { x: 6, y: 0, w: 6, h: 4 }
    }
  ]}
  
  onLayoutChange={(layout) => {
    // Save layout to user preferences
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  }}
  
  showEditControls={true}
  allowResize={true}
  allowDrag={true}
/>
```

### AnalyticsPage

A complete page with sidebar filters and charts:

```tsx
import { AnalyticsPage } from 'drizzle-cube/client';

<AnalyticsPage
  title="Sales Analytics"
  description="Comprehensive sales performance metrics"
  
  filters={[
    {
      member: 'Sales.productCategory',
      title: 'Product Category',
      type: 'select'
    },
    {
      member: 'Sales.orderDate',
      title: 'Date Range', 
      type: 'dateRange'
    }
  ]}
  
  charts={[
    {
      id: 'revenue-by-category',
      title: 'Revenue by Category',
      chartType: 'pie',
      query: {
        measures: ['Sales.totalRevenue'],
        dimensions: ['Sales.productCategory']
      }
    }
  ]}
/>
```

### AnalyticsPortlet

Individual chart components:

```tsx
import { AnalyticsPortlet } from 'drizzle-cube/client';

<AnalyticsPortlet
  title="Monthly Sales Trend"
  chartType="line"
  query={{
    measures: ['Sales.totalRevenue'],
    timeDimensions: [{
      dimension: 'Sales.orderDate',
      granularity: 'month'
    }]
  }}
  
  showControls={true}
  allowExport={true}
  refreshInterval={30000} // Refresh every 30 seconds
  
  onDataLoad={(data) => {
    console.log('Chart data loaded:', data);
  }}
/>
```

### QueryBuilder

Interactive query builder:

```tsx
import { QueryBuilder } from 'drizzle-cube/client';

<QueryBuilder
  initialQuery={{
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.productCategory']
  }}
  
  // Optional: disable localStorage persistence
  disableLocalStorage={false}
  
  // Optional: hide settings panel
  hideSettings={false}
/>
```

**Note**: QueryBuilder now uses the CubeProvider context for API configuration. The settings panel allows dynamic URL/token changes.

**QueryBuilder Features:**
- **Interactive Cube Explorer**: Browse available cubes, measures, and dimensions
- **Drag & Drop Query Building**: Visual query construction interface  
- **API Configuration Panel**: Configure endpoint URL and authentication
- **Real-time Query Execution**: Execute queries and view results instantly
- **SQL Preview**: View generated SQL for debugging
- **Dry Run Mode**: Validate queries without execution

## Chart Types

### Line Charts
Perfect for time series data:

```tsx
<AnalyticsPortlet
  chartType="line"
  query={{
    measures: ['Sales.totalRevenue'],
    timeDimensions: [{ 
      dimension: 'Sales.orderDate', 
      granularity: 'day' 
    }]
  }}
/>
```

### Bar Charts  
Great for comparing categories:

```tsx
<AnalyticsPortlet
  chartType="bar"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory']
  }}
/>
```

### Pie Charts
Show proportions:

```tsx
<AnalyticsPortlet
  chartType="pie"
  query={{
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.region']
  }}
/>
```

### Data Tables
Detailed data views:

```tsx
<AnalyticsPortlet
  chartType="table"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.customerName', 'Sales.productCategory']
  }}
  
  pageSize={20}
  sortable={true}
  searchable={true}
/>
```

## Hooks

### useCubeQuery

Execute queries and get real-time data:

```tsx
import { useCubeQuery } from 'drizzle-cube/client';

function SalesMetric() {
  const { data, isLoading, error, resultSet } = useCubeQuery({
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.productCategory'],
    filters: [{
      member: 'Sales.orderDate',
      operator: 'inDateRange',
      values: ['2024-01-01', '2024-12-31']
    }]
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // The client automatically handles both old and new response formats
  // data contains the raw data array from results[0].data or legacy data field
  // resultSet provides access to the full Cube.js response structure

  return (
    <div>
      <h2>Total Revenue: ${data[0]?.['Sales.totalRevenue'] || 0}</h2>
      {/* Access annotation metadata */}
      <p>Query executed at: {resultSet?.annotation?.lastRefreshTime}</p>
      {/* Render your data */}
    </div>
  );
}
```

### useCubeMeta

Access cube metadata:

```tsx
import { useCubeMeta } from 'drizzle-cube/client';

function MetricSelector() {
  const { cubes, isLoading } = useCubeMeta();

  if (isLoading) return <div>Loading cubes...</div>;

  return (
    <select>
      {cubes.map(cube => 
        cube.measures.map(measure => (
          <option key={`${cube.name}.${measure.name}`} 
                  value={`${cube.name}.${measure.name}`}>
            {measure.title || measure.name}
          </option>
        ))
      )}
    </select>
  );
}
```

## Customization

### Custom Chart Components

Create your own visualizations:

```tsx
import { useCubeQuery } from 'drizzle-cube/client';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis } from 'recharts';

function CustomChart({ query }) {
  const { data, isLoading } = useCubeQuery(query);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <XAxis dataKey="Sales.orderDate" />
        <YAxis />
        <Bar dataKey="Sales.orderCount" fill="#8884d8" />
        <Line dataKey="Sales.totalRevenue" stroke="#82ca9d" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### Theme Customization

Customize the appearance:

```tsx
import { CubeProvider } from 'drizzle-cube/client';

const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b', 
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  fonts: {
    body: 'Inter, sans-serif',
    mono: 'Fira Code, monospace'
  }
};

<CubeProvider 
  apiOptions={{ apiUrl: '/api/cube' }}
  theme={theme}
>
  {/* Your components */}
</CubeProvider>
```

## Real-time Updates

### WebSocket Support

Enable real-time data updates:

```tsx
<CubeProvider 
  apiOptions={{
    apiUrl: '/api/cube',
    websocketUrl: 'ws://localhost:3000/ws',
    headers: {
      'Authorization': 'token' // Token is used as-is, no 'Bearer' prefix needed
    }
  }}
>
  <AnalyticsPortlet
    query={query}
    realtime={true}
    refreshInterval={5000}
  />
</CubeProvider>
```

### Manual Refresh

Trigger updates programmatically:

```tsx
import { useCubeQuery } from 'drizzle-cube/client';

function RefreshableChart() {
  const { data, isLoading, refetch } = useCubeQuery(query);

  return (
    <div>
      <button onClick={() => refetch()}>
        Refresh Data
      </button>
      {/* Chart content */}
    </div>
  );
}
```

## Error Handling

### Error Boundaries

Handle errors gracefully:

```tsx
import { ChartErrorBoundary } from 'drizzle-cube/client';

<ChartErrorBoundary
  fallback={({ error, resetError }) => (
    <div className="error-state">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  )}
>
  <AnalyticsPortlet query={query} />
</ChartErrorBoundary>
```

### Query Validation

Validate queries before execution:

```tsx
import { validateQuery } from 'drizzle-cube/client';

function QueryBuilder({ query, onChange }) {
  const validation = validateQuery(query);
  
  if (!validation.isValid) {
    return (
      <div className="validation-errors">
        {validation.errors.map(error => (
          <div key={error.field}>{error.message}</div>
        ))}
      </div>
    );
  }

  return <AnalyticsPortlet query={query} />;
}
```

## Performance Tips

### Query Optimization

- Use appropriate granularities for time dimensions
- Limit result sets with filters
- Cache frequently used queries

### Component Optimization

- Memoize expensive calculations
- Use React.memo for pure components
- Implement virtualization for large datasets

### Bundle Optimization

- Tree shake unused chart types
- Code split dashboard components
- Lazy load visualization libraries

## Next Steps

- [**Charts**](/help/client/charts) - Detailed chart documentation
- [**Dashboards**](/help/client/dashboards) - Dashboard customization  
- [**Hooks**](/help/client/hooks) - Advanced hook usage