# Hono Adapter

The Hono adapter provides Cube.js-compatible API endpoints for Hono applications, offering high performance and edge runtime compatibility with a modern TypeScript-first API.

## Installation

```bash
npm install drizzle-cube hono
```

## Setup Guide

### 1. Define Your Schema

```typescript
// schema.ts
import { pgTable, integer, text, real, boolean, timestamp } from 'drizzle-orm/pg-core'

export const employees = pgTable('employees', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: real('salary'),
  createdAt: timestamp('created_at').defaultNow()
})

export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: real('budget')
})

export const schema = { employees, departments }
```

### 2. Define Your Cubes

```typescript
// cubes.ts
import { eq } from 'drizzle-orm'
import { defineCube } from 'drizzle-cube/server'
import { employees, departments } from './schema'

export const employeesCube = defineCube('Employees', {
  title: 'Employee Analytics',
  sql: (ctx) => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      type: 'string',
      sql: employees.name
    },
    isActive: {
      name: 'isActive',
      title: 'Active Status',
      type: 'boolean',
      sql: employees.active
    }
  },
  measures: {
    count: {
      name: 'count',
      title: 'Total Employees',
      type: 'count',
      sql: employees.id
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary',
      type: 'avg',
      sql: employees.salary
    }
  }
})

export const departmentsCube = defineCube('Departments', {
  title: 'Department Analytics',
  sql: (ctx) => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),
  dimensions: {
    name: {
      name: 'name',
      title: 'Department Name',
      type: 'string',
      sql: departments.name
    }
  },
  measures: {
    count: {
      name: 'count',
      title: 'Department Count',
      type: 'count',
      sql: departments.id
    }
  }
})
```

## Quick Start

### Basic Integration

```typescript
import { Hono } from 'hono'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema' // Your Drizzle schema
import { employeesCube, departmentsCube } from './cubes' // Your cube definitions

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const app = createCubeApp({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (c) => {
    // Called for EVERY API request - extract user permissions
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    const decoded = await verifyJWT(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

export default app
```

### Mount on Existing App

```typescript
import { Hono } from 'hono'
import { createCubeRoutes } from 'drizzle-cube/adapters/hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube, departmentsCube } from './cubes'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const app = new Hono()

// Your existing routes
app.get('/', (c) => c.json({ message: 'Hello Hono!' }))

// Mount cube routes
const cubeRoutes = createCubeRoutes({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (c) => {
    // Extract organisation ID from headers
    const orgId = c.req.header('x-org-id')
    return { organisationId: orgId }
  }
})

app.route('/api', cubeRoutes)

export default app
```

### Custom Base Path

```typescript
const cubeApp = createCubeApp({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (c) => {
    const user = c.get('user')
    return { organisationId: user?.organisationId }
  },
  basePath: '/analytics' // Custom API path
})

// Routes will be available at:
// /analytics/load, /analytics/meta, etc.
```

## Configuration Options

### HonoAdapterOptions

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `cubes` | `Cube[]` | ✅ | - | Array of cube definitions to register |
| `drizzle` | `DrizzleDatabase` | ✅ | - | Fully connected Drizzle database instance |
| `schema` | `TSchema` | ⚠️ | - | Database schema for type inference (recommended) |
| `extractSecurityContext` | `Function` | ✅ | - | Extract security context from HTTP requests (called for every request) |
| `engineType` | `'postgres'\|'mysql'\|'sqlite'` | ❌ | auto-detected | Database engine type |
| `cors` | `CorsOptions` | ❌ | - | CORS configuration |
| `basePath` | `string` | ❌ | `/cubejs-api/v1` | API base path |

### Security Context Function

The `extractSecurityContext` function is **called for every API request** and extracts security information from the HTTP request. This is your security boundary for multi-tenant applications:

```typescript
const extractSecurityContext = async (c: Context): Promise<SecurityContext> => {
  // Extract from headers
  const orgId = c.req.header('x-organization-id')
  
  // Or from authenticated user (set by middleware)
  const user = c.get('user')
  
  // Or from JWT payload
  const payload = c.get('jwtPayload')
  
  return {
    organisationId: user?.orgId || orgId,
    userId: user?.id || payload?.sub,
    roles: user?.roles || payload?.roles
  }
}
```

**Important**: This function must return consistent security context for the same user across all requests, as it's used to filter data in every database query.

## Advanced Configuration

### With JWT Authentication

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { cors } from 'hono/cors'
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = new Hono()

// CORS middleware
app.use('/api/*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}))

// JWT authentication
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET!
}))

const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const payload = c.get('jwtPayload')
    return {
      organisationId: payload.orgId,
      userId: payload.sub,
      roles: payload.roles
    }
  }
})

app.route('/api', cubeApp)

export default app
```

### Custom Authentication Middleware

```typescript
import { Hono } from 'hono'
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = new Hono()

// Custom auth middleware
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const user = await validateToken(token)
    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const user = c.get('user')
    return {
      organisationId: user.organisationId,
      userId: user.id,
      roles: user.roles
    }
  }
})

app.route('/api', cubeApp)
```

### Edge Runtime Optimization

```typescript
import { Hono } from 'hono'
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  drizzle: db, // Use edge-compatible database
  schema,
  getSecurityContext: async (c) => {
    // Optimized for edge runtime
    const orgId = c.req.header('x-org-id')
    return { organisationId: orgId }
  }
})

// Export for various edge platforms
export default app

// Cloudflare Workers
export default {
  fetch: app.fetch
}

// Vercel Edge Runtime
export const runtime = 'edge'
```

## API Endpoints

The Hono adapter provides the same Cube.js-compatible endpoints as other adapters:

### `POST /cubejs-api/v1/load`
Execute analytical queries.

**Request Body:**
```json
{
  "measures": ["Orders.count", "Orders.totalAmount"],
  "dimensions": ["Orders.status", "Users.city"],
  "filters": [{
    "member": "Orders.status",
    "operator": "equals",
    "values": ["completed"]
  }]
}
```

### `GET /cubejs-api/v1/load?query={encoded_query}`
Execute queries via GET with query string parameter.

### `GET /cubejs-api/v1/meta`
Get cube metadata and schema information.

**Response:**
```json
{
  "cubes": [{
    "name": "Orders",
    "measures": [...],
    "dimensions": [...],
    "segments": [...]
  }]
}
```

### `POST /cubejs-api/v1/sql`
Generate SQL without execution (dry-run).

### `GET /cubejs-api/v1/sql?query={encoded_query}`
Generate SQL via GET request.

### `POST /cubejs-api/v1/dry-run`
Validate queries and analyze complexity.

### `GET /cubejs-api/v1/dry-run?query={encoded_query}`
Validate queries via GET request.

## Error Handling

The adapter includes comprehensive error handling with Hono's error handling patterns:

```typescript
import { HTTPException } from 'hono/http-exception'

// Error responses follow this format:
{
  "error": "Query validation failed: measure Orders.invalidMeasure not found",
  "status": 400
}

// Custom error handling
app.onError((err, c) => {
  console.error('Hono cube adapter error:', err)
  
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      status: err.status
    }, err.status)
  }
  
  return c.json({
    error: 'Internal server error',
    status: 500
  }, 500)
})
```

## TypeScript Support

The adapter provides full TypeScript support with Hono's type system:

```typescript
import type { HonoAdapterOptions } from 'drizzle-cube/adapters/hono'
import type { Context } from 'hono'

// Type-safe configuration
const options: HonoAdapterOptions<typeof schema> = {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c: Context) => ({
    organisationId: c.get('user')?.organisationId
  })
}

// Type-safe context access
type Variables = {
  user: { id: string; organisationId: string }
  jwtPayload: { sub: string; orgId: string }
}

const app = new Hono<{ Variables: Variables }>()
```

## Middleware Integration

### Built-in Hono Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { timing } from 'hono/timing'
import { requestId } from 'hono/request-id'
import { compress } from 'hono/compress'

const app = new Hono()

// Performance and observability
app.use('*', logger())
app.use('*', timing())
app.use('*', requestId())
app.use('*', compress())

const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext
})

app.route('/api', cubeApp)
```

### Rate Limiting

```typescript
import { Hono } from 'hono'
import { rateLimiter } from 'hono/rate-limiter'

const app = new Hono()

// Rate limiting middleware
app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown'
}))

const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext
})

app.route('/api', cubeApp)
```

## Performance

- **High performance**: Optimized for speed and low latency
- **Edge runtime**: Compatible with Cloudflare Workers, Vercel Edge
- **Small bundle**: Minimal overhead and dependencies
- **Tree shaking**: Only includes used functionality
- **Streaming**: Supports streaming responses
- **Modern APIs**: Uses modern Web APIs

## Platform Deployment

### Cloudflare Workers

```typescript
// wrangler.toml
name = "cube-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production.vars]
DATABASE_URL = "your-database-url"
JWT_SECRET = "your-jwt-secret"
```

```typescript
// src/index.ts
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    return await getContextFromToken(token)
  }
})

export default app
```

### Vercel Edge Runtime

```typescript
// api/cube/[...route].ts
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { handle } from 'hono/vercel'

export const runtime = 'edge'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext
})

export const GET = handle(app)
export const POST = handle(app)
```

### Deno Deploy

```typescript
// main.ts
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext
})

Deno.serve(app.fetch)
```

### Bun

```typescript
// server.ts
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext
})

export default {
  port: 3000,
  fetch: app.fetch
}
```

## Testing

Use Hono's testing utilities:

```typescript
import { testClient } from 'hono/testing'
import { createCubeApp } from 'drizzle-cube/adapters/hono'

describe('Cube API', () => {
  const app = createCubeApp({
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async () => ({ organisationId: 'test-org' })
  })
  
  const client = testClient(app)

  it('should return metadata', async () => {
    const res = await client.meta.$get()
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.cubes).toBeDefined()
  })

  it('should execute queries', async () => {
    const query = {
      measures: ['Orders.count'],
      dimensions: ['Orders.status']
    }

    const res = await client.load.$post({ json: query })
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.data).toBeDefined()
  })
})
```

## Comparison with Other Adapters

| Feature | Hono | Express | Fastify | Next.js |
|---------|------|---------|---------|---------|
| Performance | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| TypeScript | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Edge Runtime | ⭐⭐⭐ | ❌ | ❌ | ⭐⭐⭐ |
| Bundle Size | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Learning Curve | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Platform Support | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |

## Migration from Other Adapters

### From Express

Key differences when migrating from Express:
1. **Context API**: Use Hono's `c` context instead of `req`/`res`
2. **Middleware**: Different middleware system and patterns
3. **Routing**: Hono's routing API
4. **Edge compatibility**: Async/await patterns optimized for edge
5. **Type safety**: Enhanced TypeScript support

### From Fastify

Key differences when migrating from Fastify:
1. **Plugin system**: No plugin registration, direct middleware
2. **Context**: Single context object instead of request/reply
3. **Schema validation**: Manual validation or third-party libraries
4. **Edge runtime**: Edge-first design patterns

## Troubleshooting

### Common Issues

**Edge runtime compatibility:**
```typescript
// Use edge-compatible database connections
import { neon } from '@neondatabase/serverless'
const db = drizzle(neon(process.env.DATABASE_URL))
```

**Context access:**
```typescript
// Access context correctly
const getSecurityContext = async (c) => {
  const user = c.get('user') // From middleware
  const header = c.req.header('x-org-id') // From headers
  return { organisationId: user?.orgId || header }
}
```

**CORS issues:**
```typescript
// Configure CORS properly for your platform
import { cors } from 'hono/cors'

app.use('/api/*', cors({
  origin: ['https://your-domain.com'],
  credentials: true
}))
```

**Bundle size:**
```typescript
// Tree shake unused functionality
import { createCubeApp } from 'drizzle-cube/adapters/hono'
// Don't import entire Hono unless needed
```

## Support

- **Framework**: Hono v4+
- **Runtime**: Node.js 18+, Deno, Bun, Cloudflare Workers, Vercel Edge
- **TypeScript**: 4.5+
- **Dependencies**: None (Hono is peer dependency)

For Hono-specific issues, please check:
1. Runtime compatibility (edge vs Node.js)
2. Context access patterns
3. Middleware execution order
4. Platform-specific configurations