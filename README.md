# 🐲 Drizzle Cube

**Drizzle ORM-first semantic layer with Cube.js compatibility**

Transform your Drizzle schema into a powerful, type-safe analytics platform with SQL injection protection and full TypeScript support.

📖 **[Documentation](https://www.drizzle-cube.dev/)** 
🚀 **[Try the Sandbox](https://try.drizzle-cube.dev/)**

[![NPM Version](https://img.shields.io/npm/v/drizzle-cube)](https://www.npmjs.com/package/drizzle-cube)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.33+-green)](https://orm.drizzle.team/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Why Drizzle Cube?

🔒 **SQL Injection Proof** - All queries use Drizzle's parameterized SQL  
🛡️ **Type Safe** - Full TypeScript inference from your database schema  
⚡ **Performance** - Prepared statements and query optimization  
🧩 **Cube.js Compatible** - Works with existing Cube.js React components  
🎯 **Zero Config** - Infer cube definitions from your Drizzle schema  

## Quick Start

### 1. Install

```bash
npm install drizzle-cube drizzle-orm
```

### 2. Define Your Schema

```typescript
// schema.ts
import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core'

export const employees = pgTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: integer('salary')
})

export const departments = pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull()
})

export const schema = { employees, departments }
```

### 3. Create Type-Safe Cubes

```typescript
// cubes.ts
import { defineCube } from 'drizzle-cube/server'
import { eq } from 'drizzle-orm'
import { schema } from './schema'

export const employeesCube = defineCube('Employees', {
  title: 'Employee Analytics',
  
  // Use Drizzle query structure for type safety
  sql: (ctx) => ({
    from: schema.employees,
    joins: [
      {
        table: schema.departments,
        on: eq(schema.employees.departmentId, schema.departments.id),
        type: 'left'
      }
    ],
    where: eq(schema.employees.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      sql: schema.employees.name,
      type: 'string'
    },
    email: {
      name: 'email', 
      title: 'Email Address',
      sql: schema.employees.email,
      type: 'string'
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      sql: schema.departments.name,
      type: 'string'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Total Employees',
      sql: schema.employees.id,
      type: 'count'
    },
    totalSalary: {
      name: 'totalSalary',
      title: 'Total Salary',
      sql: schema.employees.salary,
      type: 'sum',
      format: 'currency'
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary', 
      sql: schema.employees.salary,
      type: 'avg',
      format: 'currency'
    }
  }
})
```

### 4. Setup API Server

```typescript
// server.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube } from './cubes'

// Setup Drizzle
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

// Create semantic layer
const semanticLayer = new SemanticLayerCompiler({
  drizzle: db,
  schema,
  engineType: 'postgres'
})
semanticLayer.registerCube(employeesCube)

// Create API server with Cube.js compatibility
const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => ({
    organisationId: c.get('user')?.organisationId
  })
})

export default app
```

### 5. Query from Frontend

```typescript
// Use with Cube.js React SDK
import { useCubeQuery } from '@cubejs-client/react'

function EmployeeStats() {
  const { resultSet, isLoading } = useCubeQuery({
    measures: ['Employees.count', 'Employees.avgSalary'],
    dimensions: ['Employees.departmentName'],
    filters: [
      { member: 'Employees.active', operator: 'equals', values: [true] }
    ]
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <table>
      {resultSet.tablePivot().map((row, i) => (
        <tr key={i}>
          <td>{row['Employees.departmentName']}</td>
          <td>{row['Employees.count']}</td>
          <td>${row['Employees.avgSalary']}</td>
        </tr>
      ))}
    </table>
  )
}
```

## Key Features

### 🔐 Security First

All SQL is generated using Drizzle's parameterized queries, making SQL injection impossible:

```typescript
// ❌ Vulnerable (string concatenation)
const sql = `WHERE name = '${userInput}'`

// ✅ Safe (Drizzle parameterization)  
const condition = eq(schema.employees.name, userInput)
```

### 🏗️ Type Safety

Get full TypeScript support from your database schema to your analytics:

```typescript
const cube = defineCube('Employees', {
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      sql: schema.employees.name,        // ✅ Type-safe
      type: 'string'
    },
    invalid: {
      name: 'invalid',
      sql: schema.employees.invalidCol,  // ❌ TypeScript error
      type: 'string'
    }
  }
})
```

### ⚡ Performance

- **Prepared Statements**: Drizzle generates optimized prepared statements
- **Query Planning**: Database optimizes repeated queries automatically  
- **Connection Pooling**: Leverages Drizzle's connection management

### 🧩 Framework Support

Works with multiple frameworks via adapter pattern:

- **Hono** - Built-in adapter
- **Express** - Coming soon
- **Fastify** - Coming soon
- **Next.js** - Coming soon

## Advanced Usage


### Advanced Security with Row-Level Security

```typescript
import { and, sql } from 'drizzle-orm'

const secureCube = defineCube('SecureEmployees', {
  title: 'Secure Employee Data',
  
  sql: (ctx) => ({
    from: schema.employees,
    where: and(
      eq(schema.employees.organisationId, ctx.securityContext.organisationId),
      // Only show employees user has permission to see
      ctx.securityContext.role === 'admin' 
        ? sql`true`
        : eq(schema.employees.managerId, ctx.securityContext.userId)
    )
  }),
  
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      sql: schema.employees.name,
      type: 'string'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Employee Count',
      sql: schema.employees.id,
      type: 'count'
    }
  }
})
```


## API Reference

### Core Functions

- `defineCube(name, definition)` - Create type-safe cube with name and configuration
- `SemanticLayerCompiler({ drizzle, schema, engineType })` - Setup semantic layer compiler
- `createCubeApp(options)` - Create Cube.js-compatible API server

### Supported Drizzle Features

- ✅ **All Database Types** - PostgreSQL, MySQL, SQLite
- ✅ **Query Builder** - Full Drizzle query builder support
- ✅ **Schema References** - Direct column references
- ✅ **SQL Templates** - Raw SQL with parameterization
- ✅ **Aggregations** - count, sum, avg, min, max, countDistinct
- ✅ **Joins** - Inner, left, right, full outer joins
- ✅ **CTEs** - Common table expressions
- ✅ **Subqueries** - Nested query support
- ✅ **Window Functions** - Advanced analytics
- ✅ **JSON Operations** - PostgreSQL JSON/JSONB support

### Filter Operators

Supports all Cube.js filter operators with Drizzle safety:

- `equals`, `notEquals` → `eq()`, `ne()`
- `contains`, `notContains` → `ilike()`, `notIlike()`  
- `gt`, `gte`, `lt`, `lte` → `gt()`, `gte()`, `lt()`, `lte()`
- `set`, `notSet` → `isNotNull()`, `isNull()`
- `inDateRange` → `and(gte(), lte())`

## Documentation

📚 **[Full Documentation](https://www.drizzle-cube.dev/)** - Complete guides and API reference
 🚀 **[Try the Sandbox](https://try.drizzle-cube.dev/)** - Working example version to experiment with

### Local Development
```bash
# Run documentation site locally
npm run dev:help

# Build documentation site
npm run build:help
```

## Examples

- **[Hono Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/hono)** - Full-featured dashboard with Cloudflare Workers

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

## Roadmap

- 🔄 **Express Adapter** - Express.js integration
- 🔄 **Fastify Adapter** - Fastify integration  
- 🔄 **Next.js Adapter** - Next.js API routes
- 🔄 **Pre-aggregations** - Materialized view support
- 🔄 **Real-time Updates** - WebSocket support
- 🔄 **Query Caching** - Redis integration

## License

MIT © [Clifton Cunningham](https://github.com/cliftonc)

---

**Built with ❤️ for the Drizzle ORM community**