# Express Adapter

The Express adapter provides Cube.js-compatible API endpoints for Express.js applications, offering a familiar and flexible integration path for Node.js web applications.

## Installation

```bash
npm install drizzle-cube express cors
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

### Router Integration

```typescript
import express from 'express'
import { createCubeRouter } from 'drizzle-cube/adapters/express'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema' // Your Drizzle schema
import { employeesCube, departmentsCube } from './cubes' // Your cube definitions

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const app = express()

const cubeRouter = createCubeRouter({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (req, res) => {
    // Called for EVERY API request - extract user permissions
    const token = req.headers.authorization?.replace('Bearer ', '')
    const decoded = await verifyJWT(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

app.use('/', cubeRouter) // defaults to /cubejs-api/v1
app.listen(3000)
```

### Standalone App

```typescript
import { createCubeApp } from 'drizzle-cube/adapters/express'
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
  extractSecurityContext: async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const decoded = await validateTokenAndGetContext(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

app.listen(3000, () => {
  console.log('Cube API server running on port 3000') // defaults to /cubejs-api/v1
})
```

### Mount on Existing App

```typescript
import express from 'express'
import { mountCubeRoutes } from 'drizzle-cube/adapters/express'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube, departmentsCube } from './cubes'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const app = express()

// Your existing routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

// Mount cube routes
mountCubeRoutes(app, {
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (req, res) => {
    const orgId = req.headers['x-org-id']
    return { organisationId: orgId }
  },
  basePath: '/analytics' // Custom base path
})

app.listen(3000)
```

## Configuration Options

### ExpressAdapterOptions

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `cubes` | `Cube[]` | ✅ | - | Array of cube definitions to register |
| `drizzle` | `DrizzleDatabase` | ✅ | - | Fully connected Drizzle database instance |
| `schema` | `TSchema` | ⚠️ | - | Database schema for type inference (recommended) |
| `extractSecurityContext` | `Function` | ✅ | - | Extract security context from HTTP requests (called for every request) |
| `engineType` | `'postgres'\|'mysql'\|'sqlite'` | ❌ | auto-detected | Database engine type |
| `getSecurityContext` | `Function` | ✅ | - | Function to extract security context from request |
| `cors` | `CorsOptions` | ❌ | - | CORS configuration |
| `basePath` | `string` | ❌ | `/cubejs-api/v1` | API base path |
| `jsonLimit` | `string` | ❌ | `'10mb'` | JSON body parser limit |

### Security Context Function

The `getSecurityContext` function receives the Express request and should return a `SecurityContext`:

```typescript
const getSecurityContext = async (req: Request): Promise<SecurityContext> => {
  // Extract from headers
  const orgId = req.headers['x-organization-id']
  
  // Or from authenticated user
  const user = req.user // From passport, express-jwt, etc.
  
  return {
    organisationId: user.orgId,
    userId: user.id,
    roles: user.roles
  }
}
```

## Advanced Configuration

### With CORS and Authentication

```typescript
import express from 'express'
import jwt from 'express-jwt'
import cors from 'cors'
import { createCubeApp } from 'drizzle-cube/adapters/express'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req) => {
    const user = req.user as any
    return {
      organisationId: user.orgId,
      userId: user.sub,
      roles: user.roles
    }
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id']
  },
  jsonLimit: '15mb'
})

// Global JWT authentication
app.use(jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
}))

app.listen(3000)
```

### Custom Middleware

```typescript
import express from 'express'
import { createCubeRouter } from 'drizzle-cube/adapters/express'

const app = express()

// Global middleware
app.use(express.json({ limit: '20mb' }))
app.use(cors())

// Custom authentication middleware
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    req.user = await validateToken(token)
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

app.use('/api', authenticateUser)

const cubeRouter = createCubeRouter({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req) => ({
    organisationId: req.user.organisationId,
    userId: req.user.id
  })
})

app.use('/api', cubeRouter)
```

### Performance Optimization

```typescript
import express from 'express'
import compression from 'compression'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()

// Security and performance middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use('/api', limiter)

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext,
  jsonLimit: '15mb'
})

app.use('/api', cubeApp)
```

## API Endpoints

The Express adapter provides the same Cube.js-compatible endpoints as other adapters:

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

The adapter includes comprehensive error handling with Express v5 async error support:

```typescript
// Automatic async error handling (Express v5)
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Express cube adapter error:', error)
  
  if (res.headersSent) {
    return next(error)
  }
  
  const status = (error as any).status || (error as any).statusCode || 500
  res.status(status).json({
    error: error.message || 'Internal server error',
    status
  })
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
import type { ExpressAdapterOptions } from 'drizzle-cube/adapters/express'
import type { Request, Response } from 'express'

const options: ExpressAdapterOptions<typeof schema> = {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req: Request) => ({
    organisationId: req.user?.organisationId
  })
}
```

## Middleware Integration

### Passport.js

```typescript
import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await findUserById(payload.sub)
    return done(null, user)
  } catch (error) {
    return done(error, false)
  }
}))

app.use(passport.initialize())
app.use('/api', passport.authenticate('jwt', { session: false }))

const cubeRouter = createCubeRouter({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req) => ({
    organisationId: req.user.organisationId,
    userId: req.user.id
  })
})
```

### Express Session

```typescript
import session from 'express-session'
import connectRedis from 'connect-redis'
import redis from 'redis'

const RedisStore = connectRedis(session)
const redisClient = redis.createClient()

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}))

const cubeRouter = createCubeRouter({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req) => ({
    organisationId: req.session.user?.organisationId,
    userId: req.session.user?.id
  })
})
```

## Performance

- **Familiar API**: Leverages Express.js ecosystem
- **Middleware support**: Full Express middleware compatibility
- **Flexible routing**: Router, app mounting, and standalone options
- **JSON parsing**: Configurable body limits
- **Error handling**: Express v5 async error support
- **Security**: Helmet, rate limiting, and CORS support

## Testing

Use Express testing utilities like Supertest:

```typescript
import request from 'supertest'
import { createCubeApp } from 'drizzle-cube/adapters/express'

describe('Cube API', () => {
  const app = createCubeApp({
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async () => ({ organisationId: 'test-org' })
  })

  it('should return metadata', async () => {
    const response = await request(app)
      .get('/cubejs-api/v1/meta')
      .expect(200)
    
    expect(response.body.cubes).toBeDefined()
  })

  it('should execute queries', async () => {
    const query = {
      measures: ['Orders.count'],
      dimensions: ['Orders.status']
    }

    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send(query)
      .expect(200)
    
    expect(response.body.data).toBeDefined()
  })
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
    name: 'cube-express-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
}
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Comparison with Other Adapters

| Feature | Express | Fastify | Hono | Next.js |
|---------|---------|---------|------|---------|
| Performance | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| TypeScript | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Middleware Ecosystem | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Learning Curve | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| Bundle Size | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Community | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ |

## Migration from Other Adapters

### From Fastify

Key differences when migrating from Fastify:
1. **Middleware**: Use `app.use()` instead of `server.register()`
2. **Request/Response**: Standard Express req/res objects
3. **Error handling**: Traditional Express error middleware
4. **Body parsing**: Use `express.json()` explicitly
5. **Validation**: Manual or third-party validation libraries

### From Hono

Key differences when migrating from Hono:
1. **Context**: Express req/res instead of Hono context
2. **Middleware**: Express middleware system
3. **Routing**: Express Router patterns
4. **Environment**: Node.js only (no edge runtime)

## Troubleshooting

### Common Issues

**Body parsing errors:**
```typescript
// Make sure express.json() is configured
app.use(express.json({ limit: '10mb' }))
```

**CORS issues:**
```typescript
// Install and configure CORS middleware
npm install cors
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}))
```

**Async error handling:**
```typescript
// For Express v4, use express-async-errors
npm install express-async-errors
require('express-async-errors')

// Or wrap async handlers manually
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
```

**Route conflicts:**
```typescript
// Mount cube routes after other routes
app.use('/other-routes', otherRouter)
app.use('/api', cubeRouter) // Mount last
```

**Security context issues:**
```typescript
// Ensure middleware runs before cube routes
app.use(authenticationMiddleware)
app.use('/api', cubeRouter)
```

## Support

- **Framework**: Express.js 4.x, 5.x
- **Node.js**: 18+
- **TypeScript**: 4.5+
- **Dependencies**: `cors` (optional), `helmet` (recommended)

For Express-specific issues, please check:
1. Middleware execution order
2. Express version compatibility
3. Error handling configuration
4. Body parsing setup