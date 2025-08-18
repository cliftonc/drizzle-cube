const t=[{slug:"adapters/hono",title:"Hono Adapter",content:`<h1 id="hono-adapter" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Hono Adapter</h1><p class="mb-4 text-gray-600 leading-relaxed">The Hono adapter provides a complete Cube.js-compatible API for the [Hono](https://hono.dev) web framework, making it easy to add analytics capabilities to your Hono applications.</p><h2 id="installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Installation</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install drizzle-cube hono drizzle-orm</code></pre><h2 id="quick-start" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Quick Start</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { Hono } from 'hono';
import { createCubeApp } from 'drizzle-cube/adapters/hono';
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { salesCube } from './cubes';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create semantic layer
const databaseExecutor = createDatabaseExecutor(db, schema, 'postgres');
const semanticLayer = new SemanticLayerCompiler({ databaseExecutor });
semanticLayer.registerCube(salesCube);

// Create main Hono app
const app = new Hono();

// Authentication middleware
app.use('/api/cube/*', async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Validate token and set user context
  const user = await validateToken(token);
  c.set('user', user);
  await next();
});

// Create and mount Cube API
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const user = c.get('user');
    return {
      organisationId: user.organisationId,
      userId: user.id,
      roles: user.roles
    };
  }
});

app.route('/api/cube', cubeApp);

export default app;</code></pre><h2 id="configuration-options" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Configuration Options</h2><h3 id="basic-configuration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Basic Configuration</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // Required
  semanticLayer: semanticLayerInstance,
  drizzle: dbInstance,
  schema: schemaObject,
  getSecurityContext: async (c) => ({ /* context */ }),
  
  // Optional
  corsOptions: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  
  enablePlayground: process.env.NODE_ENV === 'development',
  
  queryTimeout: 30000, // 30 seconds
  
  onError: (error, c) => {
    console.error('Cube API Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});</code></pre><h3 id="advanced-configuration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Advanced Configuration</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  
  getSecurityContext: async (c) => {
    const user = c.get('user');
    const tenant = c.req.header('X-Tenant-ID');
    
    return {
      organisationId: parseInt(tenant!),
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      // Custom context
      region: user.region,
      hasRole: (role: string) => user.roles.includes(role)
    };
  },
  
  // Custom middleware for all cube routes
  middleware: [
    // Rate limiting
    async (c, next) => {
      const userId = c.get('user')?.id;
      if (await isRateLimited(userId)) {
        return c.json({ error: 'Rate limited' }, 429);
      }
      await next();
    },
    
    // Audit logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      
      await logQuery({
        userId: c.get('user')?.id,
        path: c.req.path,
        duration,
        status: c.res.status
      });
    }
  ],
  
  // Transform queries before execution
  queryTransform: async (query, context) => {
    // Add automatic filters based on user
    if (context.hasRole('sales')) {
      query.filters = query.filters || [];
      query.filters.push({
        member: 'Sales.salesPersonId',
        operator: 'equals',
        values: [context.userId.toString()]
      });
    }
    
    return query;
  }
});</code></pre><h2 id="api-endpoints" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">API Endpoints</h2><p class="mb-4 text-gray-600 leading-relaxed">The Hono adapter provides these Cube.js-compatible endpoints:</p><h3 id="load-data" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Load Data</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/load
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"],
    "timeDimensions": [{
      "dimension": "Sales.orderDate",
      "granularity": "month"
    }]
  }
}</code></pre><h3 id="get-metadata" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Get Metadata</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">GET /api/cube/meta</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Returns available cubes, dimensions, and measures.</p><h3 id="execute-sql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Execute SQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/sql
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"]
  }
}</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Returns the generated SQL without executing it.</p><h3 id="query-validation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Validation</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/validate
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["InvalidDimension"]
  }
}</code></pre><h2 id="security-context" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Context</h2><p class="mb-4 text-gray-600 leading-relaxed">The \`getSecurityContext\` function is crucial for multi-tenant security:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">getSecurityContext: async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const user = await verifyJWT(token);
  
  // Extract tenant from subdomain
  const host = c.req.header('Host');
  const subdomain = host?.split('.')[0];
  const tenant = await getTenantBySubdomain(subdomain);
  
  return {
    organisationId: tenant.id,
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions,
    
    // Custom helpers
    hasRole: (role: string) => user.roles.includes(role),
    hasPermission: (permission: string) => user.permissions.includes(permission),
    
    // Regional filtering
    region: user.region,
    allowedRegions: user.allowedRegions
  };
}</code></pre><h2 id="authentication-patterns" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Authentication Patterns</h2><h3 id="jwt-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">JWT Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { jwt } from 'hono/jwt';

app.use('/api/cube/*', jwt({
  secret: process.env.JWT_SECRET!,
  cookie: 'auth-token' // Optional: read from cookie
}));

app.use('/api/cube/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  const user = await getUserById(payload.sub);
  c.set('user', user);
  await next();
});</code></pre><h3 id="api-key-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">API Key Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">app.use('/api/cube/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }
  
  const client = await validateApiKey(apiKey);
  if (!client) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  c.set('client', client);
  await next();
});</code></pre><h3 id="session-based-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Session-based Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { getCookie } from 'hono/cookie';

app.use('/api/cube/*', async (c, next) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await getSession(sessionId);
  if (!session || session.expired) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  c.set('user', session.user);
  await next();
});</code></pre><h2 id="error-handling" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Error Handling</h2><h3 id="custom-error-handler" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Error Handler</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  
  onError: (error, c) => {
    console.error('Cube API Error:', {
      error: error.message,
      stack: error.stack,
      user: c.get('user')?.id,
      query: c.req.json(),
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to clients
    if (process.env.NODE_ENV === 'production') {
      return c.json({ 
        error: 'An error occurred processing your request',
        requestId: generateRequestId()
      }, 500);
    }
    
    return c.json({ 
      error: error.message,
      stack: error.stack
    }, 500);
  }
});</code></pre><h3 id="query-timeout" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Timeout</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  queryTimeout: 60000, // 60 seconds
  
  onTimeout: (c) => {
    return c.json({
      error: 'Query timeout',
      message: 'The query took too long to execute. Try reducing the date range or adding filters.'
    }, 408);
  }
});</code></pre><h2 id="caching" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Caching</h2><h3 id="query-result-caching" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Result Caching</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { cache } from 'hono/cache';

// Cache GET requests for 5 minutes
app.get('/api/cube/meta', cache({
  cacheName: 'cube-meta',
  cacheControl: 'max-age=300'
}));

// Custom caching logic
app.use('/api/cube/load', async (c, next) => {
  const query = await c.req.json();
  const cacheKey = generateCacheKey(query, c.get('user'));
  
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return c.json(cached);
  }
  
  await next();
  
  // Cache the response
  const response = await c.res.json();
  await setCache(cacheKey, response, 300); // 5 minutes
});</code></pre><h2 id="development-tools" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Development Tools</h2><h3 id="cube-playground" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cube Playground</h3><p class="mb-4 text-gray-600 leading-relaxed">Enable the playground in development:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  enablePlayground: process.env.NODE_ENV === 'development'
});

// Access at: http://localhost:3000/api/cube/playground</code></pre><h3 id="query-logging" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Logging</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">app.use('/api/cube/*', async (c, next) => {
  if (process.env.NODE_ENV === 'development') {
    const query = c.req.method === 'POST' ? await c.req.json() : null;
    console.log('Cube Query:', {
      method: c.req.method,
      path: c.req.path,
      query,
      user: c.get('user')?.id
    });
  }
  
  await next();
});</code></pre><h2 id="deployment" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Deployment</h2><h3 id="cloudflare-workers" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cloudflare Workers</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/worker.ts
import app from './server';

export default {
  fetch: app.fetch
};

// wrangler.toml
[env.production]
vars = { NODE_ENV = "production" }

[[env.production.bindings]]
name = "DATABASE_URL"
type = "secret"</code></pre><h3 id="nodejs-server" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Node.js Server</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { serve } from '@hono/node-server';
import app from './server';

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port: Number(port)
});

console.log(\`Server running on port \${port}\`);</code></pre><h3 id="vercel" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Vercel</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// api/cube/[...path].ts
import { handle } from '@hono/vercel';
import app from '../../src/server';

export default handle(app);</code></pre><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"adapters/hono.md"},{slug:"client",title:"React Client",content:`<h1 id="react-client" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">React Client</h1><p class="mb-4 text-gray-600 leading-relaxed">The Drizzle Cube React client provides pre-built components and hooks for creating analytics dashboards and data visualizations with minimal code.</p><h2 id="installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Installation</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install drizzle-cube react react-dom recharts react-grid-layout</code></pre><h2 id="quick-start" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Quick Start</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import React from 'react';
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
}</code></pre><h2 id="core-components" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Core Components</h2><h3 id="cubeprovider" class="text-2xl font-medium text-gray-700 mt-6 mb-3">CubeProvider</h3><p class="mb-4 text-gray-600 leading-relaxed">The foundation component that provides cube API context:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { CubeProvider } from 'drizzle-cube/client';

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
}</code></pre><h3 id="analyticsdashboard" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsDashboard</h3><p class="mb-4 text-gray-600 leading-relaxed">A complete dashboard with drag-and-drop layout:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsDashboard } from 'drizzle-cube/client';

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
/></code></pre><h3 id="analyticspage" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsPage</h3><p class="mb-4 text-gray-600 leading-relaxed">A complete page with sidebar filters and charts:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsPage } from 'drizzle-cube/client';

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
/></code></pre><h3 id="analyticsportlet" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsPortlet</h3><p class="mb-4 text-gray-600 leading-relaxed">Individual chart components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsPortlet } from 'drizzle-cube/client';

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
/></code></pre><h2 id="chart-types" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Chart Types</h2><h3 id="line-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Line Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Perfect for time series data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="line"
  query={{
    measures: ['Sales.totalRevenue'],
    timeDimensions: [{ 
      dimension: 'Sales.orderDate', 
      granularity: 'day' 
    }]
  }}
/></code></pre><h3 id="bar-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Bar Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Great for comparing categories:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="bar"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory']
  }}
/></code></pre><h3 id="pie-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Pie Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Show proportions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="pie"
  query={{
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.region']
  }}
/></code></pre><h3 id="data-tables" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Data Tables</h3><p class="mb-4 text-gray-600 leading-relaxed">Detailed data views:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="table"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.customerName', 'Sales.productCategory']
  }}
  
  pageSize={20}
  sortable={true}
  searchable={true}
/></code></pre><h2 id="hooks" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Hooks</h2><h3 id="usecubequery" class="text-2xl font-medium text-gray-700 mt-6 mb-3">useCubeQuery</h3><p class="mb-4 text-gray-600 leading-relaxed">Execute queries and get real-time data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';

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
      <h2>Total Revenue: \${data.totalRevenue}</h2>
      {/* Render your data */}
    </div>
  );
}</code></pre><h3 id="usecubemeta" class="text-2xl font-medium text-gray-700 mt-6 mb-3">useCubeMeta</h3><p class="mb-4 text-gray-600 leading-relaxed">Access cube metadata:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeMeta } from 'drizzle-cube/client';

function MetricSelector() {
  const { cubes, isLoading } = useCubeMeta();

  if (isLoading) return <div>Loading cubes...</div>;

  return (
    <select>
      {cubes.map(cube => 
        cube.measures.map(measure => (
          <option key={\`\${cube.name}.\${measure.name}\`} 
                  value={\`\${cube.name}.\${measure.name}\`}>
            {measure.title || measure.name}
          </option>
        ))
      )}
    </select>
  );
}</code></pre><h2 id="customization" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Customization</h2><h3 id="custom-chart-components" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Chart Components</h3><p class="mb-4 text-gray-600 leading-relaxed">Create your own visualizations:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';
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
}</code></pre><h3 id="theme-customization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Theme Customization</h3><p class="mb-4 text-gray-600 leading-relaxed">Customize the appearance:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { CubeProvider } from 'drizzle-cube/client';

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
</CubeProvider></code></pre><h2 id="real-time-updates" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Real-time Updates</h2><h3 id="websocket-support" class="text-2xl font-medium text-gray-700 mt-6 mb-3">WebSocket Support</h3><p class="mb-4 text-gray-600 leading-relaxed">Enable real-time data updates:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">const cubeApi = {
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
</CubeProvider></code></pre><h3 id="manual-refresh" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Manual Refresh</h3><p class="mb-4 text-gray-600 leading-relaxed">Trigger updates programmatically:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';

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
}</code></pre><h2 id="error-handling" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Error Handling</h2><h3 id="error-boundaries" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Error Boundaries</h3><p class="mb-4 text-gray-600 leading-relaxed">Handle errors gracefully:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { ChartErrorBoundary } from 'drizzle-cube/client';

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
</ChartErrorBoundary></code></pre><h3 id="query-validation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Validation</h3><p class="mb-4 text-gray-600 leading-relaxed">Validate queries before execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { validateQuery } from 'drizzle-cube/client';

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
}</code></pre><h2 id="performance-tips" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Performance Tips</h2><h3 id="query-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="component-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Component Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="bundle-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Bundle Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"client/index.md"},{slug:"getting-started",title:"Getting Started with Drizzle Cube",content:`<h1 id="getting-started-with-drizzle-cube" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Getting Started with Drizzle Cube</h1><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube is a **Drizzle ORM-first semantic layer** with Cube.js compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.</p><h2 id="what-is-drizzle-cube" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What is Drizzle Cube?</h2><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube bridges the gap between your database and your analytics applications by providing:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]</ul><h2 id="core-concepts" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Core Concepts</h2><h3 id="semantic-layer" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Semantic Layer</h3><p class="mb-4 text-gray-600 leading-relaxed">The semantic layer is where you define your business logic and data models. Instead of writing raw SQL queries throughout your application, you define **cubes** that encapsulate your data models.</p><h3 id="cubes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cubes</h3><p class="mb-4 text-gray-600 leading-relaxed">Cubes are the building blocks of your semantic layer. Each cube represents a table or a set of joined tables with defined dimensions and measures.</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    productName: { 
      sql: schema.sales.productName, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.sales.orderDate, 
      type: 'time' 
    }
  },
  
  measures: {
    totalSales: { 
      sql: schema.sales.amount, 
      type: 'sum' 
    },
    orderCount: { 
      sql: schema.sales.id, 
      type: 'count' 
    }
  }
});</code></pre><h3 id="dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Dimensions are attributes of your data that you can filter, group, and segment by. They are typically categorical data like product names, dates, or customer segments.</p><h3 id="measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">Measures are the quantitative values you want to analyze - things like revenue, count of orders, average order value, etc.</p><h2 id="architecture" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Architecture</h2><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube follows a **Drizzle-first architecture**:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ol><h2 id="security-model" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Model</h2><p class="mb-4 text-gray-600 leading-relaxed">Security is built into every layer:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Ready to get started? Here's what to do next:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ol><h2 id="example-applications" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Example Applications</h2><p class="mb-4 text-gray-600 leading-relaxed">Check out these example implementations:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="community-and-support" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Community and Support</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"getting-started/index.md"},{slug:"getting-started/concepts",title:"Core Concepts",content:`<h1 id="core-concepts" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Core Concepts</h1><p class="mb-4 text-gray-600 leading-relaxed">Understanding the fundamental concepts of Drizzle Cube is essential for building effective semantic layers. This guide covers the key concepts you'll work with.</p><h2 id="semantic-layer-overview" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Semantic Layer Overview</h2><p class="mb-4 text-gray-600 leading-relaxed">A **semantic layer** sits between your database and your analytics applications. It provides a business-friendly abstraction over your raw data, allowing you to:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="cubes" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Cubes</h2><p class="mb-4 text-gray-600 leading-relaxed">**Cubes** are the core building blocks of your semantic layer. Each cube represents a logical business entity (like Sales, Users, Products) and contains:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h3 id="basic-cube-structure" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Basic Cube Structure</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    // Categorical data
  },
  
  measures: {
    // Numeric aggregations
  }
});</code></pre><h3 id="security-context" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Security Context</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube **must** include security filtering to ensure multi-tenant isolation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// ✅ Good - includes security context
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))

// ❌ Bad - no security filtering
sql: ({ db }) => db.select().from(schema.sales)</code></pre><h2 id="dimensions" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Dimensions</h2><p class="mb-4 text-gray-600 leading-relaxed">**Dimensions** are the attributes of your data that you can:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="dimension-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimension Types</h3><h4 id="string-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">String Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Categorical text data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  customerName: { 
    sql: schema.sales.customerName, 
    type: 'string' 
  },
  productCategory: { 
    sql: schema.products.category, 
    type: 'string' 
  }
}</code></pre><h4 id="time-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">Time Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Date and timestamp fields:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  orderDate: { 
    sql: schema.sales.orderDate, 
    type: 'time' 
  },
  createdAt: { 
    sql: schema.users.createdAt, 
    type: 'time' 
  }
}</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Time dimensions support automatic granularity:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]</ul><h4 id="number-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">Number Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Numeric values used as categories:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  quantity: { 
    sql: schema.sales.quantity, 
    type: 'number' 
  },
  userId: { 
    sql: schema.sessions.userId, 
    type: 'number' 
  }
}</code></pre><h3 id="computed-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Computed Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">You can create computed dimensions using SQL expressions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  fullName: {
    sql: sql\`CONCAT(\${schema.users.firstName}, ' ', \${schema.users.lastName})\`,
    type: 'string',
    title: 'Full Name'
  },
  ageGroup: {
    sql: sql\`
      CASE 
        WHEN age < 18 THEN 'Under 18'
        WHEN age < 35 THEN '18-34'
        WHEN age < 55 THEN '35-54'
        ELSE '55+'
      END
    \`,
    type: 'string',
    title: 'Age Group'
  }
}</code></pre><h2 id="measures" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Measures</h2><p class="mb-4 text-gray-600 leading-relaxed">**Measures** are the numeric values you want to analyze. They represent aggregated data and support various aggregation types.</p><h3 id="aggregation-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Aggregation Types</h3><h4 id="count" class="text-xl font-medium text-gray-700 mt-4 mb-2">Count</h4><p class="mb-4 text-gray-600 leading-relaxed">Count the number of rows:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  orderCount: { 
    sql: schema.sales.id, 
    type: 'count',
    title: 'Total Orders'
  }
}</code></pre><h4 id="sum" class="text-xl font-medium text-gray-700 mt-4 mb-2">Sum</h4><p class="mb-4 text-gray-600 leading-relaxed">Add up numeric values:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  totalRevenue: { 
    sql: schema.sales.amount, 
    type: 'sum',
    title: 'Total Revenue'
  }
}</code></pre><h4 id="average" class="text-xl font-medium text-gray-700 mt-4 mb-2">Average</h4><p class="mb-4 text-gray-600 leading-relaxed">Calculate the mean value:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  averageOrderValue: { 
    sql: schema.sales.amount, 
    type: 'avg',
    title: 'Average Order Value'
  }
}</code></pre><h4 id="minmax" class="text-xl font-medium text-gray-700 mt-4 mb-2">Min/Max</h4><p class="mb-4 text-gray-600 leading-relaxed">Find minimum or maximum values:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  minOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'min',
    title: 'Smallest Order'
  },
  maxOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'max', 
    title: 'Largest Order'
  }
}</code></pre><h3 id="custom-measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">Create complex calculations using SQL expressions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  profitMargin: {
    sql: sql\`(\${schema.sales.amount} - \${schema.sales.cost}) / \${schema.sales.amount} * 100\`,
    type: 'avg',
    title: 'Profit Margin %',
    format: 'percent'
  },
  
  conversionRate: {
    sql: sql\`
      COUNT(CASE WHEN \${schema.events.type} = 'purchase' THEN 1 END) * 100.0 / 
      COUNT(CASE WHEN \${schema.events.type} = 'visit' THEN 1 END)
    \`,
    type: 'number',
    title: 'Conversion Rate %'
  }
}</code></pre><h2 id="data-types-and-formats" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Data Types and Formats</h2><h3 id="dimension-data-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimension Data Types</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h3 id="measure-formats" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measure Formats</h3><p class="mb-4 text-gray-600 leading-relaxed">Control how measures are displayed:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  revenue: {
    sql: schema.sales.amount,
    type: 'sum',
    format: 'currency' // $1,234.56
  },
  
  growth: {
    sql: schema.metrics.growth,
    type: 'avg',
    format: 'percent' // 12.3%
  }
}</code></pre><h2 id="query-structure" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Query Structure</h2><p class="mb-4 text-gray-600 leading-relaxed">When querying cubes, you specify:</p><h3 id="measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">What you want to calculate:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "measures": ["Sales.totalRevenue", "Sales.orderCount"]
}</code></pre><h3 id="dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">How you want to group/filter the data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "dimensions": ["Sales.productCategory", "Sales.customerName"]
}</code></pre><h3 id="time-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Time Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Time-based grouping with granularity:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "timeDimensions": [{
    "dimension": "Sales.orderDate",
    "granularity": "month"
  }]
}</code></pre><h3 id="filters" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Filters</h3><p class="mb-4 text-gray-600 leading-relaxed">Restrict the data returned:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "filters": [
    {
      "member": "Sales.productCategory",
      "operator": "equals",
      "values": ["Electronics"]
    },
    {
      "member": "Sales.orderDate",
      "operator": "inDateRange", 
      "values": ["2024-01-01", "2024-12-31"]
    }
  ]
}</code></pre><h2 id="security-and-multi-tenancy" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security and Multi-tenancy</h2><h3 id="organisation-based-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Organisation-based Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube should filter by organisation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))</code></pre><h3 id="row-level-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Row-level Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Filter based on user permissions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(and(
      eq(schema.sales.organisationId, securityContext.organisationId),
      eq(schema.sales.salesPersonId, securityContext.userId) // User can only see their sales
    ))</code></pre><h3 id="column-level-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Column-level Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Conditionally include sensitive data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  customerEmail: {
    sql: securityContext.hasRole('admin') 
      ? schema.customers.email 
      : sql\`'[HIDDEN]'\`,
    type: 'string'
  }
}</code></pre><h2 id="best-practices" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Best Practices</h2><h3 id="naming-conventions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Naming Conventions</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="performance" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Performance</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="documentation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Documentation</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Now that you understand the core concepts:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ol>`,path:"getting-started/concepts.md"},{slug:"getting-started/installation",title:"Installation",content:`<h1 id="installation" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Installation</h1><p class="mb-4 text-gray-600 leading-relaxed">Get Drizzle Cube up and running in your project in just a few steps.</p><h2 id="requirements" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Requirements</h2><p class="mb-4 text-gray-600 leading-relaxed">Before installing Drizzle Cube, make sure you have:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="package-installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Package Installation</h2><p class="mb-4 text-gray-600 leading-relaxed">Install Drizzle Cube using your preferred package manager:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash"># npm
npm install drizzle-cube drizzle-orm

# yarn
yarn add drizzle-cube drizzle-orm

# pnpm
pnpm add drizzle-cube drizzle-orm</code></pre><h2 id="database-setup" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Database Setup</h2><h3 id="postgresql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">PostgreSQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install postgres
# or for Neon serverless
npm install @neondatabase/serverless</code></pre><h3 id="mysql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">MySQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install mysql2</code></pre><h3 id="sqlite" class="text-2xl font-medium text-gray-700 mt-6 mb-3">SQLite</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install better-sqlite3</code></pre><h2 id="framework-adapters" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Framework Adapters</h2><p class="mb-4 text-gray-600 leading-relaxed">Choose the adapter for your web framework:</p><h3 id="hono-recommended" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Hono (Recommended)</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install hono</code></pre><h3 id="custom-framework" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Framework</h3><p class="mb-4 text-gray-600 leading-relaxed">You can create custom adapters for other frameworks. See [Custom Adapters](/help/adapters/custom) for details.</p><h2 id="react-components-optional" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">React Components (Optional)</h2><p class="mb-4 text-gray-600 leading-relaxed">For dashboard and chart components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install react react-dom recharts react-grid-layout</code></pre><h2 id="typescript-configuration" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">TypeScript Configuration</h2><p class="mb-4 text-gray-600 leading-relaxed">Update your \`tsconfig.json\` to include proper module resolution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}</code></pre><h2 id="project-structure" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Project Structure</h2><p class="mb-4 text-gray-600 leading-relaxed">Here's the recommended project structure:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">your-project/
├── src/
│   ├── schema.ts              # Drizzle schema definition
│   ├── cubes.ts               # Semantic layer cubes
│   ├── server.ts              # Server setup with adapter
│   └── client/                # React components (optional)
│       ├── components/
│       └── pages/
├── drizzle.config.ts          # Drizzle configuration
├── package.json
└── tsconfig.json</code></pre><h2 id="environment-variables" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Environment Variables</h2><p class="mb-4 text-gray-600 leading-relaxed">Create a \`.env\` file with your database connection details:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-env"># PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="file:./dev.db"</code></pre><h2 id="verification" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Verification</h2><p class="mb-4 text-gray-600 leading-relaxed">Create a simple test file to verify your installation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// test.ts
import { createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const executor = createDatabaseExecutor(db, {}, 'postgres');
console.log('✅ Drizzle Cube installed successfully!');</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Run the test:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npx tsx test.ts</code></pre><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Now that Drizzle Cube is installed, you can:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ol><h2 id="troubleshooting" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Troubleshooting</h2><h3 id="common-issues" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Common Issues</h3><p class="mb-4 text-gray-600 leading-relaxed">**Module not found errors**</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">**Database connection issues**  </p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">**TypeScript compilation errors**</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">Need more help? Check our [Troubleshooting Guide](/help/advanced/troubleshooting) or [report an issue](https://github.com/cliftonc/drizzle-cube/issues).</p>`,path:"getting-started/installation.md"},{slug:"getting-started/quick-start",title:"Quick Start",content:`<h1 id="quick-start" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Quick Start</h1><p class="mb-4 text-gray-600 leading-relaxed">Build your first semantic layer with Drizzle Cube in under 10 minutes.</p><h2 id="step-1-database-schema" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 1: Database Schema</h2><p class="mb-4 text-gray-600 leading-relaxed">First, define your database schema using Drizzle ORM:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/schema.ts
import { pgTable, serial, text, timestamp, decimal, integer } from 'drizzle-orm/pg-core';

export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').references(() => organisations.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').references(() => organisations.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  orderDate: timestamp('order_date').defaultNow(),
  customerName: text('customer_name'),
});</code></pre><h2 id="step-2-define-cubes" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 2: Define Cubes</h2><p class="mb-4 text-gray-600 leading-relaxed">Create your semantic layer by defining cubes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/cubes.ts
import { defineCube } from 'drizzle-cube/server';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    customerName: { 
      sql: schema.sales.customerName, 
      type: 'string' 
    },
    productName: { 
      sql: schema.products.name, 
      type: 'string' 
    },
    productCategory: { 
      sql: schema.products.category, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.sales.orderDate, 
      type: 'time' 
    },
  },
  
  measures: {
    totalSales: { 
      sql: schema.sales.amount, 
      type: 'sum',
      title: 'Total Sales'
    },
    orderCount: { 
      sql: schema.sales.id, 
      type: 'count',
      title: 'Number of Orders'
    },
    averageOrderValue: { 
      sql: schema.sales.amount, 
      type: 'avg',
      title: 'Average Order Value'
    },
    totalQuantity: { 
      sql: schema.sales.quantity, 
      type: 'sum',
      title: 'Total Quantity Sold'
    },
  }
});

export const productsCube = defineCube(schema, {
  name: 'Products',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.products)
      .where(eq(schema.products.organisationId, securityContext.organisationId)),
  
  dimensions: {
    name: { 
      sql: schema.products.name, 
      type: 'string' 
    },
    category: { 
      sql: schema.products.category, 
      type: 'string' 
    },
    createdAt: { 
      sql: schema.products.createdAt, 
      type: 'time' 
    },
  },
  
  measures: {
    count: { 
      sql: schema.products.id, 
      type: 'count',
      title: 'Product Count'
    },
    averagePrice: { 
      sql: schema.products.price, 
      type: 'avg',
      title: 'Average Price'
    },
  }
});</code></pre><h2 id="step-3-server-setup" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 3: Server Setup</h2><p class="mb-4 text-gray-600 leading-relaxed">Set up your server with the Hono adapter:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/server.ts
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createCubeApp } from 'drizzle-cube/adapters/hono';
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server';
import * as schema from './schema';
import { salesCube, productsCube } from './cubes';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create semantic layer
const databaseExecutor = createDatabaseExecutor(db, schema, 'postgres');
const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor 
});

// Register cubes
semanticLayer.registerCube(salesCube);
semanticLayer.registerCube(productsCube);

// Create Hono app
const app = new Hono();

// Add authentication middleware (example)
app.use('/api/cube/*', async (c, next) => {
  // In a real app, validate JWT token, session, etc.
  const orgId = c.req.header('X-Organisation-ID');
  if (!orgId) {
    return c.json({ error: 'Organisation ID required' }, 401);
  }
  c.set('organisationId', parseInt(orgId));
  await next();
});

// Mount Cube API
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => ({
    organisationId: c.get('organisationId')
  })
});

app.route('/api/cube', cubeApp);

export default app;</code></pre><h2 id="step-4-query-your-data" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 4: Query Your Data</h2><p class="mb-4 text-gray-600 leading-relaxed">Now you can query your semantic layer:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Query example
const query = {
  measures: ['Sales.totalSales', 'Sales.orderCount'],
  dimensions: ['Sales.productCategory'],
  timeDimensions: [{
    dimension: 'Sales.orderDate',
    granularity: 'month'
  }],
  filters: [{
    member: 'Sales.orderDate',
    operator: 'inDateRange',
    values: ['2024-01-01', '2024-12-31']
  }]
};

// Make request to your API
const response = await fetch('/api/cube/load', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Organisation-ID': '1'
  },
  body: JSON.stringify({ query })
});

const data = await response.json();
console.log(data);</code></pre><h2 id="step-5-react-dashboard-optional" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 5: React Dashboard (Optional)</h2><p class="mb-4 text-gray-600 leading-relaxed">Add a React dashboard using Drizzle Cube's components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">// src/Dashboard.tsx
import React from 'react';
import { CubeProvider } from 'drizzle-cube/client';
import { AnalyticsDashboard } from 'drizzle-cube/client';

const Dashboard: React.FC = () => {
  const cubeApi = {
    url: '/api/cube',
    headers: {
      'X-Organisation-ID': '1'
    }
  };

  return (
    <CubeProvider cubeApi={cubeApi}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
        
        <AnalyticsDashboard
          initialLayout={[
            {
              id: 'sales-by-category',
              title: 'Sales by Category',
              chartType: 'bar',
              query: {
                measures: ['Sales.totalSales'],
                dimensions: ['Sales.productCategory']
              }
            },
            {
              id: 'sales-over-time',
              title: 'Sales Over Time',
              chartType: 'line',
              query: {
                measures: ['Sales.totalSales'],
                timeDimensions: [{
                  dimension: 'Sales.orderDate',
                  granularity: 'month'
                }]
              }
            }
          ]}
        />
      </div>
    </CubeProvider>
  );
};

export default Dashboard;</code></pre><h2 id="whats-next" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What's Next?</h2><p class="mb-4 text-gray-600 leading-relaxed">Congratulations! You've created your first semantic layer with Drizzle Cube. Here's what you can explore next:</p><h3 id="learn-more" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Learn More</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="explore-components" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Explore Components</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="advanced-features" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Advanced Features</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="example-projects" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Example Projects</h2><p class="mb-4 text-gray-600 leading-relaxed">Check out complete example implementations:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">Need help? [Join our community](https://github.com/cliftonc/drizzle-cube/discussions) or [report issues](https://github.com/cliftonc/drizzle-cube/issues)!</p>`,path:"getting-started/quick-start.md"},{slug:"semantic-layer",title:"Semantic Layer",content:`<h1 id="semantic-layer" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Semantic Layer</h1><p class="mb-4 text-gray-600 leading-relaxed">The semantic layer is the heart of Drizzle Cube. It provides a business-friendly abstraction over your database that enables consistent, secure, and performant analytics across your organization.</p><h2 id="what-is-a-semantic-layer" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What is a Semantic Layer?</h2><p class="mb-4 text-gray-600 leading-relaxed">A semantic layer is a **business representation** of your data that:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="architecture-overview" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Architecture Overview</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Applications  │────│  Semantic Layer  │────│    Database     │
│                 │    │                  │    │                 │
│ • Dashboards    │    │ • Cubes         │    │ • Tables        │
│ • Reports       │    │ • Dimensions    │    │ • Views         │
│ • APIs          │    │ • Measures      │    │ • Indexes       │
└─────────────────┘    └──────────────────┘    └─────────────────┘</code></pre><h2 id="key-components" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Key Components</h2><h3 id="cubes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cubes</h3><p class="mb-4 text-gray-600 leading-relaxed">Business entities that represent your data models:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  title: 'Sales Transactions',
  description: 'All sales transactions with product and customer information',
  
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: { /* ... */ },
  measures: { /* ... */ }
});</code></pre><h3 id="database-executor" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Database Executor</h3><p class="mb-4 text-gray-600 leading-relaxed">Handles different database engines:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const executor = createDatabaseExecutor(db, schema, 'postgres');
// Supports: 'postgres', 'mysql', 'sqlite'</code></pre><h3 id="semantic-layer-compiler" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Semantic Layer Compiler</h3><p class="mb-4 text-gray-600 leading-relaxed">Orchestrates cubes and query execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor: executor 
});

semanticLayer.registerCube(salesCube);
semanticLayer.registerCube(productsCube);
semanticLayer.registerCube(customersCube);</code></pre><h2 id="advanced-features" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Advanced Features</h2><h3 id="multi-cube-queries" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Multi-Cube Queries</h3><p class="mb-4 text-gray-600 leading-relaxed">Query across multiple cubes with automatic join resolution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "measures": ["Sales.totalRevenue", "Products.averagePrice"],
  "dimensions": ["Products.category", "Sales.customerSegment"]
}</code></pre><h3 id="time-intelligence" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Time Intelligence</h3><p class="mb-4 text-gray-600 leading-relaxed">Automatic time-based calculations:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  revenueGrowth: {
    sql: schema.sales.amount,
    type: 'sum',
    timeComparison: 'previousPeriod' // Compare to previous period
  },
  
  runningTotal: {
    sql: schema.sales.amount,
    type: 'runningSum' // Cumulative sum over time
  }
}</code></pre><h3 id="calculated-members" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Calculated Members</h3><p class="mb-4 text-gray-600 leading-relaxed">Create complex business logic:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  customerLifetimeValue: {
    sql: sql\`
      (\${schema.sales.amount} / \${schema.customers.acquisitionCost}) * 
      \${schema.customers.retentionRate}
    \`,
    type: 'avg',
    title: 'Customer Lifetime Value'
  }
}</code></pre><h3 id="hierarchical-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Hierarchical Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Support drill-down analytics:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  location: {
    sql: schema.sales.region,
    type: 'string',
    hierarchy: ['country', 'region', 'city']
  }
}</code></pre><h2 id="security-model" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Model</h2><h3 id="multi-tenant-isolation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Multi-Tenant Isolation</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube must implement tenant isolation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.data)
    .where(eq(schema.data.organisationId, securityContext.organisationId))</code></pre><h3 id="role-based-access" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Role-Based Access</h3><p class="mb-4 text-gray-600 leading-relaxed">Control access based on user roles:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  sensitiveData: {
    sql: securityContext.hasRole('admin') 
      ? schema.table.sensitiveColumn
      : sql\`NULL\`,
    type: 'string'
  }
}</code></pre><h3 id="dynamic-filtering" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dynamic Filtering</h3><p class="mb-4 text-gray-600 leading-relaxed">Apply filters based on user context:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => {
  let query = db.select().from(schema.sales);
  
  if (securityContext.role === 'salesperson') {
    query = query.where(eq(schema.sales.salesPersonId, securityContext.userId));
  }
  
  return query.where(eq(schema.sales.organisationId, securityContext.organisationId));
}</code></pre><h2 id="performance-optimization" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Performance Optimization</h2><h3 id="pre-aggregations" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Pre-aggregations</h3><p class="mb-4 text-gray-600 leading-relaxed">Create summary tables for fast queries:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">preAggregations: {
  monthlySales: {
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory'],
    timeDimension: 'Sales.orderDate',
    granularity: 'month',
    refreshKey: {
      every: '1 hour'
    }
  }
}</code></pre><h3 id="indexes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Indexes</h3><p class="mb-4 text-gray-600 leading-relaxed">Ensure proper database indexes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// In your Drizzle schema
export const salesIndex = index('sales_org_date_idx')
  .on(sales.organisationId, sales.orderDate);</code></pre><h3 id="query-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Optimization</h3><p class="mb-4 text-gray-600 leading-relaxed">Use efficient SQL patterns:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// ✅ Good - use joins instead of subqueries when possible
sql: ({ db }) => 
  db.select()
    .from(schema.sales)
    .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))

// ❌ Slower - subqueries can be less efficient  
sql: ({ db }) =>
  db.select()
    .from(schema.sales)
    .where(inArray(schema.sales.productId, 
      db.select({ id: schema.products.id }).from(schema.products)
    ))</code></pre><h2 id="data-modeling-best-practices" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Data Modeling Best Practices</h2><h3 id="star-schema-design" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Star Schema Design</h3><p class="mb-4 text-gray-600 leading-relaxed">Organize cubes around business processes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">    Customers ───┐
                 │
    Products ────┼──── Sales (Fact)
                 │
    Time ────────┘</code></pre><h3 id="dimensional-modeling" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensional Modeling</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="naming-conventions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Naming Conventions</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Cubes: Business entities (PascalCase)
export const CustomerOrders = defineCube(/* ... */);

// Dimensions: Attributes (camelCase)  
dimensions: {
  customerName: { /* ... */ },
  orderDate: { /* ... */ }
}

// Measures: Metrics (camelCase)
measures: {
  totalRevenue: { /* ... */ },
  averageOrderValue: { /* ... */ }
}</code></pre><h2 id="testing-your-semantic-layer" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Testing Your Semantic Layer</h2><h3 id="unit-tests" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Unit Tests</h3><p class="mb-4 text-gray-600 leading-relaxed">Test cube definitions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { describe, it, expect } from 'vitest';
import { salesCube } from './cubes';

describe('Sales Cube', () => {
  it('should have required dimensions', () => {
    expect(salesCube.dimensions.customerName).toBeDefined();
    expect(salesCube.dimensions.orderDate).toBeDefined();
  });
  
  it('should have required measures', () => {
    expect(salesCube.measures.totalRevenue).toBeDefined();
    expect(salesCube.measures.orderCount).toBeDefined();
  });
});</code></pre><h3 id="integration-tests" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Integration Tests</h3><p class="mb-4 text-gray-600 leading-relaxed">Test query execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">it('should execute queries correctly', async () => {
  const result = await semanticLayer.executeQuery({
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.productCategory']
  }, { organisationId: 1 });
  
  expect(result.data).toHaveLength(3);
  expect(result.data[0]).toHaveProperty('Sales.totalRevenue');
});</code></pre><h2 id="migration-strategies" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Migration Strategies</h2><h3 id="from-cubejs" class="text-2xl font-medium text-gray-700 mt-6 mb-3">From Cube.js</h3><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube is designed to be compatible with existing Cube.js schemas:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Cube.js schema
cube(\`Sales\`, {
  sql: \`SELECT * FROM sales\`,
  dimensions: {
    customerName: {
      sql: \`customer_name\`,
      type: \`string\`
    }
  },
  measures: {
    count: {
      type: \`count\`
    }
  }
});

// Equivalent Drizzle Cube
export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db }) => db.select().from(schema.sales),
  dimensions: {
    customerName: {
      sql: schema.sales.customerName,
      type: 'string'
    }
  },
  measures: {
    count: {
      sql: schema.sales.id,
      type: 'count'
    }
  }
});</code></pre><h3 id="gradual-migration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Gradual Migration</h3><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ol><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ul>`,path:"semantic-layer/index.md"}],a={"adapters/hono":{slug:"adapters/hono",title:"Hono Adapter",content:`<h1 id="hono-adapter" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Hono Adapter</h1><p class="mb-4 text-gray-600 leading-relaxed">The Hono adapter provides a complete Cube.js-compatible API for the [Hono](https://hono.dev) web framework, making it easy to add analytics capabilities to your Hono applications.</p><h2 id="installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Installation</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install drizzle-cube hono drizzle-orm</code></pre><h2 id="quick-start" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Quick Start</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { Hono } from 'hono';
import { createCubeApp } from 'drizzle-cube/adapters/hono';
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { salesCube } from './cubes';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create semantic layer
const databaseExecutor = createDatabaseExecutor(db, schema, 'postgres');
const semanticLayer = new SemanticLayerCompiler({ databaseExecutor });
semanticLayer.registerCube(salesCube);

// Create main Hono app
const app = new Hono();

// Authentication middleware
app.use('/api/cube/*', async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Validate token and set user context
  const user = await validateToken(token);
  c.set('user', user);
  await next();
});

// Create and mount Cube API
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const user = c.get('user');
    return {
      organisationId: user.organisationId,
      userId: user.id,
      roles: user.roles
    };
  }
});

app.route('/api/cube', cubeApp);

export default app;</code></pre><h2 id="configuration-options" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Configuration Options</h2><h3 id="basic-configuration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Basic Configuration</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // Required
  semanticLayer: semanticLayerInstance,
  drizzle: dbInstance,
  schema: schemaObject,
  getSecurityContext: async (c) => ({ /* context */ }),
  
  // Optional
  corsOptions: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  
  enablePlayground: process.env.NODE_ENV === 'development',
  
  queryTimeout: 30000, // 30 seconds
  
  onError: (error, c) => {
    console.error('Cube API Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});</code></pre><h3 id="advanced-configuration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Advanced Configuration</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  
  getSecurityContext: async (c) => {
    const user = c.get('user');
    const tenant = c.req.header('X-Tenant-ID');
    
    return {
      organisationId: parseInt(tenant!),
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      // Custom context
      region: user.region,
      hasRole: (role: string) => user.roles.includes(role)
    };
  },
  
  // Custom middleware for all cube routes
  middleware: [
    // Rate limiting
    async (c, next) => {
      const userId = c.get('user')?.id;
      if (await isRateLimited(userId)) {
        return c.json({ error: 'Rate limited' }, 429);
      }
      await next();
    },
    
    // Audit logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      
      await logQuery({
        userId: c.get('user')?.id,
        path: c.req.path,
        duration,
        status: c.res.status
      });
    }
  ],
  
  // Transform queries before execution
  queryTransform: async (query, context) => {
    // Add automatic filters based on user
    if (context.hasRole('sales')) {
      query.filters = query.filters || [];
      query.filters.push({
        member: 'Sales.salesPersonId',
        operator: 'equals',
        values: [context.userId.toString()]
      });
    }
    
    return query;
  }
});</code></pre><h2 id="api-endpoints" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">API Endpoints</h2><p class="mb-4 text-gray-600 leading-relaxed">The Hono adapter provides these Cube.js-compatible endpoints:</p><h3 id="load-data" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Load Data</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/load
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"],
    "timeDimensions": [{
      "dimension": "Sales.orderDate",
      "granularity": "month"
    }]
  }
}</code></pre><h3 id="get-metadata" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Get Metadata</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">GET /api/cube/meta</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Returns available cubes, dimensions, and measures.</p><h3 id="execute-sql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Execute SQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/sql
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"]
  }
}</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Returns the generated SQL without executing it.</p><h3 id="query-validation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Validation</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-http">POST /api/cube/validate
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["InvalidDimension"]
  }
}</code></pre><h2 id="security-context" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Context</h2><p class="mb-4 text-gray-600 leading-relaxed">The \`getSecurityContext\` function is crucial for multi-tenant security:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">getSecurityContext: async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const user = await verifyJWT(token);
  
  // Extract tenant from subdomain
  const host = c.req.header('Host');
  const subdomain = host?.split('.')[0];
  const tenant = await getTenantBySubdomain(subdomain);
  
  return {
    organisationId: tenant.id,
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions,
    
    // Custom helpers
    hasRole: (role: string) => user.roles.includes(role),
    hasPermission: (permission: string) => user.permissions.includes(permission),
    
    // Regional filtering
    region: user.region,
    allowedRegions: user.allowedRegions
  };
}</code></pre><h2 id="authentication-patterns" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Authentication Patterns</h2><h3 id="jwt-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">JWT Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { jwt } from 'hono/jwt';

app.use('/api/cube/*', jwt({
  secret: process.env.JWT_SECRET!,
  cookie: 'auth-token' // Optional: read from cookie
}));

app.use('/api/cube/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  const user = await getUserById(payload.sub);
  c.set('user', user);
  await next();
});</code></pre><h3 id="api-key-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">API Key Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">app.use('/api/cube/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }
  
  const client = await validateApiKey(apiKey);
  if (!client) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  c.set('client', client);
  await next();
});</code></pre><h3 id="session-based-authentication" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Session-based Authentication</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { getCookie } from 'hono/cookie';

app.use('/api/cube/*', async (c, next) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await getSession(sessionId);
  if (!session || session.expired) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  c.set('user', session.user);
  await next();
});</code></pre><h2 id="error-handling" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Error Handling</h2><h3 id="custom-error-handler" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Error Handler</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  
  onError: (error, c) => {
    console.error('Cube API Error:', {
      error: error.message,
      stack: error.stack,
      user: c.get('user')?.id,
      query: c.req.json(),
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to clients
    if (process.env.NODE_ENV === 'production') {
      return c.json({ 
        error: 'An error occurred processing your request',
        requestId: generateRequestId()
      }, 500);
    }
    
    return c.json({ 
      error: error.message,
      stack: error.stack
    }, 500);
  }
});</code></pre><h3 id="query-timeout" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Timeout</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  queryTimeout: 60000, // 60 seconds
  
  onTimeout: (c) => {
    return c.json({
      error: 'Query timeout',
      message: 'The query took too long to execute. Try reducing the date range or adding filters.'
    }, 408);
  }
});</code></pre><h2 id="caching" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Caching</h2><h3 id="query-result-caching" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Result Caching</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { cache } from 'hono/cache';

// Cache GET requests for 5 minutes
app.get('/api/cube/meta', cache({
  cacheName: 'cube-meta',
  cacheControl: 'max-age=300'
}));

// Custom caching logic
app.use('/api/cube/load', async (c, next) => {
  const query = await c.req.json();
  const cacheKey = generateCacheKey(query, c.get('user'));
  
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return c.json(cached);
  }
  
  await next();
  
  // Cache the response
  const response = await c.res.json();
  await setCache(cacheKey, response, 300); // 5 minutes
});</code></pre><h2 id="development-tools" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Development Tools</h2><h3 id="cube-playground" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cube Playground</h3><p class="mb-4 text-gray-600 leading-relaxed">Enable the playground in development:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const cubeApp = createCubeApp({
  // ... other options
  enablePlayground: process.env.NODE_ENV === 'development'
});

// Access at: http://localhost:3000/api/cube/playground</code></pre><h3 id="query-logging" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Logging</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">app.use('/api/cube/*', async (c, next) => {
  if (process.env.NODE_ENV === 'development') {
    const query = c.req.method === 'POST' ? await c.req.json() : null;
    console.log('Cube Query:', {
      method: c.req.method,
      path: c.req.path,
      query,
      user: c.get('user')?.id
    });
  }
  
  await next();
});</code></pre><h2 id="deployment" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Deployment</h2><h3 id="cloudflare-workers" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cloudflare Workers</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/worker.ts
import app from './server';

export default {
  fetch: app.fetch
};

// wrangler.toml
[env.production]
vars = { NODE_ENV = "production" }

[[env.production.bindings]]
name = "DATABASE_URL"
type = "secret"</code></pre><h3 id="nodejs-server" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Node.js Server</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { serve } from '@hono/node-server';
import app from './server';

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port: Number(port)
});

console.log(\`Server running on port \${port}\`);</code></pre><h3 id="vercel" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Vercel</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// api/cube/[...path].ts
import { handle } from '@hono/vercel';
import app from '../../src/server';

export default handle(app);</code></pre><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"adapters/hono.md"},client:{slug:"client",title:"React Client",content:`<h1 id="react-client" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">React Client</h1><p class="mb-4 text-gray-600 leading-relaxed">The Drizzle Cube React client provides pre-built components and hooks for creating analytics dashboards and data visualizations with minimal code.</p><h2 id="installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Installation</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install drizzle-cube react react-dom recharts react-grid-layout</code></pre><h2 id="quick-start" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Quick Start</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import React from 'react';
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
}</code></pre><h2 id="core-components" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Core Components</h2><h3 id="cubeprovider" class="text-2xl font-medium text-gray-700 mt-6 mb-3">CubeProvider</h3><p class="mb-4 text-gray-600 leading-relaxed">The foundation component that provides cube API context:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { CubeProvider } from 'drizzle-cube/client';

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
}</code></pre><h3 id="analyticsdashboard" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsDashboard</h3><p class="mb-4 text-gray-600 leading-relaxed">A complete dashboard with drag-and-drop layout:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsDashboard } from 'drizzle-cube/client';

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
/></code></pre><h3 id="analyticspage" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsPage</h3><p class="mb-4 text-gray-600 leading-relaxed">A complete page with sidebar filters and charts:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsPage } from 'drizzle-cube/client';

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
/></code></pre><h3 id="analyticsportlet" class="text-2xl font-medium text-gray-700 mt-6 mb-3">AnalyticsPortlet</h3><p class="mb-4 text-gray-600 leading-relaxed">Individual chart components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { AnalyticsPortlet } from 'drizzle-cube/client';

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
/></code></pre><h2 id="chart-types" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Chart Types</h2><h3 id="line-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Line Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Perfect for time series data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="line"
  query={{
    measures: ['Sales.totalRevenue'],
    timeDimensions: [{ 
      dimension: 'Sales.orderDate', 
      granularity: 'day' 
    }]
  }}
/></code></pre><h3 id="bar-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Bar Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Great for comparing categories:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="bar"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory']
  }}
/></code></pre><h3 id="pie-charts" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Pie Charts</h3><p class="mb-4 text-gray-600 leading-relaxed">Show proportions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="pie"
  query={{
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.region']
  }}
/></code></pre><h3 id="data-tables" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Data Tables</h3><p class="mb-4 text-gray-600 leading-relaxed">Detailed data views:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx"><AnalyticsPortlet
  chartType="table"
  query={{
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.customerName', 'Sales.productCategory']
  }}
  
  pageSize={20}
  sortable={true}
  searchable={true}
/></code></pre><h2 id="hooks" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Hooks</h2><h3 id="usecubequery" class="text-2xl font-medium text-gray-700 mt-6 mb-3">useCubeQuery</h3><p class="mb-4 text-gray-600 leading-relaxed">Execute queries and get real-time data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';

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
      <h2>Total Revenue: \${data.totalRevenue}</h2>
      {/* Render your data */}
    </div>
  );
}</code></pre><h3 id="usecubemeta" class="text-2xl font-medium text-gray-700 mt-6 mb-3">useCubeMeta</h3><p class="mb-4 text-gray-600 leading-relaxed">Access cube metadata:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeMeta } from 'drizzle-cube/client';

function MetricSelector() {
  const { cubes, isLoading } = useCubeMeta();

  if (isLoading) return <div>Loading cubes...</div>;

  return (
    <select>
      {cubes.map(cube => 
        cube.measures.map(measure => (
          <option key={\`\${cube.name}.\${measure.name}\`} 
                  value={\`\${cube.name}.\${measure.name}\`}>
            {measure.title || measure.name}
          </option>
        ))
      )}
    </select>
  );
}</code></pre><h2 id="customization" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Customization</h2><h3 id="custom-chart-components" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Chart Components</h3><p class="mb-4 text-gray-600 leading-relaxed">Create your own visualizations:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';
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
}</code></pre><h3 id="theme-customization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Theme Customization</h3><p class="mb-4 text-gray-600 leading-relaxed">Customize the appearance:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { CubeProvider } from 'drizzle-cube/client';

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
</CubeProvider></code></pre><h2 id="real-time-updates" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Real-time Updates</h2><h3 id="websocket-support" class="text-2xl font-medium text-gray-700 mt-6 mb-3">WebSocket Support</h3><p class="mb-4 text-gray-600 leading-relaxed">Enable real-time data updates:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">const cubeApi = {
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
</CubeProvider></code></pre><h3 id="manual-refresh" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Manual Refresh</h3><p class="mb-4 text-gray-600 leading-relaxed">Trigger updates programmatically:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { useCubeQuery } from 'drizzle-cube/client';

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
}</code></pre><h2 id="error-handling" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Error Handling</h2><h3 id="error-boundaries" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Error Boundaries</h3><p class="mb-4 text-gray-600 leading-relaxed">Handle errors gracefully:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { ChartErrorBoundary } from 'drizzle-cube/client';

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
</ChartErrorBoundary></code></pre><h3 id="query-validation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Validation</h3><p class="mb-4 text-gray-600 leading-relaxed">Validate queries before execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">import { validateQuery } from 'drizzle-cube/client';

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
}</code></pre><h2 id="performance-tips" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Performance Tips</h2><h3 id="query-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="component-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Component Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="bundle-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Bundle Optimization</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"client/index.md"},"getting-started":{slug:"getting-started",title:"Getting Started with Drizzle Cube",content:`<h1 id="getting-started-with-drizzle-cube" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Getting Started with Drizzle Cube</h1><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube is a **Drizzle ORM-first semantic layer** with Cube.js compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.</p><h2 id="what-is-drizzle-cube" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What is Drizzle Cube?</h2><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube bridges the gap between your database and your analytics applications by providing:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]</ul><h2 id="core-concepts" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Core Concepts</h2><h3 id="semantic-layer" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Semantic Layer</h3><p class="mb-4 text-gray-600 leading-relaxed">The semantic layer is where you define your business logic and data models. Instead of writing raw SQL queries throughout your application, you define **cubes** that encapsulate your data models.</p><h3 id="cubes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cubes</h3><p class="mb-4 text-gray-600 leading-relaxed">Cubes are the building blocks of your semantic layer. Each cube represents a table or a set of joined tables with defined dimensions and measures.</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    productName: { 
      sql: schema.sales.productName, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.sales.orderDate, 
      type: 'time' 
    }
  },
  
  measures: {
    totalSales: { 
      sql: schema.sales.amount, 
      type: 'sum' 
    },
    orderCount: { 
      sql: schema.sales.id, 
      type: 'count' 
    }
  }
});</code></pre><h3 id="dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Dimensions are attributes of your data that you can filter, group, and segment by. They are typically categorical data like product names, dates, or customer segments.</p><h3 id="measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">Measures are the quantitative values you want to analyze - things like revenue, count of orders, average order value, etc.</p><h2 id="architecture" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Architecture</h2><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube follows a **Drizzle-first architecture**:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ol><h2 id="security-model" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Model</h2><p class="mb-4 text-gray-600 leading-relaxed">Security is built into every layer:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Ready to get started? Here's what to do next:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ol><h2 id="example-applications" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Example Applications</h2><p class="mb-4 text-gray-600 leading-relaxed">Check out these example implementations:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="community-and-support" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Community and Support</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul>`,path:"getting-started/index.md"},"getting-started/concepts":{slug:"getting-started/concepts",title:"Core Concepts",content:`<h1 id="core-concepts" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Core Concepts</h1><p class="mb-4 text-gray-600 leading-relaxed">Understanding the fundamental concepts of Drizzle Cube is essential for building effective semantic layers. This guide covers the key concepts you'll work with.</p><h2 id="semantic-layer-overview" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Semantic Layer Overview</h2><p class="mb-4 text-gray-600 leading-relaxed">A **semantic layer** sits between your database and your analytics applications. It provides a business-friendly abstraction over your raw data, allowing you to:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="cubes" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Cubes</h2><p class="mb-4 text-gray-600 leading-relaxed">**Cubes** are the core building blocks of your semantic layer. Each cube represents a logical business entity (like Sales, Users, Products) and contains:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h3 id="basic-cube-structure" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Basic Cube Structure</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    // Categorical data
  },
  
  measures: {
    // Numeric aggregations
  }
});</code></pre><h3 id="security-context" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Security Context</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube **must** include security filtering to ensure multi-tenant isolation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// ✅ Good - includes security context
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))

// ❌ Bad - no security filtering
sql: ({ db }) => db.select().from(schema.sales)</code></pre><h2 id="dimensions" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Dimensions</h2><p class="mb-4 text-gray-600 leading-relaxed">**Dimensions** are the attributes of your data that you can:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="dimension-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimension Types</h3><h4 id="string-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">String Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Categorical text data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  customerName: { 
    sql: schema.sales.customerName, 
    type: 'string' 
  },
  productCategory: { 
    sql: schema.products.category, 
    type: 'string' 
  }
}</code></pre><h4 id="time-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">Time Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Date and timestamp fields:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  orderDate: { 
    sql: schema.sales.orderDate, 
    type: 'time' 
  },
  createdAt: { 
    sql: schema.users.createdAt, 
    type: 'time' 
  }
}</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Time dimensions support automatic granularity:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]</ul><h4 id="number-dimensions" class="text-xl font-medium text-gray-700 mt-4 mb-2">Number Dimensions</h4><p class="mb-4 text-gray-600 leading-relaxed">Numeric values used as categories:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  quantity: { 
    sql: schema.sales.quantity, 
    type: 'number' 
  },
  userId: { 
    sql: schema.sessions.userId, 
    type: 'number' 
  }
}</code></pre><h3 id="computed-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Computed Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">You can create computed dimensions using SQL expressions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  fullName: {
    sql: sql\`CONCAT(\${schema.users.firstName}, ' ', \${schema.users.lastName})\`,
    type: 'string',
    title: 'Full Name'
  },
  ageGroup: {
    sql: sql\`
      CASE 
        WHEN age < 18 THEN 'Under 18'
        WHEN age < 35 THEN '18-34'
        WHEN age < 55 THEN '35-54'
        ELSE '55+'
      END
    \`,
    type: 'string',
    title: 'Age Group'
  }
}</code></pre><h2 id="measures" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Measures</h2><p class="mb-4 text-gray-600 leading-relaxed">**Measures** are the numeric values you want to analyze. They represent aggregated data and support various aggregation types.</p><h3 id="aggregation-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Aggregation Types</h3><h4 id="count" class="text-xl font-medium text-gray-700 mt-4 mb-2">Count</h4><p class="mb-4 text-gray-600 leading-relaxed">Count the number of rows:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  orderCount: { 
    sql: schema.sales.id, 
    type: 'count',
    title: 'Total Orders'
  }
}</code></pre><h4 id="sum" class="text-xl font-medium text-gray-700 mt-4 mb-2">Sum</h4><p class="mb-4 text-gray-600 leading-relaxed">Add up numeric values:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  totalRevenue: { 
    sql: schema.sales.amount, 
    type: 'sum',
    title: 'Total Revenue'
  }
}</code></pre><h4 id="average" class="text-xl font-medium text-gray-700 mt-4 mb-2">Average</h4><p class="mb-4 text-gray-600 leading-relaxed">Calculate the mean value:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  averageOrderValue: { 
    sql: schema.sales.amount, 
    type: 'avg',
    title: 'Average Order Value'
  }
}</code></pre><h4 id="minmax" class="text-xl font-medium text-gray-700 mt-4 mb-2">Min/Max</h4><p class="mb-4 text-gray-600 leading-relaxed">Find minimum or maximum values:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  minOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'min',
    title: 'Smallest Order'
  },
  maxOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'max', 
    title: 'Largest Order'
  }
}</code></pre><h3 id="custom-measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">Create complex calculations using SQL expressions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  profitMargin: {
    sql: sql\`(\${schema.sales.amount} - \${schema.sales.cost}) / \${schema.sales.amount} * 100\`,
    type: 'avg',
    title: 'Profit Margin %',
    format: 'percent'
  },
  
  conversionRate: {
    sql: sql\`
      COUNT(CASE WHEN \${schema.events.type} = 'purchase' THEN 1 END) * 100.0 / 
      COUNT(CASE WHEN \${schema.events.type} = 'visit' THEN 1 END)
    \`,
    type: 'number',
    title: 'Conversion Rate %'
  }
}</code></pre><h2 id="data-types-and-formats" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Data Types and Formats</h2><h3 id="dimension-data-types" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimension Data Types</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h3 id="measure-formats" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measure Formats</h3><p class="mb-4 text-gray-600 leading-relaxed">Control how measures are displayed:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  revenue: {
    sql: schema.sales.amount,
    type: 'sum',
    format: 'currency' // $1,234.56
  },
  
  growth: {
    sql: schema.metrics.growth,
    type: 'avg',
    format: 'percent' // 12.3%
  }
}</code></pre><h2 id="query-structure" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Query Structure</h2><p class="mb-4 text-gray-600 leading-relaxed">When querying cubes, you specify:</p><h3 id="measures" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Measures</h3><p class="mb-4 text-gray-600 leading-relaxed">What you want to calculate:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "measures": ["Sales.totalRevenue", "Sales.orderCount"]
}</code></pre><h3 id="dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">How you want to group/filter the data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "dimensions": ["Sales.productCategory", "Sales.customerName"]
}</code></pre><h3 id="time-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Time Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Time-based grouping with granularity:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "timeDimensions": [{
    "dimension": "Sales.orderDate",
    "granularity": "month"
  }]
}</code></pre><h3 id="filters" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Filters</h3><p class="mb-4 text-gray-600 leading-relaxed">Restrict the data returned:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "filters": [
    {
      "member": "Sales.productCategory",
      "operator": "equals",
      "values": ["Electronics"]
    },
    {
      "member": "Sales.orderDate",
      "operator": "inDateRange", 
      "values": ["2024-01-01", "2024-12-31"]
    }
  ]
}</code></pre><h2 id="security-and-multi-tenancy" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security and Multi-tenancy</h2><h3 id="organisation-based-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Organisation-based Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube should filter by organisation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))</code></pre><h3 id="row-level-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Row-level Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Filter based on user permissions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(and(
      eq(schema.sales.organisationId, securityContext.organisationId),
      eq(schema.sales.salesPersonId, securityContext.userId) // User can only see their sales
    ))</code></pre><h3 id="column-level-security" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Column-level Security</h3><p class="mb-4 text-gray-600 leading-relaxed">Conditionally include sensitive data:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  customerEmail: {
    sql: securityContext.hasRole('admin') 
      ? schema.customers.email 
      : sql\`'[HIDDEN]'\`,
    type: 'string'
  }
}</code></pre><h2 id="best-practices" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Best Practices</h2><h3 id="naming-conventions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Naming Conventions</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="performance" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Performance</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="documentation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Documentation</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Now that you understand the core concepts:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ol>`,path:"getting-started/concepts.md"},"getting-started/installation":{slug:"getting-started/installation",title:"Installation",content:`<h1 id="installation" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Installation</h1><p class="mb-4 text-gray-600 leading-relaxed">Get Drizzle Cube up and running in your project in just a few steps.</p><h2 id="requirements" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Requirements</h2><p class="mb-4 text-gray-600 leading-relaxed">Before installing Drizzle Cube, make sure you have:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="package-installation" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Package Installation</h2><p class="mb-4 text-gray-600 leading-relaxed">Install Drizzle Cube using your preferred package manager:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash"># npm
npm install drizzle-cube drizzle-orm

# yarn
yarn add drizzle-cube drizzle-orm

# pnpm
pnpm add drizzle-cube drizzle-orm</code></pre><h2 id="database-setup" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Database Setup</h2><h3 id="postgresql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">PostgreSQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install postgres
# or for Neon serverless
npm install @neondatabase/serverless</code></pre><h3 id="mysql" class="text-2xl font-medium text-gray-700 mt-6 mb-3">MySQL</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install mysql2</code></pre><h3 id="sqlite" class="text-2xl font-medium text-gray-700 mt-6 mb-3">SQLite</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install better-sqlite3</code></pre><h2 id="framework-adapters" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Framework Adapters</h2><p class="mb-4 text-gray-600 leading-relaxed">Choose the adapter for your web framework:</p><h3 id="hono-recommended" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Hono (Recommended)</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install hono</code></pre><h3 id="custom-framework" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Custom Framework</h3><p class="mb-4 text-gray-600 leading-relaxed">You can create custom adapters for other frameworks. See [Custom Adapters](/help/adapters/custom) for details.</p><h2 id="react-components-optional" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">React Components (Optional)</h2><p class="mb-4 text-gray-600 leading-relaxed">For dashboard and chart components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npm install react react-dom recharts react-grid-layout</code></pre><h2 id="typescript-configuration" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">TypeScript Configuration</h2><p class="mb-4 text-gray-600 leading-relaxed">Update your \`tsconfig.json\` to include proper module resolution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}</code></pre><h2 id="project-structure" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Project Structure</h2><p class="mb-4 text-gray-600 leading-relaxed">Here's the recommended project structure:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">your-project/
├── src/
│   ├── schema.ts              # Drizzle schema definition
│   ├── cubes.ts               # Semantic layer cubes
│   ├── server.ts              # Server setup with adapter
│   └── client/                # React components (optional)
│       ├── components/
│       └── pages/
├── drizzle.config.ts          # Drizzle configuration
├── package.json
└── tsconfig.json</code></pre><h2 id="environment-variables" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Environment Variables</h2><p class="mb-4 text-gray-600 leading-relaxed">Create a \`.env\` file with your database connection details:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-env"># PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="file:./dev.db"</code></pre><h2 id="verification" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Verification</h2><p class="mb-4 text-gray-600 leading-relaxed">Create a simple test file to verify your installation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// test.ts
import { createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const executor = createDatabaseExecutor(db, {}, 'postgres');
console.log('✅ Drizzle Cube installed successfully!');</code></pre><p class="mb-4 text-gray-600 leading-relaxed">Run the test:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-bash">npx tsx test.ts</code></pre><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><p class="mb-4 text-gray-600 leading-relaxed">Now that Drizzle Cube is installed, you can:</p><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ol><h2 id="troubleshooting" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Troubleshooting</h2><h3 id="common-issues" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Common Issues</h3><p class="mb-4 text-gray-600 leading-relaxed">**Module not found errors**</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">**Database connection issues**  </p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">**TypeScript compilation errors**</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">Need more help? Check our [Troubleshooting Guide](/help/advanced/troubleshooting) or [report an issue](https://github.com/cliftonc/drizzle-cube/issues).</p>`,path:"getting-started/installation.md"},"getting-started/quick-start":{slug:"getting-started/quick-start",title:"Quick Start",content:`<h1 id="quick-start" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Quick Start</h1><p class="mb-4 text-gray-600 leading-relaxed">Build your first semantic layer with Drizzle Cube in under 10 minutes.</p><h2 id="step-1-database-schema" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 1: Database Schema</h2><p class="mb-4 text-gray-600 leading-relaxed">First, define your database schema using Drizzle ORM:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/schema.ts
import { pgTable, serial, text, timestamp, decimal, integer } from 'drizzle-orm/pg-core';

export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').references(() => organisations.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').references(() => organisations.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  orderDate: timestamp('order_date').defaultNow(),
  customerName: text('customer_name'),
});</code></pre><h2 id="step-2-define-cubes" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 2: Define Cubes</h2><p class="mb-4 text-gray-600 leading-relaxed">Create your semantic layer by defining cubes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/cubes.ts
import { defineCube } from 'drizzle-cube/server';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    customerName: { 
      sql: schema.sales.customerName, 
      type: 'string' 
    },
    productName: { 
      sql: schema.products.name, 
      type: 'string' 
    },
    productCategory: { 
      sql: schema.products.category, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.sales.orderDate, 
      type: 'time' 
    },
  },
  
  measures: {
    totalSales: { 
      sql: schema.sales.amount, 
      type: 'sum',
      title: 'Total Sales'
    },
    orderCount: { 
      sql: schema.sales.id, 
      type: 'count',
      title: 'Number of Orders'
    },
    averageOrderValue: { 
      sql: schema.sales.amount, 
      type: 'avg',
      title: 'Average Order Value'
    },
    totalQuantity: { 
      sql: schema.sales.quantity, 
      type: 'sum',
      title: 'Total Quantity Sold'
    },
  }
});

export const productsCube = defineCube(schema, {
  name: 'Products',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.products)
      .where(eq(schema.products.organisationId, securityContext.organisationId)),
  
  dimensions: {
    name: { 
      sql: schema.products.name, 
      type: 'string' 
    },
    category: { 
      sql: schema.products.category, 
      type: 'string' 
    },
    createdAt: { 
      sql: schema.products.createdAt, 
      type: 'time' 
    },
  },
  
  measures: {
    count: { 
      sql: schema.products.id, 
      type: 'count',
      title: 'Product Count'
    },
    averagePrice: { 
      sql: schema.products.price, 
      type: 'avg',
      title: 'Average Price'
    },
  }
});</code></pre><h2 id="step-3-server-setup" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 3: Server Setup</h2><p class="mb-4 text-gray-600 leading-relaxed">Set up your server with the Hono adapter:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// src/server.ts
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createCubeApp } from 'drizzle-cube/adapters/hono';
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server';
import * as schema from './schema';
import { salesCube, productsCube } from './cubes';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create semantic layer
const databaseExecutor = createDatabaseExecutor(db, schema, 'postgres');
const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor 
});

// Register cubes
semanticLayer.registerCube(salesCube);
semanticLayer.registerCube(productsCube);

// Create Hono app
const app = new Hono();

// Add authentication middleware (example)
app.use('/api/cube/*', async (c, next) => {
  // In a real app, validate JWT token, session, etc.
  const orgId = c.req.header('X-Organisation-ID');
  if (!orgId) {
    return c.json({ error: 'Organisation ID required' }, 401);
  }
  c.set('organisationId', parseInt(orgId));
  await next();
});

// Mount Cube API
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => ({
    organisationId: c.get('organisationId')
  })
});

app.route('/api/cube', cubeApp);

export default app;</code></pre><h2 id="step-4-query-your-data" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 4: Query Your Data</h2><p class="mb-4 text-gray-600 leading-relaxed">Now you can query your semantic layer:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Query example
const query = {
  measures: ['Sales.totalSales', 'Sales.orderCount'],
  dimensions: ['Sales.productCategory'],
  timeDimensions: [{
    dimension: 'Sales.orderDate',
    granularity: 'month'
  }],
  filters: [{
    member: 'Sales.orderDate',
    operator: 'inDateRange',
    values: ['2024-01-01', '2024-12-31']
  }]
};

// Make request to your API
const response = await fetch('/api/cube/load', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Organisation-ID': '1'
  },
  body: JSON.stringify({ query })
});

const data = await response.json();
console.log(data);</code></pre><h2 id="step-5-react-dashboard-optional" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Step 5: React Dashboard (Optional)</h2><p class="mb-4 text-gray-600 leading-relaxed">Add a React dashboard using Drizzle Cube's components:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-tsx">// src/Dashboard.tsx
import React from 'react';
import { CubeProvider } from 'drizzle-cube/client';
import { AnalyticsDashboard } from 'drizzle-cube/client';

const Dashboard: React.FC = () => {
  const cubeApi = {
    url: '/api/cube',
    headers: {
      'X-Organisation-ID': '1'
    }
  };

  return (
    <CubeProvider cubeApi={cubeApi}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
        
        <AnalyticsDashboard
          initialLayout={[
            {
              id: 'sales-by-category',
              title: 'Sales by Category',
              chartType: 'bar',
              query: {
                measures: ['Sales.totalSales'],
                dimensions: ['Sales.productCategory']
              }
            },
            {
              id: 'sales-over-time',
              title: 'Sales Over Time',
              chartType: 'line',
              query: {
                measures: ['Sales.totalSales'],
                timeDimensions: [{
                  dimension: 'Sales.orderDate',
                  granularity: 'month'
                }]
              }
            }
          ]}
        />
      </div>
    </CubeProvider>
  );
};

export default Dashboard;</code></pre><h2 id="whats-next" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What's Next?</h2><p class="mb-4 text-gray-600 leading-relaxed">Congratulations! You've created your first semantic layer with Drizzle Cube. Here's what you can explore next:</p><h3 id="learn-more" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Learn More</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="explore-components" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Explore Components</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="advanced-features" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Advanced Features</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h2 id="example-projects" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Example Projects</h2><p class="mb-4 text-gray-600 leading-relaxed">Check out complete example implementations:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object]</ul><p class="mb-4 text-gray-600 leading-relaxed">Need help? [Join our community](https://github.com/cliftonc/drizzle-cube/discussions) or [report issues](https://github.com/cliftonc/drizzle-cube/issues)!</p>`,path:"getting-started/quick-start.md"},"semantic-layer":{slug:"semantic-layer",title:"Semantic Layer",content:`<h1 id="semantic-layer" class="text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500">Semantic Layer</h1><p class="mb-4 text-gray-600 leading-relaxed">The semantic layer is the heart of Drizzle Cube. It provides a business-friendly abstraction over your database that enables consistent, secure, and performant analytics across your organization.</p><h2 id="what-is-a-semantic-layer" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">What is a Semantic Layer?</h2><p class="mb-4 text-gray-600 leading-relaxed">A semantic layer is a **business representation** of your data that:</p><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object]</ul><h2 id="architecture-overview" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Architecture Overview</h2><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Applications  │────│  Semantic Layer  │────│    Database     │
│                 │    │                  │    │                 │
│ • Dashboards    │    │ • Cubes         │    │ • Tables        │
│ • Reports       │    │ • Dimensions    │    │ • Views         │
│ • APIs          │    │ • Measures      │    │ • Indexes       │
└─────────────────┘    └──────────────────┘    └─────────────────┘</code></pre><h2 id="key-components" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Key Components</h2><h3 id="cubes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Cubes</h3><p class="mb-4 text-gray-600 leading-relaxed">Business entities that represent your data models:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">export const salesCube = defineCube(schema, {
  name: 'Sales',
  title: 'Sales Transactions',
  description: 'All sales transactions with product and customer information',
  
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: { /* ... */ },
  measures: { /* ... */ }
});</code></pre><h3 id="database-executor" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Database Executor</h3><p class="mb-4 text-gray-600 leading-relaxed">Handles different database engines:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const executor = createDatabaseExecutor(db, schema, 'postgres');
// Supports: 'postgres', 'mysql', 'sqlite'</code></pre><h3 id="semantic-layer-compiler" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Semantic Layer Compiler</h3><p class="mb-4 text-gray-600 leading-relaxed">Orchestrates cubes and query execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor: executor 
});

semanticLayer.registerCube(salesCube);
semanticLayer.registerCube(productsCube);
semanticLayer.registerCube(customersCube);</code></pre><h2 id="advanced-features" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Advanced Features</h2><h3 id="multi-cube-queries" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Multi-Cube Queries</h3><p class="mb-4 text-gray-600 leading-relaxed">Query across multiple cubes with automatic join resolution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-json">{
  "measures": ["Sales.totalRevenue", "Products.averagePrice"],
  "dimensions": ["Products.category", "Sales.customerSegment"]
}</code></pre><h3 id="time-intelligence" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Time Intelligence</h3><p class="mb-4 text-gray-600 leading-relaxed">Automatic time-based calculations:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  revenueGrowth: {
    sql: schema.sales.amount,
    type: 'sum',
    timeComparison: 'previousPeriod' // Compare to previous period
  },
  
  runningTotal: {
    sql: schema.sales.amount,
    type: 'runningSum' // Cumulative sum over time
  }
}</code></pre><h3 id="calculated-members" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Calculated Members</h3><p class="mb-4 text-gray-600 leading-relaxed">Create complex business logic:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">measures: {
  customerLifetimeValue: {
    sql: sql\`
      (\${schema.sales.amount} / \${schema.customers.acquisitionCost}) * 
      \${schema.customers.retentionRate}
    \`,
    type: 'avg',
    title: 'Customer Lifetime Value'
  }
}</code></pre><h3 id="hierarchical-dimensions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Hierarchical Dimensions</h3><p class="mb-4 text-gray-600 leading-relaxed">Support drill-down analytics:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  location: {
    sql: schema.sales.region,
    type: 'string',
    hierarchy: ['country', 'region', 'city']
  }
}</code></pre><h2 id="security-model" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Security Model</h2><h3 id="multi-tenant-isolation" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Multi-Tenant Isolation</h3><p class="mb-4 text-gray-600 leading-relaxed">Every cube must implement tenant isolation:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.data)
    .where(eq(schema.data.organisationId, securityContext.organisationId))</code></pre><h3 id="role-based-access" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Role-Based Access</h3><p class="mb-4 text-gray-600 leading-relaxed">Control access based on user roles:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">dimensions: {
  sensitiveData: {
    sql: securityContext.hasRole('admin') 
      ? schema.table.sensitiveColumn
      : sql\`NULL\`,
    type: 'string'
  }
}</code></pre><h3 id="dynamic-filtering" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dynamic Filtering</h3><p class="mb-4 text-gray-600 leading-relaxed">Apply filters based on user context:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">sql: ({ db, securityContext }) => {
  let query = db.select().from(schema.sales);
  
  if (securityContext.role === 'salesperson') {
    query = query.where(eq(schema.sales.salesPersonId, securityContext.userId));
  }
  
  return query.where(eq(schema.sales.organisationId, securityContext.organisationId));
}</code></pre><h2 id="performance-optimization" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Performance Optimization</h2><h3 id="pre-aggregations" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Pre-aggregations</h3><p class="mb-4 text-gray-600 leading-relaxed">Create summary tables for fast queries:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">preAggregations: {
  monthlySales: {
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory'],
    timeDimension: 'Sales.orderDate',
    granularity: 'month',
    refreshKey: {
      every: '1 hour'
    }
  }
}</code></pre><h3 id="indexes" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Indexes</h3><p class="mb-4 text-gray-600 leading-relaxed">Ensure proper database indexes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// In your Drizzle schema
export const salesIndex = index('sales_org_date_idx')
  .on(sales.organisationId, sales.orderDate);</code></pre><h3 id="query-optimization" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Query Optimization</h3><p class="mb-4 text-gray-600 leading-relaxed">Use efficient SQL patterns:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// ✅ Good - use joins instead of subqueries when possible
sql: ({ db }) => 
  db.select()
    .from(schema.sales)
    .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))

// ❌ Slower - subqueries can be less efficient  
sql: ({ db }) =>
  db.select()
    .from(schema.sales)
    .where(inArray(schema.sales.productId, 
      db.select({ id: schema.products.id }).from(schema.products)
    ))</code></pre><h2 id="data-modeling-best-practices" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Data Modeling Best Practices</h2><h3 id="star-schema-design" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Star Schema Design</h3><p class="mb-4 text-gray-600 leading-relaxed">Organize cubes around business processes:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-text">    Customers ───┐
                 │
    Products ────┼──── Sales (Fact)
                 │
    Time ────────┘</code></pre><h3 id="dimensional-modeling" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Dimensional Modeling</h3><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object]</ul><h3 id="naming-conventions" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Naming Conventions</h3><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Cubes: Business entities (PascalCase)
export const CustomerOrders = defineCube(/* ... */);

// Dimensions: Attributes (camelCase)  
dimensions: {
  customerName: { /* ... */ },
  orderDate: { /* ... */ }
}

// Measures: Metrics (camelCase)
measures: {
  totalRevenue: { /* ... */ },
  averageOrderValue: { /* ... */ }
}</code></pre><h2 id="testing-your-semantic-layer" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Testing Your Semantic Layer</h2><h3 id="unit-tests" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Unit Tests</h3><p class="mb-4 text-gray-600 leading-relaxed">Test cube definitions:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">import { describe, it, expect } from 'vitest';
import { salesCube } from './cubes';

describe('Sales Cube', () => {
  it('should have required dimensions', () => {
    expect(salesCube.dimensions.customerName).toBeDefined();
    expect(salesCube.dimensions.orderDate).toBeDefined();
  });
  
  it('should have required measures', () => {
    expect(salesCube.measures.totalRevenue).toBeDefined();
    expect(salesCube.measures.orderCount).toBeDefined();
  });
});</code></pre><h3 id="integration-tests" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Integration Tests</h3><p class="mb-4 text-gray-600 leading-relaxed">Test query execution:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">it('should execute queries correctly', async () => {
  const result = await semanticLayer.executeQuery({
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.productCategory']
  }, { organisationId: 1 });
  
  expect(result.data).toHaveLength(3);
  expect(result.data[0]).toHaveProperty('Sales.totalRevenue');
});</code></pre><h2 id="migration-strategies" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Migration Strategies</h2><h3 id="from-cubejs" class="text-2xl font-medium text-gray-700 mt-6 mb-3">From Cube.js</h3><p class="mb-4 text-gray-600 leading-relaxed">Drizzle Cube is designed to be compatible with existing Cube.js schemas:</p><pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-sm text-gray-800 language-typescript">// Cube.js schema
cube(\`Sales\`, {
  sql: \`SELECT * FROM sales\`,
  dimensions: {
    customerName: {
      sql: \`customer_name\`,
      type: \`string\`
    }
  },
  measures: {
    count: {
      type: \`count\`
    }
  }
});

// Equivalent Drizzle Cube
export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db }) => db.select().from(schema.sales),
  dimensions: {
    customerName: {
      sql: schema.sales.customerName,
      type: 'string'
    }
  },
  measures: {
    count: {
      sql: schema.sales.id,
      type: 'count'
    }
  }
});</code></pre><h3 id="gradual-migration" class="text-2xl font-medium text-gray-700 mt-6 mb-3">Gradual Migration</h3><ol class="list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ol><h2 id="next-steps" class="text-3xl font-semibold text-gray-800 mt-8 mb-4">Next Steps</h2><ul class="list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4">[object Object],[object Object],[object Object],[object Object],[object Object]</ul>`,path:"semantic-layer/index.md"}},s=t.map(e=>({slug:e.slug,title:e.title,content:e.content.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}));export{t as helpContent,a as helpContentMap,s as searchableContent};
