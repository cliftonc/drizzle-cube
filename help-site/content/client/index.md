# React Client

The Drizzle Cube React client provides pre-built components and hooks for creating analytics dashboards and data visualizations with minimal code.

## Installation

```bash
npm install drizzle-cube react react-dom recharts react-grid-layout
```

## Quick Start

```tsx
import React from 'react';
import { CubeProvider, AnalyticsDashboard } from 'drizzle-cube/client';

function App() {
  const cubeApi = {
    url: '/api/cube',
    headers: {
      'Authorization': 'Bearer your-token',
      'X-Organisation-ID': '1'
    }
  };

  return (
    <CubeProvider cubeApi={cubeApi}>
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
  const cubeApi = {
    url: '/api/cube',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'X-Organisation-ID': '123'
    }
  };

  return (
    <CubeProvider cubeApi={cubeApi}>
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
  const { data, isLoading, error } = useCubeQuery({
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

  return (
    <div>
      <h2>Total Revenue: ${data.totalRevenue}</h2>
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

<CubeProvider cubeApi={cubeApi} theme={theme}>
  {/* Your components */}
</CubeProvider>
```

## Real-time Updates

### WebSocket Support

Enable real-time data updates:

```tsx
const cubeApi = {
  url: '/api/cube',
  websocketUrl: 'ws://localhost:3000/ws',
  headers: {
    'Authorization': 'Bearer token'
  }
};

<CubeProvider cubeApi={cubeApi}>
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