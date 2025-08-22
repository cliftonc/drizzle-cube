# Express Adapter Implementation Plan

## Overview

Implementation plan for creating a Drizzle Cube adapter for Express.js v5, leveraging the shared utilities architecture.

## Framework Details

**Express.js Version**: 5.1.0 (latest stable)  
**TypeScript Support**: Via `@types/express` v5.0.x  
**Key Features**: Async/await error handling, improved router, Node.js 18+ support

## Implementation Structure

### Directory Structure
```
src/adapters/express/
├── index.ts          # Main adapter implementation
└── README.md         # Express-specific documentation
```

### Core Functions to Implement

```typescript
// Router creation (recommended approach)
export function createCubeRouter<TSchema>(
  options: ExpressAdapterOptions<TSchema>
): Router

// Mount on existing Express app
export function mountCubeRoutes<TSchema>(
  app: Express, 
  options: ExpressAdapterOptions<TSchema>
): Express

// Create standalone Express app
export function createCubeApp<TSchema>(
  options: ExpressAdapterOptions<TSchema>
): Express
```

## Technical Requirements

### Dependencies
```json
{
  "peerDependencies": {
    "express": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "cors": "^2.8.5",
    "@types/cors": "^2.8.17"
  }
}
```

### Adapter Options Interface
```typescript
export interface ExpressAdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  semanticLayer: SemanticLayerCompiler<TSchema>
  drizzle: DrizzleDatabase<TSchema>
  schema?: TSchema
  getSecurityContext: (req: Request, res: Response) => SecurityContext | Promise<SecurityContext>
  cors?: CorsOptions
  basePath?: string // default: '/cubejs-api/v1'
  jsonLimit?: string // default: '10mb'
}
```

## Implementation Details

### 1. Request/Response Handling

Express v5 improvements to leverage:
- **Automatic async error handling** - No need for try/catch wrappers
- **Enhanced router** - Use `express.Router()` for modular routes
- **Improved middleware** - Better request/response handling

### 2. Route Implementations

#### POST /cubejs-api/v1/load
```typescript
router.post(`${basePath}/load`, async (req: Request, res: Response) => {
  const query: SemanticQuery = req.body.query || req.body
  const securityContext = await getSecurityContext(req, res)
  
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    return res.status(400).json(formatErrorResponse(
      `Query validation failed: ${validation.errors.join(', ')}`
    ))
  }

  const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
  res.json(formatCubeResponse(query, result, semanticLayer))
})
```

#### GET /cubejs-api/v1/load
```typescript
router.get(`${basePath}/load`, async (req: Request, res: Response) => {
  const queryParam = req.query.query as string
  if (!queryParam) {
    return res.status(400).json(formatErrorResponse('Query parameter is required'))
  }

  const query: SemanticQuery = JSON.parse(queryParam)
  // ... rest similar to POST
})
```

#### GET /cubejs-api/v1/meta
```typescript
router.get(`${basePath}/meta`, (req: Request, res: Response) => {
  const metadata = semanticLayer.getMetadata()
  res.json(formatMetaResponse(metadata))
})
```

### 3. Middleware Setup

```typescript
// CORS middleware
if (cors) {
  router.use(corsMiddleware(cors))
}

// JSON body parser with size limit
router.use(express.json({ limit: jsonLimit || '10mb' }))

// URL-encoded parser (for GET requests with complex queries)
router.use(express.urlencoded({ extended: true, limit: jsonLimit || '10mb' }))
```

### 4. Error Handling

Express v5 automatically handles async errors, but we'll add custom error handling:

```typescript
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Express adapter error:', error)
  if (!res.headersSent) {
    res.status(500).json(formatErrorResponse(error))
  }
})
```

## Usage Examples

### Basic Usage
```typescript
import express from 'express'
import { createCubeRouter } from 'drizzle-cube/adapters/express'

const app = express()

const cubeRouter = createCubeRouter({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: (req, res) => ({
    organisationId: req.user?.organisationId
  })
})

app.use('/api', cubeRouter)
app.listen(3000)
```

### Standalone App
```typescript
import { createCubeApp } from 'drizzle-cube/adapters/express'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: (req, res) => ({
    organisationId: req.user?.organisationId
  }),
  cors: {
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
  }
})

app.listen(4000, () => {
  console.log('Cube API server running on port 4000')
})
```

### Mount on Existing App
```typescript
import express from 'express'
import { mountCubeRoutes } from 'drizzle-cube/adapters/express'

const app = express()

// Your existing routes
app.get('/', (req, res) => res.send('Hello World'))

// Mount cube routes
mountCubeRoutes(app, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req, res) => {
    // Extract from JWT, session, etc.
    const token = req.headers.authorization?.replace('Bearer ', '')
    return await validateTokenAndGetContext(token)
  },
  basePath: '/analytics-api/v1'
})

app.listen(3000)
```

## Testing Strategy

### Unit Tests
- Route handler functionality
- Error handling scenarios
- Security context extraction
- CORS configuration
- Request/response formatting

### Integration Tests
- Full request/response cycle
- Multiple concurrent requests
- Large payload handling
- Authentication integration

### Performance Tests
- Request throughput
- Memory usage
- Response time benchmarks
- Connection pooling efficiency

## Documentation Requirements

### README.md Contents
- Installation instructions
- Basic usage examples
- Advanced configuration
- TypeScript setup
- Authentication patterns
- CORS configuration
- Error handling
- Performance optimization tips
- Migration from Express v4
- Troubleshooting guide

### Code Examples
- Basic setup with SQLite
- Production setup with PostgreSQL
- JWT authentication
- Role-based security
- Custom middleware integration
- Docker deployment

## Implementation Checklist

### Core Implementation
- [ ] Create `src/adapters/express/index.ts`
- [ ] Implement `ExpressAdapterOptions` interface
- [ ] Implement `createCubeRouter()` function
- [ ] Implement `mountCubeRoutes()` function  
- [ ] Implement `createCubeApp()` function
- [ ] Add all four API endpoints
- [ ] Implement error handling middleware
- [ ] Add CORS support
- [ ] Add request body parsing

### Integration
- [ ] Update `vite.config.adapters.ts`
- [ ] Add Express peer dependency
- [ ] Update package.json exports
- [ ] Install development dependencies

### Testing
- [ ] Create test suite `tests/adapters/express.test.ts`
- [ ] Test all API endpoints
- [ ] Test error scenarios
- [ ] Test CORS functionality
- [ ] Test security context extraction

### Documentation
- [ ] Create comprehensive README.md
- [ ] Add TypeScript examples
- [ ] Document authentication patterns
- [ ] Create migration guide

## Success Criteria

- [ ] All Cube.js API endpoints implemented
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] CORS working correctly
- [ ] Error handling comprehensive
- [ ] Performance meets benchmarks
- [ ] Documentation complete
- [ ] Example application working

## Timeline

**Estimated Duration**: 2-3 hours

1. **Core Implementation** (1.5h)
   - Interface definition
   - Route handlers
   - Middleware setup

2. **Integration & Testing** (1h)
   - Build configuration
   - Unit tests
   - Basic integration test

3. **Documentation** (30min)
   - README creation
   - Usage examples

---

*Next: [Fastify Adapter Plan](./fastify-adapter-plan.md)*