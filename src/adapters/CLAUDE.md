# Framework Adapters

This document describes the framework adapter architecture for drizzle-cube, focusing on patterns and conventions for providing Cube.js-compatible APIs across different web frameworks.

## Overview

Framework adapters provide a consistent Cube.js-compatible API surface across Express, Fastify, Hono, and Next.js frameworks. They handle HTTP routing, request/response transformation, and security context extraction while maintaining identical functionality across all frameworks.

## Core Architecture

```
HTTP Request → Framework Adapter → Security Context → Semantic Layer → Response
                      ↓
            Query Validation & Transformation
```

### Supported Frameworks
- **Express** - Traditional Node.js web framework
- **Fastify** - High-performance web framework  
- **Hono** - Modern web framework with edge runtime support
- **Next.js** - React framework with API routes

## API Endpoint Structure

All adapters expose the same Cube.js-compatible endpoints:

```
POST /cubejs-api/v1/load    # Execute semantic queries
POST /cubejs-api/v1/sql     # Generate SQL (dry-run)  
GET  /cubejs-api/v1/meta    # Get cube metadata
```

## Security Context Pattern

### Core Pattern
Every adapter must implement security context extraction:

```typescript
interface AdapterOptions {
  extractSecurityContext: (req: Request) => SecurityContext | Promise<SecurityContext>
  semanticLayer: SemanticLayerCompiler
  // Optional configurations
}
```

### Implementation Pattern
```typescript
// In all adapters
const securityContext = await options.extractSecurityContext(request)

// Security context is passed to ALL semantic layer operations
const result = await semanticLayer.query(query, securityContext)
```

### Security Context Requirements
- **Must be provided** - Cannot execute queries without security context
- **Tenant isolation** - Used for multi-tenant data filtering
- **Consistent across frameworks** - Same interface regardless of adapter

## Adapter Implementation Patterns

### Express Adapter (@src/adapters/express/index.ts)

```typescript
export function createCubeApi(options: ExpressAdapterOptions) {
  const router = express.Router()
  
  // POST /cubejs-api/v1/load
  router.post('/load', async (req, res) => {
    const securityContext = await options.extractSecurityContext(req)
    const result = await options.semanticLayer.query(req.body, securityContext)
    res.json(result)
  })
  
  return router
}
```

### Fastify Adapter (@src/adapters/fastify/index.ts)

```typescript
export async function registerCubeApi(fastify: FastifyInstance, options: FastifyAdapterOptions) {
  // POST /cubejs-api/v1/load
  fastify.post('/cubejs-api/v1/load', async (request, reply) => {
    const securityContext = await options.extractSecurityContext(request)
    const result = await options.semanticLayer.query(request.body, securityContext)
    return result
  })
}
```

### Hono Adapter (@src/adapters/hono/index.ts)

```typescript
export function createCubeApi(options: HonoAdapterOptions) {
  const app = new Hono()
  
  // POST /cubejs-api/v1/load
  app.post('/load', async (c) => {
    const securityContext = await options.extractSecurityContext(c.req)
    const query = await c.req.json()
    const result = await options.semanticLayer.query(query, securityContext)
    return c.json(result)
  })
  
  return app
}
```

### Next.js Adapter (@src/adapters/nextjs/index.ts)

```typescript
export function createCubeApi(options: NextjsAdapterOptions) {
  return {
    load: async (req: NextApiRequest, res: NextApiResponse) => {
      const securityContext = await options.extractSecurityContext(req)
      const result = await options.semanticLayer.query(req.body, securityContext)
      res.json(result)
    },
    // Other endpoints...
  }
}
```

## Request/Response Transformation

### Query Transformation
All adapters use shared utilities for consistent query handling:

```typescript
// From @src/adapters/utils.ts
export function buildTransformedQuery(query: SemanticQuery): any {
  // Transform to Cube.js-compatible format
  return {
    measures: query.measures || [],
    dimensions: query.dimensions || [],
    timeDimensions: query.timeDimensions || [],
    // Cube.js compatibility fields
    leafMeasureAdditive: true,
    hasMultiStage: false
    // ... other compatibility fields
  }
}
```

### Response Formatting
Responses maintain Cube.js compatibility:

```typescript
interface CubeApiResponse {
  data: Record<string, unknown>[]
  query: any                    // Transformed query
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
  requestId: string            // Generated request ID
  slowQuery: boolean           // Performance indication
}
```

## Shared Utilities (@src/adapters/utils.ts)

### Query Complexity Calculation
```typescript
export function calculateQueryComplexity(query: SemanticQuery): string {
  let complexity = 0
  complexity += (query.measures?.length || 0) * 1
  complexity += (query.dimensions?.length || 0) * 1  
  complexity += (query.filters?.length || 0) * 2
  complexity += (query.timeDimensions?.length || 0) * 3
  
  // Returns 'low' | 'medium' | 'high'
}
```

### Dry-Run Validation
```typescript
export async function handleDryRun(
  query: SemanticQuery, 
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Validate query structure
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
  }
  
  // Generate SQL without execution
  return semanticLayer.generateSql(query, securityContext)
}
```

## Error Handling Patterns

### Standard Error Response
```typescript
interface ErrorResponse {
  error: string
  stack?: string        // Development only
  requestId: string
  type: 'validation' | 'security' | 'database' | 'internal'
}
```

### Error Handling Implementation
```typescript
// In all adapters
try {
  const result = await semanticLayer.query(query, securityContext)
  return formatResponse(result, requestId)
} catch (error) {
  return formatErrorResponse(error, requestId, isDevelopment)
}
```

## Framework-Specific Considerations

### Express
- Uses middleware pattern with `express.Router()`
- Manual error handling required
- Request/response objects directly accessible

### Fastify
- Plugin registration pattern
- Automatic error handling via Fastify
- Type-safe request/response schemas

### Hono
- Lightweight middleware pattern  
- Edge runtime compatible
- Context-based request/response handling

### Next.js
- API route handler functions
- Serverless function compatible
- Built-in request/response types

## Development Patterns

### Adding New Framework Support

1. **Create adapter directory** - `src/adapters/[framework]/`
2. **Implement core interface**:
   ```typescript
   interface FrameworkAdapterOptions {
     extractSecurityContext: (req: any) => SecurityContext | Promise<SecurityContext>
     semanticLayer: SemanticLayerCompiler
   }
   ```
3. **Map endpoints** - POST /load, POST /sql, GET /meta
4. **Add error handling** - Framework-appropriate error responses
5. **Add tests** - Integration tests in `tests/adapters/`
6. **Update build config** - Add to `vite.config.adapters.ts`
7. **Export from package** - Add to `package.json` exports

### Maintaining Consistency

**API Surface**:
- All endpoints must return identical response formats
- Error responses must be consistent across frameworks
- Query validation must behave identically

**Security**:
- Security context extraction is mandatory
- All frameworks must enforce the same security patterns
- Multi-tenant isolation must work identically

## Integration Patterns

### Usage with Express
```typescript
import express from 'express'
import { createCubeApi } from 'drizzle-cube/adapters/express'

const app = express()

const cubeApi = createCubeApi({
  extractSecurityContext: async (req) => ({
    organisationId: req.user.organisationId,
    userId: req.user.id
  }),
  semanticLayer: compiler
})

app.use('/cubejs-api/v1', cubeApi)
```

### Usage with Next.js
```typescript
// pages/api/cubejs/[...cube].ts
import { createCubeApi } from 'drizzle-cube/adapters/nextjs'

const cubeHandlers = createCubeApi({
  extractSecurityContext: async (req) => ({
    organisationId: req.session.organisationId
  }),
  semanticLayer: compiler
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [endpoint] = req.query.cube as string[]
  
  switch (endpoint) {
    case 'load':
      return cubeHandlers.load(req, res)
    case 'sql':
      return cubeHandlers.sql(req, res)
    case 'meta':
      return cubeHandlers.meta(req, res)
    default:
      res.status(404).json({ error: 'Endpoint not found' })
  }
}
```

## Testing Patterns

### Adapter Test Structure
```typescript
// tests/adapters/[framework].test.ts
describe(`${Framework} Adapter`, () => {
  let adapter: AdapterInstance
  let semanticLayer: SemanticLayerCompiler
  
  beforeEach(async () => {
    // Setup test database and semantic layer
    // Create adapter instance
  })
  
  it('should handle /load endpoint', async () => {
    const response = await testRequest(adapter, '/load', query)
    expect(response).toMatchCubeApiFormat()
  })
  
  it('should enforce security context', async () => {
    // Test security context requirement
  })
})
```

### Cross-Framework Consistency Tests
All adapters are tested to ensure they produce identical outputs for the same inputs.

## Key Files Reference

- @src/adapters/utils.ts:16 - Query complexity calculation
- @src/adapters/utils.ts:84 - Dry-run validation handling
- @src/adapters/express/index.ts:45 - Express router implementation
- @src/adapters/fastify/index.ts:67 - Fastify plugin registration
- @src/adapters/hono/index.ts:34 - Hono app creation
- @src/adapters/nextjs/index.ts:78 - Next.js handler functions

## Guard Rails

1. **Security context is mandatory** - Cannot be bypassed in any framework
2. **API consistency** - All frameworks must expose identical endpoints
3. **Error handling** - Must provide consistent error formats
4. **Performance** - Query complexity tracking and response time monitoring
5. **Type safety** - Full TypeScript support across all frameworks
6. **Testing coverage** - All adapters must pass identical test suites