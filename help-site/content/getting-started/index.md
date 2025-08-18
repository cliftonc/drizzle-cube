# Getting Started with Drizzle Cube

Drizzle Cube is a **Drizzle ORM-first semantic layer** with Cube.js compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.

## What is Drizzle Cube?

Drizzle Cube bridges the gap between your database and your analytics applications by providing:

- **Type-safe semantic layer** - Define cubes, dimensions, and measures with full TypeScript support
- **SQL injection protection** - All queries use Drizzle's parameterized query system
- **Cube.js compatibility** - Drop-in replacement for existing Cube.js implementations
- **Multi-database support** - Works with PostgreSQL, MySQL, and SQLite
- **React components** - Pre-built dashboard and chart components
- **Framework agnostic** - Use with any web framework via adapters

## Core Concepts

### Semantic Layer
The semantic layer is where you define your business logic and data models. Instead of writing raw SQL queries throughout your application, you define **cubes** that encapsulate your data models.

### Cubes
Cubes are the building blocks of your semantic layer. Each cube represents a table or a set of joined tables with defined dimensions and measures.

```typescript
export const salesCube = defineCube(schema, {
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
});
```

### Dimensions
Dimensions are attributes of your data that you can filter, group, and segment by. They are typically categorical data like product names, dates, or customer segments.

### Measures
Measures are the quantitative values you want to analyze - things like revenue, count of orders, average order value, etc.

## Architecture

Drizzle Cube follows a **Drizzle-first architecture**:

1. **Database Schema** - Define your database structure using Drizzle ORM
2. **Semantic Layer** - Create cubes that reference your schema
3. **Query Execution** - Drizzle generates type-safe, parameterized SQL
4. **Framework Integration** - Use adapters to integrate with your web framework
5. **Client Components** - Render data using React components

## Security Model

Security is built into every layer:

- **SQL Injection Protection** - Drizzle's parameterized queries prevent SQL injection
- **Multi-tenant Security** - Every cube should filter by security context
- **Type Safety** - TypeScript prevents runtime errors and data inconsistencies

## Next Steps

Ready to get started? Here's what to do next:

1. [**Installation**](/help/getting-started/installation) - Install Drizzle Cube in your project
2. [**Quick Start**](/help/getting-started/quick-start) - Build your first semantic layer
3. [**Core Concepts**](/help/getting-started/concepts) - Understand cubes, dimensions, and measures in detail

## Example Applications

Check out these example implementations:

- **Basic Example** - Simple analytics dashboard
- **Hono Example** - Full-featured application with Cloudflare Workers
- **Multi-tenant Example** - Enterprise-ready multi-tenant setup

## Community and Support

- **GitHub Repository** - [github.com/cliftonc/drizzle-cube](https://github.com/cliftonc/drizzle-cube)
- **Issues and Bug Reports** - [GitHub Issues](https://github.com/cliftonc/drizzle-cube/issues)
- **Discussions** - [GitHub Discussions](https://github.com/cliftonc/drizzle-cube/discussions)