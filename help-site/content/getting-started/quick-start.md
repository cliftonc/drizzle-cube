# Quick Start

Get started with Drizzle Cube by exploring our complete examples, or build your first semantic layer from scratch in under 10 minutes.

## 🚀 Try a Complete Example

The fastest way to get started is with one of our ready-to-run examples. Each includes a full-stack application with database, API, and React dashboard:

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center mb-3">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/express.svg" alt="Express.js" class="w-8 h-8 align-middle" />
      <h3 class="ml-3 font-semibold text-gray-900">Express</h3>
    </div>
    <p class="text-sm text-gray-600 mb-3">Express.js server with React client and TypeScript</p>
    <a href="/help/examples/express" class="text-drizzle-600 hover:text-drizzle-700 text-sm font-medium">
      View Example →
    </a>
  </div>

  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center mb-3">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/fastify.svg" alt="Fastify" class="w-8 h-8 align-middle" />
      <h3 class="ml-3 font-semibold text-gray-900">Fastify</h3>
    </div>
    <p class="text-sm text-gray-600 mb-3">High-performance Fastify server with React client</p>
    <a href="/help/examples/fastify" class="text-drizzle-600 hover:text-drizzle-700 text-sm font-medium">
      View Example →
    </a>
  </div>

  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center mb-3">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hono.svg" alt="Hono" class="w-8 h-8 align-middle" />
      <h3 class="ml-3 font-semibold text-gray-900">Hono</h3>
    </div>
    <p class="text-sm text-gray-600 mb-3">Cloudflare Workers compatible with dashboard management</p>
    <div class="flex flex-col space-y-2">
      <a href="/help/examples/hono" class="text-drizzle-600 hover:text-drizzle-700 text-sm font-medium">
        View Example →
      </a>
      <a href="https://try.drizzle-cube.dev/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
        🚀 Live Demo →
      </a>
    </div>
  </div>

  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center mb-3">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nextdotjs.svg" alt="Next.js" class="w-8 h-8 align-middle" />
      <h3 class="ml-3 font-semibold text-gray-900">Next.js</h3>
    </div>
    <p class="text-sm text-gray-600 mb-3">Next.js 15 full-stack application with App Router</p>
    <div class="flex flex-col space-y-2">
      <a href="/help/examples/nextjs" class="text-drizzle-600 hover:text-drizzle-700 text-sm font-medium">
        View Example →
      </a>
      <a href="https://nextjs.drizzle-cube.dev/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
        🚀 Live Demo →
      </a>
    </div>
  </div>
</div>

Each example includes:
- Complete database schema and seed data
- Semantic layer with cubes, dimensions, and measures  
- Interactive dashboard with 4 working charts
- Query builder for exploring your data
- Multi-tenant security setup
- Docker Compose for local development

---

## 📖 Build From Scratch

Prefer to build your own semantic layer? Follow these steps to create one from scratch:

## Step 1: Database Schema

First, define your database schema using Drizzle ORM:

```typescript
// src/schema.ts
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
});
```

## Step 2: Define Cubes

Create your semantic layer by defining cubes:

```typescript
// src/cubes.ts
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
});
```

## Step 3: Server Setup

Set up your server with the Hono adapter:

```typescript
// src/server.ts
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

export default app;
```

## Step 4: Query Your Data

Now you can query your semantic layer:

```typescript
// Query example
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
const queryParam = encodeURIComponent(JSON.stringify(query));
const response = await fetch(`/api/cube/load?query=${queryParam}`, {
  method: 'GET',
  headers: {
    'X-Organisation-ID': '1'
  }
});

const data = await response.json();
console.log(data);

// The response now follows the official Cube.js format:
// {
//   "queryType": "regularQuery",
//   "results": [{
//     "query": { ... },
//     "data": [ ... ],
//     "annotation": { ... },
//     "requestId": "...",
//     "lastRefreshTime": "..."
//   }],
//   "pivotQuery": { ... },
//   "slowQuery": false
// }
```

## Step 5: React Dashboard (Optional)

Add a React dashboard with persistent configurations stored in your database:

### Add Dashboard Schema

First, add a dashboard table to your schema:

```typescript
// src/schema.ts (add to existing schema)
export const dashboards = pgTable('dashboards', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').references(() => organisations.id),
  name: text('name').notNull(),
  description: text('description'),
  layout: text('layout'), // JSON string of dashboard configuration
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Create Dashboard Component with Persistence

```tsx
// src/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { CubeProvider } from 'drizzle-cube/client';
import { AnalyticsDashboard } from 'drizzle-cube/client';

interface DashboardLayout {
  id: string;
  title: string;
  chartType: string;
  query: any;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
}

const Dashboard: React.FC = () => {
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardId, setDashboardId] = useState<number | null>(null);


  // Load dashboard from database
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboards/default', {
          headers: {
            'X-Organisation-ID': '1'
          }
        });
        
        if (response.ok) {
          const dashboard = await response.json();
          setDashboardId(dashboard.id);
          setDashboardLayout(JSON.parse(dashboard.layout || '[]'));
        } else {
          // Use default layout if no saved dashboard exists
          setDashboardLayout([
            {
              id: 'sales-by-category',
              title: 'Sales by Category',
              chartType: 'bar',
              query: {
                measures: ['Sales.totalSales'],
                dimensions: ['Sales.productCategory']
              },
              w: 6, h: 6, x: 0, y: 0
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
              },
              w: 6, h: 6, x: 6, y: 0
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Save dashboard changes to database
  const handleLayoutChange = async (newLayout: DashboardLayout[]) => {
    setDashboardLayout(newLayout);
    
    try {
      const method = dashboardId ? 'PUT' : 'POST';
      const url = dashboardId 
        ? `/api/dashboards/${dashboardId}` 
        : '/api/dashboards';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Organisation-ID': '1'
        },
        body: JSON.stringify({
          name: 'Default Dashboard',
          description: 'Auto-saved dashboard configuration',
          layout: JSON.stringify(newLayout),
          isDefault: true
        })
      });

      if (response.ok && !dashboardId) {
        const savedDashboard = await response.json();
        setDashboardId(savedDashboard.id);
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <CubeProvider 
      apiOptions={{
        apiUrl: '/api/cube',
        headers: {
          'X-Organisation-ID': '1'
        }
      }}
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
        
        <AnalyticsDashboard
          initialLayout={dashboardLayout}
          onLayoutChange={handleLayoutChange}
          enableEditing={true}
        />
      </div>
    </CubeProvider>
  );
};

export default Dashboard;
```

### Add Dashboard API Endpoints

Create API endpoints to handle dashboard persistence:

```typescript
// src/dashboardRoutes.ts
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { dashboards } from './schema';

const app = new Hono();

// Get default dashboard for organization
app.get('/api/dashboards/default', async (c) => {
  const orgId = c.req.header('X-Organisation-ID');
  if (!orgId) return c.json({ error: 'Organisation ID required' }, 400);

  const dashboard = await db.select()
    .from(dashboards)
    .where(and(
      eq(dashboards.organisationId, parseInt(orgId)),
      eq(dashboards.isDefault, true)
    ))
    .limit(1);

  if (dashboard.length === 0) {
    return c.json({ error: 'No default dashboard found' }, 404);
  }

  return c.json(dashboard[0]);
});

// Save/update dashboard
app.post('/api/dashboards', async (c) => {
  const orgId = c.req.header('X-Organisation-ID');
  if (!orgId) return c.json({ error: 'Organisation ID required' }, 400);

  const body = await c.req.json();
  
  const [newDashboard] = await db.insert(dashboards)
    .values({
      organisationId: parseInt(orgId),
      name: body.name,
      description: body.description,
      layout: body.layout,
      isDefault: body.isDefault || false
    })
    .returning();

  return c.json(newDashboard);
});

app.put('/api/dashboards/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const orgId = c.req.header('X-Organisation-ID');
  if (!orgId) return c.json({ error: 'Organisation ID required' }, 400);

  const body = await c.req.json();
  
  const [updatedDashboard] = await db.update(dashboards)
    .set({
      layout: body.layout,
      updatedAt: new Date()
    })
    .where(and(
      eq(dashboards.id, id),
      eq(dashboards.organisationId, parseInt(orgId))
    ))
    .returning();

  return c.json(updatedDashboard);
});

export default app;
```

### Key Benefits of Database Persistence

- **🔒 Multi-tenant security** - Each organization has their own dashboards
- **💾 Automatic saving** - Layout changes are saved immediately
- **👥 Shared dashboards** - Multiple users can see the same configuration  
- **🔄 State restoration** - Dashboard layout persists across browser sessions
- **📊 Multiple dashboards** - Support for different dashboard types (sales, marketing, etc.)

## What's Next?

Congratulations! You've created your first semantic layer with Drizzle Cube. Here's what you can explore next:

### Learn More
- [**Semantic Layer**](/help/semantic-layer) - Deep dive into cubes, dimensions, and measures
- [**Security**](/help/semantic-layer/security) - Multi-tenant security patterns

### Explore Components
- [**React Client**](/help/client) - Dashboard and chart components
- [**Charts**](/help/client/charts) - Available visualization types
- [**Hooks**](/help/client/hooks) - React hooks for data fetching

### Advanced Features
- [**Joins**](/help/semantic-layer/joins) - Multi-cube queries
- [**Performance**](/help/advanced/performance) - Optimization techniques
- [**Custom Adapters**](/help/adapters/custom) - Framework integration

## Example Projects

Check out complete example implementations:

- **[Express Example](/help/examples/express)** - Express.js server with React client
- **[Fastify Example](/help/examples/fastify)** - High-performance Fastify server  
- **[Hono Example](/help/examples/hono)** - Cloudflare Workers compatible
- **[Next.js Example](/help/examples/nextjs)** - Full-stack Next.js 15 application

Need help? [Join our community](https://github.com/cliftonc/drizzle-cube/discussions) or [report issues](https://github.com/cliftonc/drizzle-cube/issues)!