# Bundle Optimization

Drizzle Cube is designed with bundle optimization in mind, providing modular architecture that allows you to import only what you need for optimal performance and smaller bundle sizes.

## Modular Architecture

The client is built with multiple entry points, allowing fine-grained control over what gets included in your bundle:

| Import Path | Size | Dependencies | Use Case |
|-------------|------|--------------|----------|
| `drizzle-cube/client` | Full bundle | All | Complete dashboard apps |
| `drizzle-cube/client/charts` | ~550 bytes + chunks | Recharts | Custom UI with charts |
| `drizzle-cube/client/hooks` | ~3.2KB | None | Headless data fetching |
| `drizzle-cube/client/providers` | ~190 bytes + chunks | None | Custom implementations |
| `drizzle-cube/client/components` | ~218KB | react-grid-layout | Dashboard UI without charts |
| `drizzle-cube/client/utils` | ~40 bytes | None | Helper functions only |

## Bundle Size Comparison

### Before Optimization (Traditional Approach)
```tsx
import { AnalyticsDashboard } from 'drizzle-cube/client';
// Bundle: ~1MB+ (includes everything)
```

### After Optimization (Modular Approach)
```tsx
// Charts only: ~550 bytes + Recharts chunk (~86KB)
import { RechartsBarChart } from 'drizzle-cube/client/charts';

// Hooks only: ~3.2KB
import { useCubeQuery } from 'drizzle-cube/client/hooks';

// Providers only: ~190 bytes + React chunk (~5.5KB)
import { CubeProvider } from 'drizzle-cube/client/providers';
```

**Result**: ~89KB total vs ~1MB+ (91% reduction)

## Optimization Strategies

### 1. Chart-Only Applications

Perfect for apps that need visualizations with custom UI:

```tsx
// package.json
{
  "dependencies": {
    "drizzle-cube": "^0.1.14",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.8.0"
    // No react-grid-layout needed
  }
}
```

```tsx
// App.tsx
import { RechartsBarChart, RechartsLineChart, RechartsAreaChart } from 'drizzle-cube/client/charts';
import { useCubeQuery } from 'drizzle-cube/client/hooks';
import { CubeProvider } from 'drizzle-cube/client/providers';

function CustomDashboard() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/api/cube' }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3>Sales by Category</h3>
          <ChartWithQuery 
            chart={RechartsBarChart}
            query={{ measures: ['Sales.revenue'], dimensions: ['Sales.category'] }}
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3>Trend Over Time</h3>
          <ChartWithQuery
            chart={RechartsLineChart}
            query={{ 
              measures: ['Sales.revenue'], 
              timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
            }}
          />
        </div>
      </div>
    </CubeProvider>
  );
}

function ChartWithQuery({ chart: Chart, query }) {
  const { data, isLoading } = useCubeQuery(query);
  if (isLoading) return <div>Loading...</div>;
  return <Chart data={data} chartConfig={{ x: Object.keys(data[0])[0], y: [Object.keys(data[0])[1]] }} />;
}
```

**Bundle savings**: ~800KB+ (no grid layout, no extra components)

### 2. Headless Data Applications

For completely custom UI implementations:

```tsx
// package.json - minimal dependencies
{
  "dependencies": {
    "drizzle-cube": "^0.1.14",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
    // No chart or layout dependencies
  }
}
```

```tsx
// App.tsx
import { useCubeQuery, useCubeMeta } from 'drizzle-cube/client/hooks';
import { CubeProvider } from 'drizzle-cube/client/providers';

function HeadlessAnalytics() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/api/cube' }}>
      <CustomMetrics />
      <CustomTable />
    </CubeProvider>
  );
}

function CustomMetrics() {
  const { data, isLoading } = useCubeQuery({
    measures: ['Sales.revenue', 'Sales.count'],
    dimensions: ['Sales.category']
  });

  if (isLoading) return <div>Loading metrics...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.map(row => (
        <div key={row.category} className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold">{row['Sales.category']}</h3>
          <p className="text-2xl">${row['Sales.revenue']}</p>
          <p className="text-sm text-gray-600">{row['Sales.count']} orders</p>
        </div>
      ))}
    </div>
  );
}
```

**Bundle savings**: ~950KB+ (no charts, no grid layout, no extra UI)

### 3. Mixed Approach

Combine modular imports for optimal bundle size:

```tsx
// Import only what you need
import { QueryBuilder } from 'drizzle-cube/client/components'; // Dashboard builder
import { RechartsBarChart, RechartsLineChart } from 'drizzle-cube/client/charts'; // Specific charts
import { useCubeQuery } from 'drizzle-cube/client/hooks'; // Data fetching
import { CubeProvider } from 'drizzle-cube/client/providers'; // Context

function MixedApp() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/api/cube' }}>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2>Query Builder</h2>
          <QueryBuilder />
        </div>
        <div>
          <h2>Custom Charts</h2>
          <CustomChartsPanel />
        </div>
      </div>
    </CubeProvider>
  );
}
```

**Bundle size**: Only includes QueryBuilder component + specific charts (saves ~200KB+ vs full import)

## Chunk Optimization

The build system automatically creates optimized chunks:

### Automatic Chunking
```
dist/client/
├── charts.js               # Chart entry point (~550 bytes)
├── hooks.js                # Hooks entry point (~3.2KB) 
├── providers.js            # Providers entry point (~190 bytes)
├── components.js           # Components entry point (~218KB)
├── chunks/
│   ├── recharts-[hash].js  # Recharts library (~86KB)
│   ├── layout-[hash].js    # react-grid-layout (~35KB)
│   ├── icons-[hash].js     # Icon libraries (~50KB)
│   └── providers-[hash].js # Shared providers (~5.5KB)
```

### Chunk Loading Strategy
- **Entry points** load immediately (small)
- **Heavy dependencies** load on demand (chunked)
- **Shared utilities** cached across components
- **Unused chunks** never loaded

## Performance Tips

### 1. Tree Shaking Configuration

Ensure your bundler (Vite, Webpack) is configured for optimal tree shaking:

```js
// vite.config.js
export default {
  build: {
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    }
  }
}
```

### 2. Dynamic Imports

Load chart components dynamically:

```tsx
import { lazy, Suspense } from 'react';

const RechartsBarChart = lazy(() => 
  import('drizzle-cube/client/charts').then(m => ({ default: m.RechartsBarChart }))
);

function LazyChart() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <RechartsBarChart data={data} config={config} />
    </Suspense>
  );
}
```

### 3. Selective CSS Imports

Import only the styles you need:

```tsx
// Full styles
import 'drizzle-cube/client/styles.css';

// Or configure Tailwind to purge unused styles
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // Tailwind will automatically purge unused classes
}
```

## Bundle Analysis

### Analyze Your Bundle

Use the included bundle analyzer:

```bash
npm run analyze:client
# Opens dist/client-bundle-stats.html in browser
```

### Measure Impact

Before optimization:
```bash
# Check bundle size
du -h dist/client/index.js
# 1.0M  dist/client/index.js
```

After modular imports:
```bash
# Check individual bundles  
du -h dist/client/*.js
# 216K  dist/client/components.js
#  4.0K  dist/client/hooks.js
#  4.0K  dist/client/charts.js
#  4.0K  dist/client/providers.js
```

## Migration Guide

### From Full Import to Modular

**Before:**
```tsx
import { 
  AnalyticsDashboard, 
  RechartsBarChart, 
  useCubeQuery, 
  CubeProvider 
} from 'drizzle-cube/client';
```

**After:**
```tsx
import { AnalyticsDashboard } from 'drizzle-cube/client/components';
import { RechartsBarChart } from 'drizzle-cube/client/charts';
import { useCubeQuery } from 'drizzle-cube/client/hooks';
import { CubeProvider } from 'drizzle-cube/client/providers';
```

**Result**: Same functionality, smaller bundle, better performance

### Gradual Migration

You can migrate gradually - both approaches work simultaneously:

```tsx
// Mixed imports work fine
import { AnalyticsDashboard } from 'drizzle-cube/client'; // Full import
import { RechartsBarChart } from 'drizzle-cube/client/charts'; // Modular import
```

The bundler will deduplicate shared code automatically.

## Best Practices

1. **Start with modular imports** for new applications
2. **Analyze your bundle** regularly to identify optimization opportunities  
3. **Use dynamic imports** for large chart libraries when possible
4. **Configure tree shaking** properly in your bundler
5. **Monitor bundle size** in CI/CD pipelines
6. **Profile loading performance** with different import strategies

## Troubleshooting

### Common Issues

**Duplicate React instances:**
```bash
# Ensure peer dependencies are properly installed
npm ls react react-dom
```

**Tree shaking not working:**
```js
// Check package.json sideEffects setting
{
  "sideEffects": false // Enables aggressive tree shaking
}
```

**Chunk loading errors:**
- Verify public path configuration
- Check CORS settings for chunk loading
- Ensure proper caching headers

### Performance Monitoring

Monitor bundle performance:

```tsx
// Add bundle performance monitoring
if (process.env.NODE_ENV === 'development') {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

The modular architecture of Drizzle Cube ensures you can build performant applications with optimal bundle sizes while maintaining full functionality.