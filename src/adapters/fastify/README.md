# Fastify Adapter

The Fastify adapter provides Cube.js-compatible API endpoints as a Fastify plugin, leveraging the high performance and TypeScript-first approach of Fastify v5.

## Installation

```bash
npm install drizzle-cube fastify @fastify/cors
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

### Plugin Registration

```typescript
import fastify from 'fastify'
import { cubePlugin } from 'drizzle-cube/adapters/fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema' // Your Drizzle schema
import { employeesCube, departmentsCube } from './cubes' // Your cube definitions

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const server = fastify({
  logger: true
})

await server.register(cubePlugin, {
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (request) => {
    // Called for EVERY API request - extract user permissions
    const token = request.headers.authorization?.replace('Bearer ', '')
    const decoded = await verifyJWT(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

await server.listen({ port: 3000 })
```

### Standalone App

```typescript
import { createCubeApp } from 'drizzle-cube/adapters/fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube, departmentsCube } from './cubes'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const app = createCubeApp({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    const decoded = await validateTokenAndGetContext(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

await app.listen({ port: 3000 })
```

### Manual Registration

```typescript
import fastify from 'fastify'
import { registerCubeRoutes } from 'drizzle-cube/adapters/fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube, departmentsCube } from './cubes'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const server = fastify()

// Your existing routes
server.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Register cube routes
await registerCubeRoutes(server, {
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (request) => {
    const orgId = request.headers['x-org-id']
    return { organisationId: orgId }
  }
})

await server.listen({ port: 3000 })
```

## Configuration Options

### FastifyAdapterOptions

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `cubes` | `Cube[]` | ✅ | - | Array of cube definitions to register |
| `drizzle` | `DrizzleDatabase` | ✅ | - | Fully connected Drizzle database instance |
| `schema` | `TSchema` | ⚠️ | - | Database schema for type inference (recommended) |
| `extractSecurityContext` | `Function` | ✅ | - | Extract security context from HTTP requests (called for every request) |
| `engineType` | `'postgres'\|'mysql'\|'sqlite'` | ❌ | auto-detected | Database engine type |
| `cors` | `FastifyCorsOptions` | ❌ | - | CORS configuration |
| `basePath` | `string` | ❌ | `/cubejs-api/v1` | API base path |
| `bodyLimit` | `number` | ❌ | `10485760` | JSON body parser limit (10MB) |

### Security Context Function

The `getSecurityContext` function receives the Fastify request and should return a `SecurityContext`:

```typescript
const getSecurityContext = async (request: FastifyRequest): Promise<SecurityContext> => {
  // Extract from headers
  const orgId = request.headers['x-organization-id']
  
  // Or from authenticated user
  const user = await request.jwtVerify()
  
  return {
    organisationId: user.orgId,
    userId: user.sub,
    roles: user.roles
  }
}
```

## Advanced Configuration

### With CORS and Authentication

```typescript
import fastify from 'fastify'
import jwt from '@fastify/jwt'
import { cubePlugin } from 'drizzle-cube/adapters/fastify'

const server = fastify({ logger: true })

// Register JWT plugin
await server.register(jwt, {
  secret: process.env.JWT_SECRET
})

// Authentication hook
server.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

await server.register(cubePlugin, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const user = request.user as any
    return {
      organisationId: user.orgId,
      userId: user.sub,
      roles: user.roles
    }
  },
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
      callback(null, allowedOrigins.includes(origin))
    },
    credentials: true
  },
  bodyLimit: 15 * 1024 * 1024 // 15MB
})
```

### Custom Base Path

```typescript
await server.register(cubePlugin, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext,
  basePath: '/api/analytics' // Custom API path
})
```

### Performance Optimization

```typescript
const server = fastify({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  },
  bodyLimit: 20 * 1024 * 1024, // 20MB
  trustProxy: true,
  keepAliveTimeout: 5000,
  connectionTimeout: 10000
})

await server.register(cubePlugin, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext,
  bodyLimit: 15 * 1024 * 1024
})
```

## API Endpoints

The Fastify adapter provides the same Cube.js-compatible endpoints as other adapters:

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

## Schema Validation

Fastify's built-in schema validation is used for request validation:

```typescript
// Automatic validation for all endpoints
{
  body: {
    type: 'object',
    additionalProperties: true
  }
}

{
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    },
    required: ['query']
  }
}
```

## Error Handling

The adapter includes comprehensive error handling:

```typescript
// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error, 'Fastify cube adapter error')
  
  if (reply.statusCode < 400) {
    reply.status(500)
  }
  
  return formatErrorResponse(error, reply.statusCode)
})
```

Error responses follow this format:
```json
{
  "error": "Query validation failed: measure Orders.invalidMeasure not found",
  "status": 400
}
```

## TypeScript Support

The adapter provides full TypeScript support:

```typescript
import type { FastifyAdapterOptions } from 'drizzle-cube/adapters/fastify'

const options: FastifyAdapterOptions<typeof schema> = {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => ({
    organisationId: request.user?.organisationId
  })
}
```

## Performance

- **Fast startup**: Leverages Fastify's optimized routing
- **Low memory**: Efficient request handling
- **High throughput**: Built for high-load scenarios
- **JSON parsing**: Optimized with custom body limits
- **Schema validation**: Built-in request validation
- **Logging**: Structured logging with Pino

## Testing

Use Fastify's built-in testing utilities:

```typescript
import { test } from 'tap'
import { createCubeApp } from 'drizzle-cube/adapters/fastify'

test('cube API', async (t) => {
  const app = createCubeApp({ ... })
  
  const response = await app.inject({
    method: 'GET',
    url: '/cubejs-api/v1/meta'
  })
  
  t.equal(response.statusCode, 200)
  const data = JSON.parse(response.payload)
  t.ok(data.cubes)
})
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cube-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Comparison with Other Adapters

| Feature | Fastify | Express | Hono |
|---------|---------|---------|------|
| Performance | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| TypeScript | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Schema Validation | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| Plugin Ecosystem | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Bundle Size | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Learning Curve | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## Migration from Express

Key differences when migrating from Express:

1. **Plugin system**: Use `server.register()` instead of `app.use()`
2. **Request/Reply**: Different API surface
3. **Schema validation**: Built-in validation
4. **Async/await**: Required for all handlers
5. **Error handling**: Uses `setErrorHandler()`

## Troubleshooting

### Common Issues

**Plugin registration fails:**
```typescript
// ❌ Wrong
fastify.register(cubePlugin, options)

// ✅ Correct
await fastify.register(cubePlugin, options)
```

**CORS not working:**
```typescript
// Make sure @fastify/cors is installed
npm install @fastify/cors
```

**Body parsing errors:**
```typescript
// Increase body limit if needed
{
  bodyLimit: 50 * 1024 * 1024 // 50MB
}
```

**TypeScript errors:**
```typescript
// Use type assertion for complex cases
await fastify.register(cubePlugin as any, options)
```

## Support

- **Framework**: [Fastify v5+](https://fastify.dev/)
- **Node.js**: 18+
- **TypeScript**: 4.5+
- **Dependencies**: `@fastify/cors` (optional)

For issues specific to the Fastify adapter, please check:
1. Fastify version compatibility
2. Plugin registration order
3. Request/response handling differences
4. Schema validation rules