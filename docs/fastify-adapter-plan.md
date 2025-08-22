# Fastify Adapter Implementation Plan

## Overview

Implementation plan for creating a Drizzle Cube adapter for Fastify v5, leveraging the shared utilities architecture and Fastify's plugin system.

## Framework Details

**Fastify Version**: 5.5.0 (latest)  
**TypeScript Support**: Native with Type Providers  
**Key Features**: Plugin architecture, schema validation, high performance, built-in TypeScript

## Implementation Structure

### Directory Structure
```
src/adapters/fastify/
├── index.ts          # Main adapter implementation
└── README.md         # Fastify-specific documentation
```

### Core Functions to Implement

```typescript
// Fastify plugin (recommended approach)
export const cubePlugin: FastifyPluginAsync<FastifyAdapterOptions>

// Create standalone Fastify app with plugin registered
export function createCubeApp<TSchema>(
  options: FastifyAdapterOptions<TSchema>
): FastifyInstance

// Helper for manual registration
export function registerCubeRoutes<TSchema>(
  fastify: FastifyInstance,
  options: FastifyAdapterOptions<TSchema>
): Promise<void>
```

## Technical Requirements

### Dependencies
```json
{
  "peerDependencies": {
    "fastify": "^5.0.0"
  },
  "devDependencies": {
    "@fastify/cors": "^10.0.0",
    "@fastify/type-provider-typebox": "^5.0.0",
    "@sinclair/typebox": "^0.33.0",
    "fastify-plugin": "^5.0.0"
  }
}
```

### Adapter Options Interface
```typescript
export interface FastifyAdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  semanticLayer: SemanticLayerCompiler<TSchema>
  drizzle: DrizzleDatabase<TSchema>
  schema?: TSchema
  getSecurityContext: (request: FastifyRequest) => SecurityContext | Promise<SecurityContext>
  cors?: FastifyCorsOptions
  basePath?: string // default: '/cubejs-api/v1'
  bodyLimit?: number // default: 10485760 (10MB)
  enableTypeProvider?: boolean // default: true
  schemaValidation?: boolean // default: true
}
```

## Implementation Details

### 1. Plugin Architecture

Fastify's plugin system with encapsulation:

```typescript
import fp from 'fastify-plugin'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

export const cubePlugin: FastifyPluginAsync<FastifyAdapterOptions> = fp(
  async function cubePlugin(fastify, options) {
    // Register type provider
    if (options.enableTypeProvider !== false) {
      fastify.withTypeProvider<TypeBoxTypeProvider>()
    }

    // Register CORS if configured
    if (options.cors) {
      await fastify.register(require('@fastify/cors'), options.cors)
    }

    // Register routes with schemas
    await registerRoutes(fastify, options)
  },
  {
    fastify: '5.x',
    name: 'drizzle-cube'
  }
)
```

### 2. Schema Definitions with TypeBox

```typescript
import { Type } from '@sinclair/typebox'

// Query schema for validation
const QuerySchema = Type.Object({
  measures: Type.Optional(Type.Array(Type.String())),
  dimensions: Type.Optional(Type.Array(Type.String())),
  filters: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
  timeDimensions: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
  order: Type.Optional(Type.Object({}, { additionalProperties: true })),
  limit: Type.Optional(Type.Number()),
  offset: Type.Optional(Type.Number())
})

// Standard response schemas
const CubeResponseSchema = Type.Object({
  queryType: Type.String(),
  results: Type.Array(Type.Object({}, { additionalProperties: true })),
  pivotQuery: Type.Object({}, { additionalProperties: true }),
  slowQuery: Type.Boolean()
})

const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  status: Type.Optional(Type.Number())
})
```

### 3. Route Implementations with Schema Validation

#### POST /cubejs-api/v1/load
```typescript
fastify.post(`${basePath}/load`, {
  schema: {
    body: Type.Object({
      query: Type.Optional(QuerySchema),
      // Allow direct query properties at root level
    }, { additionalProperties: true }),
    response: {
      200: CubeResponseSchema,
      400: ErrorResponseSchema,
      500: ErrorResponseSchema
    }
  }
}, async (request, reply) => {
  const query: SemanticQuery = request.body.query || request.body
  const securityContext = await options.getSecurityContext(request)
  
  const validation = options.semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    return reply.status(400).send(formatErrorResponse(
      `Query validation failed: ${validation.errors.join(', ')}`
    ))
  }

  const result = await options.semanticLayer.executeMultiCubeQuery(query, securityContext)
  return formatCubeResponse(query, result, options.semanticLayer)
})
```

#### GET /cubejs-api/v1/load
```typescript
fastify.get(`${basePath}/load`, {
  schema: {
    querystring: Type.Object({
      query: Type.String()
    }),
    response: {
      200: CubeResponseSchema,
      400: ErrorResponseSchema,
      500: ErrorResponseSchema
    }
  }
}, async (request, reply) => {
  const { query: queryParam } = request.query
  
  let query: SemanticQuery
  try {
    query = JSON.parse(queryParam)
  } catch (parseError) {
    return reply.status(400).send(formatErrorResponse('Invalid JSON in query parameter'))
  }

  const securityContext = await options.getSecurityContext(request)
  
  // ... rest similar to POST
})
```

#### GET /cubejs-api/v1/meta
```typescript
fastify.get(`${basePath}/meta`, {
  schema: {
    response: {
      200: Type.Object({
        cubes: Type.Array(Type.Object({}, { additionalProperties: true }))
      })
    }
  }
}, async (request, reply) => {
  const metadata = options.semanticLayer.getMetadata()
  return formatMetaResponse(metadata)
})
```

### 4. Error Handling

Fastify's built-in error handling with custom error hook:

```typescript
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error, 'Fastify cube adapter error')
  
  if (reply.statusCode < 400) {
    reply.status(500)
  }
  
  return formatErrorResponse(error)
})

// Custom validation error handling
fastify.setSchemaErrorFormatter((errors, dataVar) => {
  return new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
})
```

### 5. Type Safety with Type Providers

```typescript
// Enable full type safety for routes
const server = fastify().withTypeProvider<TypeBoxTypeProvider>()

server.get('/load', {
  schema: {
    querystring: Type.Object({
      query: Type.String(),
      limit: Type.Optional(Type.Number())
    })
  }
}, async (request, reply) => {
  // request.query is fully typed!
  const { query, limit } = request.query // TypeScript knows these types
})
```

## Usage Examples

### Plugin Registration
```typescript
import fastify from 'fastify'
import { cubePlugin } from 'drizzle-cube/adapters/fastify'

const server = fastify({
  logger: true
})

await server.register(cubePlugin, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => ({
    organisationId: request.user?.organisationId
  }),
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  }
})

await server.listen({ port: 3000 })
```

### Standalone App
```typescript
import { createCubeApp } from 'drizzle-cube/adapters/fastify'

const app = await createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    return await validateTokenAndGetContext(token)
  },
  basePath: '/api/v1',
  enableTypeProvider: true,
  schemaValidation: true
})

await app.listen({ 
  port: 4000,
  host: '0.0.0.0'
})
```

### Manual Registration
```typescript
import fastify from 'fastify'
import { registerCubeRoutes } from 'drizzle-cube/adapters/fastify'

const server = fastify()

// Your existing routes
server.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Register cube routes
await registerCubeRoutes(server, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => ({
    organisationId: request.headers['x-org-id']
  })
})

await server.listen({ port: 3000 })
```

### Advanced Configuration
```typescript
const server = fastify({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  },
  bodyLimit: 20 * 1024 * 1024, // 20MB
  trustProxy: true
})

await server.register(cubePlugin, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => {
    // Extract from JWT with validation
    const jwt = request.jwtVerify()
    return {
      organisationId: jwt.orgId,
      userId: jwt.sub,
      roles: jwt.roles
    }
  },
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
      callback(null, allowedOrigins.includes(origin))
    },
    credentials: true
  },
  bodyLimit: 15 * 1024 * 1024, // 15MB for cube queries
  schemaValidation: true,
  enableTypeProvider: true
})
```

## Testing Strategy

### Unit Tests
- Plugin registration
- Route functionality
- Schema validation
- Error handling
- Type provider integration

### Integration Tests
- Full plugin lifecycle
- Schema validation edge cases
- Performance under load
- Memory usage patterns

### Performance Tests
- Throughput benchmarks
- Latency measurements
- Memory efficiency
- Connection handling

## Documentation Requirements

### README.md Contents
- Installation with `@fastify/cors` and TypeBox
- Plugin registration examples
- Schema validation configuration
- Type provider setup
- Authentication patterns
- Performance optimization
- Error handling customization
- Testing strategies
- Deployment considerations

## Implementation Checklist

### Core Implementation
- [ ] Create `src/adapters/fastify/index.ts`
- [ ] Implement `FastifyAdapterOptions` interface
- [ ] Implement `cubePlugin` as FastifyPluginAsync
- [ ] Implement `createCubeApp()` function
- [ ] Implement `registerCubeRoutes()` helper
- [ ] Add all four API endpoints with schemas
- [ ] Implement TypeBox schema validation
- [ ] Add error handling hooks
- [ ] Add CORS plugin integration

### Schema & Type Safety
- [ ] Define TypeBox schemas for all endpoints
- [ ] Implement Type Provider integration
- [ ] Add response schema validation
- [ ] Test schema validation edge cases

### Integration
- [ ] Update `vite.config.adapters.ts`
- [ ] Add Fastify peer dependencies
- [ ] Update package.json exports
- [ ] Install development dependencies

### Testing
- [ ] Create test suite `tests/adapters/fastify.test.ts`
- [ ] Test plugin registration
- [ ] Test schema validation
- [ ] Test all API endpoints
- [ ] Test error scenarios
- [ ] Test type provider functionality

### Documentation
- [ ] Create comprehensive README.md
- [ ] Add TypeScript/TypeBox examples
- [ ] Document plugin patterns
- [ ] Create performance guide

## Success Criteria

- [ ] Fastify plugin pattern correctly implemented
- [ ] All Cube.js API endpoints with schema validation
- [ ] TypeBox integration working
- [ ] Type Provider functionality
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] Performance meets Fastify standards
- [ ] Documentation complete
- [ ] Example application working

## Timeline

**Estimated Duration**: 2-3 hours

1. **Plugin Architecture** (1h)
   - Plugin setup with fastify-plugin
   - TypeBox schema definitions
   - Type Provider integration

2. **Route Implementation** (1h)
   - All four API endpoints
   - Schema validation
   - Error handling

3. **Integration & Testing** (1h)
   - Build configuration
   - Unit tests
   - Documentation

---

*Previous: [Express Adapter Plan](./express-adapter-plan.md)*  
*Next: [Next.js Adapter Plan](./nextjs-adapter-plan.md)*