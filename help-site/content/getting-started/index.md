# Getting Started with Drizzle Cube

Drizzle Cube is a **Drizzle ORM-first semantic layer** with [Cube.js](https://cube.dev) compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.

## What is Drizzle Cube?

Drizzle Cube bridges the gap between your database and your analytics applications by providing:

- **Type-safe semantic layer** - Define cubes, dimensions, and measures with full TypeScript support
- **SQL injection protection** - All queries use Drizzle's parameterized query system
- **[Cube.js](https://cube.dev) compatibility** - Drop-in replacement for existing [Cube.js](https://cube.dev) implementations
- **Multi-database support** - Supports PostgreSQL (including Neon) and MySQL, with SQLite coming soon
- **React components** - Pre-built dashboard and chart components
- **Framework agnostic** - Use with any web framework via adapters

## Core Concepts

### Semantic Layer
The **semantic layer** is a business-friendly abstraction over your database that sits between your raw data and your analytics applications. Instead of writing raw SQL queries throughout your application, you define **cubes** that encapsulate your business logic and provide:

- **Consistent metrics** - Define calculations once, use everywhere
- **Security by default** - Multi-tenant isolation and access control
- **Business terminology** - Use familiar names instead of database columns
- **Type safety** - Full TypeScript support prevents runtime errors

### Cubes
**Cubes** are the building blocks of your semantic layer. Each cube represents a business entity (like Sales, Users, Products) with:

- **Dimensions** - Attributes you can filter and group by (like product category, customer name)
- **Measures** - Numeric values you want to analyze (like total revenue, order count)
- **Security context** - Automatic multi-tenant isolation

```typescript
export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    productName: { sql: schema.sales.productName, type: 'string' },
    orderDate: { sql: schema.sales.orderDate, type: 'time' }
  },
  
  measures: {
    totalSales: { sql: schema.sales.amount, type: 'sum' },
    orderCount: { sql: schema.sales.id, type: 'count' }
  }
});
```

### Query Structure
When you query cubes, you specify what you want to analyze:

```json
{
  "measures": ["Sales.totalSales", "Sales.orderCount"],
  "dimensions": ["Sales.productName"], 
  "timeDimensions": [{
    "dimension": "Sales.orderDate",
    "granularity": "month"
  }],
  "filters": [{
    "member": "Sales.productName",
    "operator": "equals", 
    "values": ["Electronics"]
  }]
}
```

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
3. [**Scaling Your SaaS**](/help/getting-started/scaling) - Learn how Drizzle Cube grows with your business
4. [**Semantic Layer**](/help/semantic-layer) - Deep dive into cubes, dimensions, and measures

## Example Applications

Check out these example implementations:

- **Basic Example** - Simple analytics dashboard
- **[Hono Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/hono)** - Full-featured application with Cloudflare Workers
- **Multi-tenant Example** - Enterprise-ready multi-tenant setup

## Community and Support

- **GitHub Repository** - [github.com/cliftonc/drizzle-cube](https://github.com/cliftonc/drizzle-cube)
- **Issues and Bug Reports** - [GitHub Issues](https://github.com/cliftonc/drizzle-cube/issues)
- **Discussions** - [GitHub Discussions](https://github.com/cliftonc/drizzle-cube/discussions)