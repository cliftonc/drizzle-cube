# Quick Start

Build your first semantic layer with Drizzle Cube in under 10 minutes.

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

Add a React dashboard using Drizzle Cube's components:

```tsx
// src/Dashboard.tsx
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

export default Dashboard;
```

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

- **[Basic Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/basic)** - Simple analytics setup
- **[Hono Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/hono)** - Full-featured application

Need help? [Join our community](https://github.com/cliftonc/drizzle-cube/discussions) or [report issues](https://github.com/cliftonc/drizzle-cube/issues)!