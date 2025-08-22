# Next.js Adapter Implementation Plan

## Overview

Implementation plan for creating a Drizzle Cube adapter for Next.js 15, leveraging the App Router and Route Handlers with the shared utilities architecture.

## Framework Details

**Next.js Version**: 15.5 (latest)  
**Runtime Support**: Edge Runtime + Node.js Runtime (stable)  
**Key Features**: App Router, Route Handlers, Web APIs, Typed Routes, Middleware

## Implementation Structure

### Directory Structure
```
src/adapters/nextjs/
├── index.ts          # Route handler factories
├── middleware.ts     # Optional middleware utilities
└── README.md         # Next.js-specific documentation
```

### Core Functions to Implement

```typescript
// Route handler factories for App Router
export function createLoadHandler<TSchema>(
  options: NextAdapterOptions<TSchema>
): RouteHandler

export function createMetaHandler<TSchema>(
  options: NextAdapterOptions<TSchema>
): RouteHandler

export function createSqlHandler<TSchema>(
  options: NextAdapterOptions<TSchema>
): RouteHandler

export function createDryRunHandler<TSchema>(
  options: NextAdapterOptions<TSchema>
): RouteHandler

// Convenience function to create all handlers
export function createCubeHandlers<TSchema>(
  options: NextAdapterOptions<TSchema>
): CubeHandlers

// Optional middleware for authentication
export function createCubeMiddleware<TSchema>(
  options: NextMiddlewareOptions<TSchema>
): MiddlewareFunction
```

## Technical Requirements

### Dependencies
```json
{
  "peerDependencies": {
    "next": "^15.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### Adapter Options Interface
```typescript
export interface NextAdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  semanticLayer: SemanticLayerCompiler<TSchema>
  drizzle: DrizzleDatabase<TSchema>
  schema?: TSchema
  getSecurityContext: (request: NextRequest, context?: RouteContext) => SecurityContext | Promise<SecurityContext>
  cors?: NextCorsOptions
  runtime?: 'edge' | 'nodejs' // default: 'nodejs'
}

export interface CubeHandlers {
  load: RouteHandler
  meta: RouteHandler
  sql: RouteHandler
  dryRun: RouteHandler
}

export type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<Response>
```

## Implementation Details

### 1. Route Handler Factories

Using Next.js 15 App Router pattern with Web APIs:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'

export function createLoadHandler<TSchema>(
  options: NextAdapterOptions<TSchema>
): RouteHandler {
  return async function loadHandler(request: NextRequest, context: RouteContext) {
    try {
      let query: SemanticQuery

      if (request.method === 'POST') {
        query = await request.json()
        query = query.query || query // Handle nested format
      } else if (request.method === 'GET') {
        const queryParam = request.nextUrl.searchParams.get('query')
        if (!queryParam) {
          return NextResponse.json(
            formatErrorResponse('Query parameter is required'),
            { status: 400 }
          )
        }
        query = JSON.parse(queryParam)
      } else {
        return NextResponse.json(
          formatErrorResponse('Method not allowed'),
          { status: 405 }
        )
      }

      const securityContext = await options.getSecurityContext(request, context)
      
      const validation = options.semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return NextResponse.json(
          formatErrorResponse(`Query validation failed: ${validation.errors.join(', ')}`),
          { status: 400 }
        )
      }

      const result = await options.semanticLayer.executeMultiCubeQuery(query, securityContext)
      const response = formatCubeResponse(query, result, options.semanticLayer)
      
      return NextResponse.json(response, {
        headers: options.cors ? getCorsHeaders(request, options.cors) : {}
      })
      
    } catch (error) {
      console.error('Next.js load handler error:', error)
      return NextResponse.json(
        formatErrorResponse(error),
        { status: 500 }
      )
    }
  }
}
```

### 2. App Router Integration Pattern

The adapter creates route handlers that users place in their `app/` directory:

```typescript
// app/api/cubejs/v1/load/route.ts
import { createLoadHandler } from 'drizzle-cube/adapters/nextjs'
import { semanticLayer, db, schema } from '@/lib/cube-config'

const handler = createLoadHandler({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const session = await getServerSession(request)
    return {
      organisationId: session?.user?.organisationId
    }
  }
})

export { handler as GET, handler as POST }
```

### 3. Convenience Handler Creator

```typescript
export function createCubeHandlers<TSchema>(
  options: NextAdapterOptions<TSchema>
): CubeHandlers {
  return {
    load: createLoadHandler(options),
    meta: createMetaHandler(options),
    sql: createSqlHandler(options),
    dryRun: createDryRunHandler(options)
  }
}

// Usage in route files
const { load, meta, sql, dryRun } = createCubeHandlers({
  // ... options
})

export { load as GET, load as POST } // In load/route.ts
export { meta as GET }               // In meta/route.ts
export { sql as GET, sql as POST }   // In sql/route.ts
export { dryRun as GET, dryRun as POST } // In dry-run/route.ts
```

### 4. CORS Handling

Next.js doesn't have built-in CORS middleware, so we implement it manually:

```typescript
interface NextCorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
}

function getCorsHeaders(request: NextRequest, corsOptions: NextCorsOptions): HeadersInit {
  const origin = request.headers.get('origin')
  const headers: HeadersInit = {}

  // Handle origin
  if (corsOptions.origin) {
    if (typeof corsOptions.origin === 'string') {
      headers['Access-Control-Allow-Origin'] = corsOptions.origin
    } else if (Array.isArray(corsOptions.origin)) {
      if (origin && corsOptions.origin.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
      }
    } else if (typeof corsOptions.origin === 'function') {
      if (origin && corsOptions.origin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
      }
    }
  }

  // Handle methods
  if (corsOptions.methods) {
    headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
  }

  // Handle headers
  if (corsOptions.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders.join(', ')
  }

  // Handle credentials
  if (corsOptions.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

// OPTIONS handler for CORS preflight
export function createOptionsHandler(corsOptions: NextCorsOptions): RouteHandler {
  return async function optionsHandler(request: NextRequest) {
    const corsHeaders = getCorsHeaders(request, corsOptions)
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }
}
```

### 5. Middleware Integration

Optional middleware for authentication and request preprocessing:

```typescript
// middleware.ts
import { createCubeMiddleware } from 'drizzle-cube/adapters/nextjs'
import { NextResponse } from 'next/server'

const cubeMiddleware = createCubeMiddleware({
  paths: ['/api/cubejs/:path*'],
  authenticate: async (request) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await validateJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Add user to request headers for route handlers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-org-id', user.organisationId)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }
})

export function middleware(request: NextRequest) {
  return cubeMiddleware(request)
}

export const config = {
  matcher: '/api/cubejs/:path*'
}
```

### 6. Edge Runtime Support

Supporting both Node.js and Edge Runtime:

```typescript
// Route file with runtime configuration
export const runtime = 'edge' // or 'nodejs'

const handler = createLoadHandler({
  semanticLayer,
  drizzle: db,
  schema,
  runtime: 'edge', // Must match export above
  getSecurityContext: async (request) => {
    // Edge-compatible authentication
    const token = request.headers.get('authorization')
    // Use Web APIs only (no Node.js specific APIs)
    return await validateTokenEdge(token)
  }
})

export { handler as GET, handler as POST }
```

## Usage Examples

### Basic Setup

```typescript
// lib/cube-config.ts
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { createDatabaseExecutor } from 'drizzle-cube/server'
import { db, schema } from './database'

export const semanticLayer = new SemanticLayerCompiler({
  databaseExecutor: createDatabaseExecutor(db, schema, 'postgres')
})

export { db, schema }
```

```typescript
// app/api/cubejs/v1/load/route.ts
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'
import { semanticLayer, db, schema } from '@/lib/cube-config'
import { getServerSession } from 'next-auth'

const { load } = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const authHeader = request.headers.get('authorization')
    const user = await validateSession(authHeader)
    return {
      organisationId: user.organisationId
    }
  },
  cors: {
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})

export { load as GET, load as POST }

// Handle OPTIONS for CORS preflight
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

### Complete API Setup

Create all four endpoints:

```typescript
// app/api/cubejs/v1/[...endpoint]/route.ts (catch-all route)
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'
import { semanticLayer, db, schema } from '@/lib/cube-config'

const handlers = createCubeHandlers({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request, context) => {
    // Extract from route context or headers
    const orgId = request.headers.get('x-org-id') || context?.params?.orgId
    return { organisationId: orgId }
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
```

### With Server Components Integration

```typescript
// app/dashboard/page.tsx (Server Component)
import { semanticLayer } from '@/lib/cube-config'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  // Get metadata on server-side
  const metadata = semanticLayer.getMetadata()
  
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <DashboardClient 
        initialMetadata={metadata}
        apiBasePath="/api/cubejs/v1"
      />
    </div>
  )
}
```

## Testing Strategy

### Unit Tests
- Route handler functionality
- CORS header generation
- Security context extraction
- Error handling
- Runtime compatibility

### Integration Tests
- Full App Router integration
- Middleware functionality
- Server Component integration
- Edge Runtime compatibility

### E2E Tests
- Complete user flows
- Authentication integration
- Performance under load

## Documentation Requirements

### README.md Contents
- App Router setup guide
- Route handler creation
- Middleware configuration
- Edge Runtime considerations
- Server Component integration
- Authentication patterns
- CORS configuration
- TypeScript setup
- Deployment guides (Vercel, etc.)

## Implementation Checklist

### Core Implementation
- [ ] Create `src/adapters/nextjs/index.ts`
- [ ] Implement `NextAdapterOptions` interface
- [ ] Implement `createLoadHandler()` function
- [ ] Implement `createMetaHandler()` function
- [ ] Implement `createSqlHandler()` function
- [ ] Implement `createDryRunHandler()` function
- [ ] Implement `createCubeHandlers()` convenience function
- [ ] Add CORS handling utilities
- [ ] Add OPTIONS handler creator

### Middleware Support
- [ ] Create `src/adapters/nextjs/middleware.ts`
- [ ] Implement `createCubeMiddleware()` function
- [ ] Add authentication helpers
- [ ] Add request preprocessing utilities

### Runtime Support
- [ ] Test Edge Runtime compatibility
- [ ] Ensure Web API usage only
- [ ] Add runtime configuration helpers
- [ ] Validate Node.js runtime features

### Integration
- [ ] Update `vite.config.adapters.ts`
- [ ] Add Next.js peer dependency
- [ ] Update package.json exports
- [ ] Create example App Router setup

### Testing
- [ ] Create test suite `tests/adapters/nextjs.test.ts`
- [ ] Test route handler creation
- [ ] Test CORS functionality
- [ ] Test middleware integration
- [ ] Test both runtime environments

### Documentation
- [ ] Create comprehensive README.md
- [ ] Add App Router setup guide
- [ ] Document middleware patterns
- [ ] Create deployment examples

## Success Criteria

- [ ] All Cube.js API endpoints as route handlers
- [ ] App Router integration working
- [ ] CORS handling implemented
- [ ] Middleware support functional
- [ ] Edge Runtime compatibility
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Example application working

## Timeline

**Estimated Duration**: 3-4 hours

1. **Route Handlers** (1.5h)
   - Core handler factories
   - Web API integration
   - CORS implementation

2. **Middleware & Advanced Features** (1h)
   - Middleware utilities
   - Edge Runtime support
   - Server Component integration

3. **Integration & Testing** (1.5h)
   - Build configuration
   - Test suite creation
   - Example application
   - Documentation

---

*Previous: [Fastify Adapter Plan](./fastify-adapter-plan.md)*  
*Back to: [Overall Implementation Plan](./adapter-implementation-plan.md)*