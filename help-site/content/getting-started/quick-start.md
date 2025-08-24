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

// Export schema type for use in cubes
export type Schema = {
  organisations: typeof organisations;
  products: typeof products;
  sales: typeof sales;
};

export const schema = {
  organisations,
  products,
  sales
};
```

## Step 2: Define Cubes

Create your semantic layer by defining cubes:

```typescript
// src/cubes.ts
import { defineCube } from 'drizzle-cube/server'
import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'
import { eq } from 'drizzle-orm'
import { sales, products } from './schema'
import type { Schema } from './schema'

export const salesCube = defineCube('Sales', {
  title: 'Sales Analytics',
  description: 'Sales data and metrics',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: sales,
    joins: [
      {
        table: products,
        on: eq(sales.productId, products.id),
        type: 'inner'
      }
    ],
    where: eq(sales.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    customerName: {
      name: 'customerName',
      title: 'Customer Name', 
      sql: sales.customerName, 
      type: 'string' 
    },
    productName: {
      name: 'productName',
      title: 'Product Name', 
      sql: products.name, 
      type: 'string' 
    },
    productCategory: {
      name: 'productCategory',
      title: 'Product Category', 
      sql: products.category, 
      type: 'string' 
    },
    orderDate: {
      name: 'orderDate',
      title: 'Order Date', 
      sql: sales.orderDate, 
      type: 'time' 
    },
  },
  
  measures: {
    totalSales: {
      name: 'totalSales', 
      title: 'Total Sales',
      sql: sales.amount, 
      type: 'sum'
    },
    orderCount: {
      name: 'orderCount', 
      title: 'Number of Orders',
      sql: sales.id, 
      type: 'count'
    },
    averageOrderValue: {
      name: 'averageOrderValue', 
      title: 'Average Order Value',
      sql: sales.amount, 
      type: 'avg'
    },
    totalQuantity: {
      name: 'totalQuantity', 
      title: 'Total Quantity Sold',
      sql: sales.quantity, 
      type: 'sum'
    },
  }
})

export const productsCube = defineCube('Products', {
  title: 'Product Analytics',
  description: 'Product data and metrics',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: products,
    where: eq(products.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    name: {
      name: 'name',
      title: 'Product Name', 
      sql: products.name, 
      type: 'string' 
    },
    category: {
      name: 'category',
      title: 'Category', 
      sql: products.category, 
      type: 'string' 
    },
    createdAt: {
      name: 'createdAt',
      title: 'Created At', 
      sql: products.createdAt, 
      type: 'time' 
    },
  },
  
  measures: {
    count: {
      name: 'count', 
      title: 'Product Count',
      sql: products.id, 
      type: 'count'
    },
    averagePrice: {
      name: 'averagePrice', 
      title: 'Average Price',
      sql: products.price, 
      type: 'avg'
    },
  }
})

// Export all cubes for easy registration
export const allCubes = [salesCube, productsCube]
```

## Step 3: Server Setup

Set up your server with the Hono adapter:

```typescript
// src/server.ts
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createCubeRouter } from 'drizzle-cube/adapters/hono'
import * as schema from './schema'
import { allCubes } from './cubes'

// Database connection
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

// Create Hono app
const app = new Hono()

// Simple security context for demo
const extractSecurityContext = async (c: any) => ({
  organisationId: 1, // In real app: extract from JWT, session, etc.
  userId: 1
})

// Create and mount cube routes
const cubeRouter = createCubeRouter({
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext,
  engineType: 'postgres'
})

// Mount at root - adapter handles basePath internally
app.route('/', cubeRouter)

// Start server
const port = parseInt(process.env.PORT || '8080')
console.log(`🚀 Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch
}
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
const response = await fetch('/cubejs-api/v1/load', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(query)
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

Add a React dashboard with the drizzle-cube client components:

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'
import { CubeProvider, AnalyticsDashboard, QueryBuilder } from 'drizzle-cube/client'

// Default dashboard configuration
const defaultDashboardConfig = {
  portlets: [
    {
      id: 'sales-by-category',
      title: 'Sales by Category',
      chartType: 'bar',
      query: {
        measures: ['Sales.totalSales'],
        dimensions: ['Sales.productCategory']
      },
      layout: { w: 6, h: 6, x: 0, y: 0 }
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
      layout: { w: 6, h: 6, x: 6, y: 0 }
    }
  ]
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'query'>('dashboard')
  const [dashboardConfig, setDashboardConfig] = useState(defaultDashboardConfig)

  // Load dashboard config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('sales-dashboard-config')
    if (savedConfig) {
      try {
        setDashboardConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('Failed to load dashboard config:', error)
      }
    }
  }, [])

  // Save dashboard config to localStorage
  const saveDashboardConfig = (newConfig: any) => {
    setDashboardConfig(newConfig)
    localStorage.setItem('sales-dashboard-config', JSON.stringify(newConfig))
  }

  // Reset to default configuration
  const resetDashboard = () => {
    setDashboardConfig(defaultDashboardConfig)
    localStorage.removeItem('sales-dashboard-config')
  }

  return (
    <CubeProvider apiOptions={{ apiUrl: '/cubejs-api/v1' }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sales Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Analytics dashboard with drizzle-cube
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('query')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'query'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Query Builder
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Analytics Dashboard
                </h2>
                <button
                  onClick={resetDashboard}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-50"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
              <AnalyticsDashboard 
                config={dashboardConfig}
                editable={true}
                onConfigChange={saveDashboardConfig}
              />
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Query Builder
              </h2>
              <div className="bg-white rounded-lg shadow-sm border">
                <QueryBuilder />
              </div>
            </div>
          )}
        </div>
      </div>
    </CubeProvider>
  )
}
```

### Key Features

- **🎯 Interactive Dashboard** - Drag-and-drop layout with resizable charts
- **💾 Local Storage** - Dashboard configuration persists across browser sessions  
- **📊 Multiple Chart Types** - Bar, line, pie, area charts and more
- **🔍 Query Builder** - Interactive tool for building custom queries
- **🎨 Customizable** - Easy to theme and extend with your own components

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