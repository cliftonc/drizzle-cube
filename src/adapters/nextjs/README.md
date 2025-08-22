# Next.js Adapter for Drizzle Cube

The Next.js adapter provides seamless integration between Drizzle Cube and Next.js 15 applications using the App Router. It creates route handlers that expose Cube.js-compatible API endpoints for your analytics and dashboard applications.

## Features

- 🚀 **App Router Support** - Full Next.js 15 App Router integration
- 🔒 **Type Safety** - Complete TypeScript support with Drizzle schema inference
- ⚡ **Edge Runtime** - Optional Edge Runtime support for global deployment
- 🌐 **CORS Support** - Built-in CORS handling for cross-origin requests
- 🛡️ **Security Context** - Flexible authentication and authorization integration
- 📊 **Cube.js Compatible** - Drop-in replacement for Cube.js API endpoints
- 🔄 **Multiple Formats** - Support for both GET and POST requests

## Installation

```bash
npm install drizzle-cube next
```

## Setup Guide

### 1. Define Your Schema

```typescript
// lib/schema.ts
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
// lib/cubes.ts
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

### 1. Create Route Handlers

Create API route handlers in your Next.js app directory:

```typescript
// app/api/cubejs/v1/load/route.ts
import { createLoadHandler } from 'drizzle-cube/adapters/nextjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from '@/lib/schema'
import { employeesCube, departmentsCube } from '@/lib/cubes'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const handler = createLoadHandler({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (request) => {
    // Called for EVERY API request - extract user permissions
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = await validateToken(token)
    
    return {
      organisationId: decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  }
})

export { handler as GET, handler as POST }
```

### 2. Create All Endpoints

For a complete setup, create all four Cube.js API endpoints:

```typescript
// app/api/cubejs/v1/[...endpoint]/route.ts
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from '@/lib/schema'
import { employeesCube, departmentsCube } from '@/lib/cubes'
import { getServerSession } from 'next-auth'

// Create fully connected Drizzle database instance
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const handlers = createCubeHandlers({
  cubes: [employeesCube, departmentsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (request, context) => {
    const session = await getServerSession()
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = await validateToken(token)
    
    return {
      organisationId: session?.user?.organisationId || decoded.orgId,
      userId: decoded.userId,
      roles: decoded.roles
    }
  },
  cors: {
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})

export async function GET(request: NextRequest, context: RouteContext) {
  const { endpoint } = context.params
  
  switch (endpoint[0]) {
    case 'load':
      return handlers.load(request, context)
    case 'meta':
      return handlers.meta(request, context)
    case 'sql':
      return handlers.sql(request, context)
    case 'dry-run':
      return handlers.dryRun(request, context)
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { endpoint } = context.params
  
  switch (endpoint[0]) {
    case 'load':
      return handlers.load(request, context)
    case 'sql':
      return handlers.sql(request, context)
    case 'dry-run':
      return handlers.dryRun(request, context)
    default:
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
```

### 3. Semantic Layer Configuration

```typescript
// lib/cube-config.ts
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { employeesCube, departmentsCube } from './cubes'

// Create fully connected Drizzle database instance
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })

// Create semantic layer and register cubes
export const semanticLayer = new SemanticLayerCompiler({
  drizzle: db,
  schema,
  engineType: 'postgres'
})

// Register your cubes
semanticLayer.registerCube(employeesCube)
semanticLayer.registerCube(departmentsCube)

export { schema }
```

## API Reference

### Route Handler Functions

#### `createLoadHandler(options)`

Creates a route handler for query execution (`/load` endpoint).

```typescript
const loadHandler = createLoadHandler({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => ({ 
    organisationId: 'org-123' 
  })
})

export { loadHandler as GET, loadHandler as POST }
```

#### `createMetaHandler(options)`

Creates a route handler for metadata retrieval (`/meta` endpoint).

```typescript
const metaHandler = createMetaHandler({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => ({ 
    organisationId: 'org-123' 
  })
})

export { metaHandler as GET }
```

#### `createSqlHandler(options)`

Creates a route handler for SQL generation (`/sql` endpoint).

```typescript
const sqlHandler = createSqlHandler({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => ({ 
    organisationId: 'org-123' 
  })
})

export { sqlHandler as GET, sqlHandler as POST }
```

#### `createDryRunHandler(options)`

Creates a route handler for query validation (`/dry-run` endpoint).

```typescript
const dryRunHandler = createDryRunHandler({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => ({ 
    organisationId: 'org-123' 
  })
})

export { dryRunHandler as GET, dryRunHandler as POST }
```

#### `createCubeHandlers(options)`

Convenience function that creates all four handlers at once.

```typescript
const { load, meta, sql, dryRun } = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => ({ 
    organisationId: 'org-123' 
  })
})

// Use in individual route files
export { load as GET, load as POST }  // In load/route.ts
export { meta as GET }                // In meta/route.ts
```

### Configuration Options

#### `NextAdapterOptions`

```typescript
interface NextAdapterOptions<TSchema> {
  semanticLayer: SemanticLayerCompiler<TSchema>  // Semantic layer instance with registered cubes
  drizzle: DrizzleDatabase<TSchema>              // Fully connected Drizzle database instance
  schema?: TSchema                               // Database schema for type inference (recommended)
  getSecurityContext: (request: NextRequest, context?: RouteContext) => SecurityContext | Promise<SecurityContext>
  cors?: NextCorsOptions                         // CORS configuration
  runtime?: 'edge' | 'nodejs'                   // Runtime environment
}
```

#### `NextCorsOptions`

```typescript
interface NextCorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
}
```

## Usage Patterns

### Individual Route Files

Create separate route files for each endpoint:

```
app/api/cubejs/v1/
├── load/route.ts
├── meta/route.ts
├── sql/route.ts
└── dry-run/route.ts
```

```typescript
// app/api/cubejs/v1/load/route.ts
import { createLoadHandler } from 'drizzle-cube/adapters/nextjs'
import { cubeConfig } from '@/lib/cube-config'

const handler = createLoadHandler(cubeConfig)
export { handler as GET, handler as POST }
```

### Catch-All Route

Use a dynamic catch-all route for simpler setup:

```typescript
// app/api/cubejs/v1/[...endpoint]/route.ts
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'
import { cubeConfig } from '@/lib/cube-config'

const handlers = createCubeHandlers(cubeConfig)

export async function GET(request: NextRequest, { params }: { params: { endpoint: string[] } }) {
  const endpoint = params.endpoint[0]
  
  switch (endpoint) {
    case 'load': return handlers.load(request)
    case 'meta': return handlers.meta(request)
    case 'sql': return handlers.sql(request)
    case 'dry-run': return handlers.dryRun(request)
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { endpoint: string[] } }) {
  const endpoint = params.endpoint[0]
  
  switch (endpoint) {
    case 'load': return handlers.load(request)
    case 'sql': return handlers.sql(request)
    case 'dry-run': return handlers.dryRun(request)
    default: return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
}
```

## Authentication & Authorization

### Next-Auth Integration

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    
    return {
      organisationId: session.user.organisationId,
      userId: session.user.id,
      roles: session.user.roles
    }
  }
})
```

### Custom JWT Authentication

```typescript
import { verify } from 'jsonwebtoken'

const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      throw new Error('Missing authorization token')
    }
    
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as any
      return {
        organisationId: payload.orgId,
        userId: payload.sub
      }
    } catch {
      throw new Error('Invalid token')
    }
  }
})
```

### Header-Based Context

```typescript
const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => {
    // Extract from custom headers
    const orgId = request.headers.get('x-organization-id')
    const userId = request.headers.get('x-user-id')
    
    // Or from route parameters
    const routeOrgId = context?.params?.orgId
    
    return {
      organisationId: orgId || routeOrgId,
      userId
    }
  }
})
```

## CORS Configuration

### Basic CORS

```typescript
const handlers = createCubeHandlers({
  // ... other options
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})
```

### Environment-Based CORS

```typescript
const handlers = createCubeHandlers({
  // ... other options
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://app.yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})
```

### Dynamic CORS

```typescript
const handlers = createCubeHandlers({
  // ... other options
  cors: {
    origin: (origin) => {
      // Allow requests from subdomains
      return origin?.endsWith('.yourdomain.com') || 
             origin === 'http://localhost:3000'
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})
```

## Edge Runtime Support

### Basic Edge Configuration

```typescript
// app/api/cubejs/v1/load/route.ts
export const runtime = 'edge'

import { createLoadHandler } from 'drizzle-cube/adapters/nextjs'

const handler = createLoadHandler({
  semanticLayer,
  drizzle: db,
  schema,
  runtime: 'edge', // Must match the export above
  getSecurityContext: async (request) => {
    // Use only Web APIs in Edge Runtime
    const token = request.headers.get('authorization')
    return await validateTokenEdge(token)
  }
})

export { handler as GET, handler as POST }
```

### Edge Runtime Considerations

- **Web APIs Only**: Use only Web APIs, no Node.js specific features
- **Database Connections**: Use edge-compatible database drivers like `@neondatabase/serverless`
- **Authentication**: Use JWT libraries that work in Edge Runtime
- **File System**: No access to Node.js `fs` module

## Server Component Integration

### Server-Side Data Fetching

```typescript
// app/dashboard/page.tsx
import { semanticLayer } from '@/lib/cube-config'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  // Get metadata on server-side for faster initial load
  const metadata = semanticLayer.getMetadata()
  
  // Optionally, pre-fetch some data
  const initialData = await semanticLayer.executeMultiCubeQuery({
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.date'],
    timeDimensions: [{
      dimension: 'Sales.date',
      granularity: 'month',
      dateRange: 'last 12 months'
    }]
  }, { organisationId: 'org-123' })
  
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <DashboardClient 
        initialMetadata={metadata}
        initialData={initialData}
        apiBasePath="/api/cubejs/v1"
      />
    </div>
  )
}
```

### Client Component

```typescript
// app/dashboard/dashboard-client.tsx
'use client'

import { CubeProvider } from 'drizzle-cube/client'

interface DashboardClientProps {
  initialMetadata: any
  initialData?: any
  apiBasePath: string
}

export function DashboardClient({ 
  initialMetadata, 
  initialData, 
  apiBasePath 
}: DashboardClientProps) {
  return (
    <CubeProvider 
      apiUrl={apiBasePath}
      headers={{
        'Authorization': `Bearer ${getToken()}`
      }}
    >
      <Dashboard 
        initialMetadata={initialMetadata}
        initialData={initialData}
      />
    </CubeProvider>
  )
}
```

## Error Handling

### Global Error Handling

```typescript
// app/api/cubejs/v1/error.ts
import { NextRequest } from 'next/server'

export default function ErrorHandler(
  error: Error,
  request: NextRequest
) {
  console.error('Cube API Error:', error)
  
  // Log to external service
  if (process.env.NODE_ENV === 'production') {
    logErrorToService(error, request)
  }
  
  return NextResponse.json({
    error: 'Internal server error',
    requestId: request.headers.get('x-request-id')
  }, { status: 500 })
}
```

### Custom Error Responses

```typescript
const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    try {
      return await getContext(request)
    } catch (error) {
      if (error.message === 'Unauthorized') {
        throw new Error('Please log in to access analytics')
      }
      throw error
    }
  }
})
```

## Performance Optimization

### Caching

```typescript
// app/api/cubejs/v1/meta/route.ts
import { unstable_cache } from 'next/cache'

const getCachedMetadata = unstable_cache(
  async () => semanticLayer.getMetadata(),
  ['cube-metadata'],
  { revalidate: 3600 } // Cache for 1 hour
)

export async function GET() {
  const metadata = await getCachedMetadata()
  return NextResponse.json({ cubes: metadata })
}
```

### Database Connection Pooling

```typescript
// lib/database.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Configure connection pooling
const client = postgres(process.env.DATABASE_URL!, {
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30
})

export const db = drizzle(client, { schema })
```

## Deployment

### Vercel Deployment

```typescript
// vercel.json
{
  "functions": {
    "app/api/cubejs/v1/[...endpoint]/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

### Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Examples

### Complete Example App

See the `/examples/nextjs-app` directory for a complete working example with:
- Authentication using NextAuth.js
- Dashboard with multiple charts
- Real-time data updates
- TypeScript throughout
- Edge Runtime deployment

### Migration from Cube.js

```typescript
// Before (Cube.js)
import { CubejsServerCore } from '@cubejs-backend/server-core'

const serverCore = CubejsServerCore.create({
  schemaPath: 'schema',
  dbType: 'postgres',
  driverFactory: () => new PostgresDriver()
})

// After (Drizzle Cube)
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'

const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => ({ organisationId: 'org-123' })
})
```

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module 'next/server'`
**Solution**: Ensure Next.js 15+ is installed: `npm install next@latest`

**Issue**: Edge Runtime errors
**Solution**: Use only Web APIs and edge-compatible libraries

**Issue**: CORS errors in development
**Solution**: Add localhost to CORS origins:
```typescript
cors: {
  origin: ['http://localhost:3000', 'http://localhost:3001']
}
```

**Issue**: Authentication context not available
**Solution**: Ensure `getSecurityContext` returns the required context:
```typescript
getSecurityContext: async (request) => {
  // Must return an object with organisationId
  return { organisationId: 'required-field' }
}
```

### Debug Mode

```typescript
// Enable debug logging
const handlers = createCubeHandlers({
  // ... other options
  getSecurityContext: async (request, context) => {
    console.log('Request headers:', Object.fromEntries(request.headers))
    console.log('Route context:', context)
    
    const securityContext = await extractContext(request)
    console.log('Security context:', securityContext)
    
    return securityContext
  }
})
```

## Contributing

Found a bug or want to contribute? Please see our [Contributing Guide](../../../CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](../../../LICENSE) file for details.