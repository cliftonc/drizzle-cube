# 🐲 Drizzle Cube

**Drizzle ORM-first semantic layer with Cube.js compatibility**

<img width="824" height="832" alt="home" src="https://github.com/user-attachments/assets/205f73ff-d2d3-4f9c-9777-f936540d5a2a" />

Transform your Drizzle schema into a powerful, type-safe analytics platform with SQL injection protection and full TypeScript support.

📖 **[Documentation](https://www.drizzle-cube.dev/)** 
🚀 **[Try the Sandbox](https://try.drizzle-cube.dev/)**

[![NPM Version](https://img.shields.io/npm/v/drizzle-cube)](https://www.npmjs.com/package/drizzle-cube)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.44.4+-green)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4+-06B6D4)](https://tailwindcss.com/)
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
  department: integer('department'),
  organisation: integer('organisation').notNull()
})

export const departments = pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisation: integer('organisation').notNull()
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
  sql: (ctx) => ({
    from: schema.employees,
    where: eq(schema.employees.organisation, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      type: 'string',
      sql: schema.employees.name
    },
    email: {
      name: 'email',
      title: 'Email',
      type: 'string',
      sql: schema.employees.email
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Total Employees',
      type: 'count',
      sql: schema.employees.id
    }
  }
})
```

### 4. Setup API Server

```typescript
// server.ts (Hono example)
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube } from './cubes'

const db = drizzle(postgres(process.env.DATABASE_URL!), { schema })

const app = createCubeApp({
  cubes: [employeesCube],
  drizzle: db,
  schema,
  getSecurityContext: async () => ({
    organisationId: 1 // Your auth logic here
  })
})

export default app
```

### 5. Query from Frontend

```typescript
// Use built-in React components
import { QueryBuilder, AnalyticsDashboard } from 'drizzle-cube/client'

function App() {
  return (
    <div>
      <QueryBuilder apiUrl="/cubejs-api/v1" />
      <AnalyticsDashboard 
        config={dashboardConfig} 
        baseUrl="/cubejs-api/v1" 
      />
    </div>
  )
}
```

## Key Features

🔒 **SQL Injection Proof** - All queries use Drizzle's parameterized SQL
🛡️ **Type Safe** - Full TypeScript inference from your database schema
⚡ **Performance** - Prepared statements and query optimization
🧩 **Cube.js Compatible** - Works with existing Cube.js React components
🎯 **Zero Config** - Infer cube definitions from your Drizzle schema
🎨 **Themeable** - Built-in light/dark themes with CSS variables


## Supported Features

✅ **Multiple Database Types** - PostgreSQL, MySQL
✅ **Framework Adapters** - Hono, Express, Fastify, Next.js
✅ **Full Type Safety** - Complete TypeScript inference
✅ **All SQL Features** - Joins, CTEs, subqueries, window functions
✅ **Cube.js Compatibility** - Drop-in replacement for existing apps
✅ **Light/Dark Themes** - Automatic theme support with CSS custom properties

## Theming

Drizzle Cube supports light and dark themes out of the box. All components automatically adapt to your app's theme using CSS custom properties.

### Quick Start

```typescript
import { isDarkMode, watchThemeChanges } from 'drizzle-cube/client'

// Toggle dark mode
document.documentElement.classList.toggle('dark')

// Or use data-theme attribute
document.documentElement.setAttribute('data-theme', 'dark')

// Watch for theme changes
watchThemeChanges((isDark) => {
  console.log('Theme changed:', isDark ? 'dark' : 'light')
})
```

### Customization

Override CSS variables in your app's stylesheet:

```css
:root {
  --dc-primary: #3b82f6;        /* Primary color */
  --dc-surface: #ffffff;         /* Background */
  --dc-text: #111827;           /* Text color */
}

.dark {
  --dc-primary: #60a5fa;
  --dc-surface: #1e293b;
  --dc-text: #f1f5f9;
}
```

**[Complete Theming Guide →](./docs/THEMING.md)**

## Documentation

 - 📚 **[Full Documentation](https://www.drizzle-cube.dev/)** - Complete guides and API reference
 - 🚀 **[Try the Sandbox](https://try.drizzle-cube.dev/)** - Working example version to experiment with

### Local Development
```bash
npm run dev
```

## Examples

- **[Hono Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/hono)** - Full-featured dashboard with Cloudflare Workers support
- **[Express Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/express)** - Simple Express.js server with React dashboard
- **[Fastify Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/fastify)** - High-performance Fastify server with React client
- **[Next.js Example](https://github.com/cliftonc/drizzle-cube/tree/main/examples/nextjs)** - Full-stack Next.js app with API routes

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

## Roadmap

- 🔄 **Pre-aggregations** - Materialized view support
- 🔄 **Real-time Updates** - WebSocket support
- 🔄 **Query Caching** - Redis integration

## License

MIT © [Clifton Cunningham](https://github.com/cliftonc)

---

**Built with ❤️ for the Drizzle ORM community**
