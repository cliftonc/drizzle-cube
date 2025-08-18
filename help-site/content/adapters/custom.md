# Custom Adapters

Drizzle Cube's adapter system allows you to integrate the semantic layer with any web framework or runtime. Custom adapters provide the bridge between your application's HTTP layer and Drizzle Cube's query execution engine.

## Overview

An adapter is a framework-specific wrapper that:
- Exposes Cube.js-compatible API endpoints
- Handles HTTP requests and responses
- Extracts security context from your application
- Manages CORS and authentication
- Provides error handling and logging

## Adapter Architecture

### Core Components

```typescript
// Required adapter interface
interface DrizzleCubeAdapter {
  // HTTP route handlers
  handleLoad: (request: Request) => Promise<Response>
  handleMeta: (request: Request) => Promise<Response>
  
  // Security context extraction
  getSecurityContext: (request: Request) => Promise<SecurityContext>
  
  // Optional: Custom error handling
  handleError?: (error: Error, request: Request) => Response
}
```

### Base Adapter Structure

```typescript
import { SemanticLayerCompiler, SecurityContext } from 'drizzle-cube/server'
import type { DrizzleDatabase } from 'drizzle-cube/server'

export interface AdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  semanticLayer: SemanticLayerCompiler<TSchema>
  drizzle: DrizzleDatabase<TSchema>
  schema?: TSchema
  getSecurityContext: (context: any) => SecurityContext | Promise<SecurityContext>
  cors?: CorsOptions
}

export abstract class BaseAdapter<TSchema extends Record<string, any> = Record<string, any>> {
  protected semanticLayer: SemanticLayerCompiler<TSchema>
  protected drizzle: DrizzleDatabase<TSchema>
  protected schema?: TSchema
  protected getSecurityContext: (context: any) => SecurityContext | Promise<SecurityContext>

  constructor(options: AdapterOptions<TSchema>) {
    this.semanticLayer = options.semanticLayer
    this.drizzle = options.drizzle
    this.schema = options.schema
    this.getSecurityContext = options.getSecurityContext
  }

  abstract setupRoutes(): void
}
```

## Creating a Custom Adapter

### Step 1: Define Adapter Interface

```typescript
// adapters/fastify/index.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { BaseAdapter, AdapterOptions } from 'drizzle-cube/server'

export interface FastifyAdapterOptions<TSchema extends Record<string, any> = Record<string, any>>
  extends AdapterOptions<TSchema> {
  prefix?: string  // API route prefix
  corsOrigin?: string | string[]
}

export class FastifyAdapter<TSchema extends Record<string, any> = Record<string, any>>
  extends BaseAdapter<TSchema> {
  private app: FastifyInstance
  private prefix: string

  constructor(app: FastifyInstance, options: FastifyAdapterOptions<TSchema>) {
    super(options)
    this.app = app
    this.prefix = options.prefix || '/cubejs-api/v1'
  }

  setupRoutes() {
    // Register Cube.js API endpoints
    this.app.post(`${this.prefix}/load`, this.handleLoad.bind(this))
    this.app.get(`${this.prefix}/meta`, this.handleMeta.bind(this))
  }
}
```

### Step 2: Implement Route Handlers

```typescript
export class FastifyAdapter<TSchema> extends BaseAdapter<TSchema> {
  
  async handleLoad(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract security context from Fastify request
      const securityContext = await this.getSecurityContext(request)
      
      // Parse query from request body
      const query = request.body as SemanticQuery
      
      // Execute query using semantic layer
      const result = await this.semanticLayer.load(query, securityContext)
      
      // Return Cube.js-compatible response
      reply.send({
        query,
        data: result.rawData(),
        annotation: result.annotation(),
        lastRefreshTime: new Date().toISOString()
      })
      
    } catch (error) {
      reply.status(400).send({
        error: error.message,
        type: error.constructor.name
      })
    }
  }

  async handleMeta(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract security context
      const securityContext = await this.getSecurityContext(request)
      
      // Get cube metadata
      const cubes = await this.semanticLayer.getMetadata(securityContext)
      
      reply.send({ cubes })
      
    } catch (error) {
      reply.status(400).send({
        error: error.message,
        type: error.constructor.name
      })
    }
  }
}
```

### Step 3: Security Context Extraction

```typescript
export class FastifyAdapter<TSchema> extends BaseAdapter<TSchema> {
  
  constructor(app: FastifyInstance, options: FastifyAdapterOptions<TSchema>) {
    super(options)
    this.app = app
    this.prefix = options.prefix || '/cubejs-api/v1'
    
    // Setup CORS if configured
    if (options.corsOrigin) {
      this.app.register(require('@fastify/cors'), {
        origin: options.corsOrigin
      })
    }
  }

  // Example security context extraction
  private async extractSecurityContext(request: FastifyRequest): Promise<SecurityContext> {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header')
    }

    const token = authHeader.substring(7)
    const payload = await validateJWT(token)

    return {
      organisationId: payload.orgId,    // REQUIRED for multi-tenant security
      userId: payload.userId,
      userRole: payload.role,
      permissions: payload.permissions
    }
  }
}
```

### Step 4: Factory Function

```typescript
// Export a factory function for easy setup
export function createFastifyAdapter<TSchema extends Record<string, any> = Record<string, any>>(
  app: FastifyInstance,
  options: FastifyAdapterOptions<TSchema>
): FastifyAdapter<TSchema> {
  const adapter = new FastifyAdapter(app, options)
  adapter.setupRoutes()
  return adapter
}

// Usage
import { createFastifyAdapter } from './adapters/fastify'

const adapter = createFastifyAdapter(fastifyApp, {
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (request) => ({
    organisationId: request.user.organisationId,
    userId: request.user.id,
    userRole: request.user.role
  }),
  prefix: '/api/cube',
  corsOrigin: ['http://localhost:3000']
})
```

## Framework-Specific Examples

### Express.js Adapter

```typescript
// adapters/express/index.ts
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'

export class ExpressAdapter<TSchema extends Record<string, any> = Record<string, any>>
  extends BaseAdapter<TSchema> {
  private app: express.Application
  private router: express.Router

  constructor(app: express.Application, options: AdapterOptions<TSchema>) {
    super(options)
    this.app = app
    this.router = express.Router()
    
    // Setup middleware
    this.router.use(express.json())
    this.router.use(cors())
  }

  setupRoutes() {
    this.router.post('/load', this.handleLoad.bind(this))
    this.router.get('/meta', this.handleMeta.bind(this))
    
    // Mount router
    this.app.use('/cubejs-api/v1', this.router)
  }

  async handleLoad(req: Request, res: Response, next: NextFunction) {
    try {
      const securityContext = await this.getSecurityContext(req)
      const result = await this.semanticLayer.load(req.body, securityContext)
      
      res.json({
        query: req.body,
        data: result.rawData(),
        annotation: result.annotation()
      })
    } catch (error) {
      next(error)  // Express error handling
    }
  }
}
```

### Next.js API Routes Adapter

```typescript
// adapters/nextjs/index.ts
import { NextApiRequest, NextApiResponse } from 'next'

export class NextJSAdapter<TSchema extends Record<string, any> = Record<string, any>>
  extends BaseAdapter<TSchema> {

  // Next.js API route handler factory
  createLoadHandler() {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      try {
        const securityContext = await this.getSecurityContext(req)
        const result = await this.semanticLayer.load(req.body, securityContext)
        
        res.json({
          query: req.body,
          data: result.rawData(),
          annotation: result.annotation()
        })
      } catch (error) {
        res.status(400).json({
          error: error.message,
          type: error.constructor.name
        })
      }
    }
  }

  createMetaHandler() {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      try {
        const securityContext = await this.getSecurityContext(req)
        const cubes = await this.semanticLayer.getMetadata(securityContext)
        res.json({ cubes })
      } catch (error) {
        res.status(400).json({ error: error.message })
      }
    }
  }
}

// Usage in pages/api/cubejs-api/v1/load.ts
import { NextJSAdapter } from '../../../adapters/nextjs'

const adapter = new NextJSAdapter({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (req) => {
    const token = req.headers.authorization?.substring(7)
    const user = await validateToken(token)
    return {
      organisationId: user.organisationId,
      userId: user.id
    }
  }
})

export default adapter.createLoadHandler()
```

### Cloudflare Workers Adapter

```typescript
// adapters/cloudflare/index.ts
export class CloudflareWorkerAdapter<TSchema extends Record<string, any> = Record<string, any>>
  extends BaseAdapter<TSchema> {

  async handleRequest(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)
    
    // Route requests
    if (url.pathname.endsWith('/load') && request.method === 'POST') {
      return this.handleLoad(request, env)
    }
    
    if (url.pathname.endsWith('/meta') && request.method === 'GET') {
      return this.handleMeta(request, env)
    }

    return new Response('Not Found', { status: 404 })
  }

  async handleLoad(request: Request, env: any): Promise<Response> {
    try {
      const query = await request.json()
      const securityContext = await this.getSecurityContext({ request, env })
      
      const result = await this.semanticLayer.load(query, securityContext)
      
      return new Response(JSON.stringify({
        query,
        data: result.rawData(),
        annotation: result.annotation()
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
```

## Advanced Features

### Custom Error Handling

```typescript
export class CustomAdapter<TSchema> extends BaseAdapter<TSchema> {
  
  protected handleError(error: Error, context: any): Response {
    // Log error
    console.error('Drizzle Cube Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context)
    })

    // Return user-friendly error
    if (error.message.includes('Access denied')) {
      return this.errorResponse(403, 'Insufficient permissions')
    }
    
    if (error.message.includes('organisationId')) {
      return this.errorResponse(400, 'Invalid organization context')
    }

    return this.errorResponse(500, 'Internal server error')
  }

  private errorResponse(status: number, message: string) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### Request Middleware

```typescript
export class EnhancedAdapter<TSchema> extends BaseAdapter<TSchema> {
  
  private async applyMiddleware(request: any, handler: Function) {
    // Rate limiting
    await this.checkRateLimit(request)
    
    // Request validation
    await this.validateRequest(request)
    
    // Audit logging
    await this.logRequest(request)
    
    // Execute handler
    return handler(request)
  }

  private async checkRateLimit(request: any) {
    const clientId = await this.getClientId(request)
    const isAllowed = await this.rateLimiter.check(clientId)
    
    if (!isAllowed) {
      throw new Error('Rate limit exceeded')
    }
  }

  private async logRequest(request: any) {
    const securityContext = await this.getSecurityContext(request)
    
    await this.auditLogger.log({
      type: 'CUBE_QUERY',
      userId: securityContext.userId,
      organisationId: securityContext.organisationId,
      timestamp: new Date(),
      query: request.body
    })
  }
}
```

### Response Caching

```typescript
export class CachedAdapter<TSchema> extends BaseAdapter<TSchema> {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  async handleLoad(request: any): Promise<any> {
    const cacheKey = this.getCacheKey(request.body, await this.getSecurityContext(request))
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data
    }

    // Execute query
    const result = await super.handleLoad(request)
    
    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  private getCacheKey(query: any, context: any): string {
    return `${context.organisationId}:${JSON.stringify(query)}`
  }
}
```

## Testing Adapters

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockRequest, createMockContext } from './test-helpers'

describe('CustomAdapter', () => {
  let adapter: CustomAdapter
  let mockSemanticLayer: jest.Mocked<SemanticLayerCompiler>

  beforeEach(() => {
    mockSemanticLayer = createMockSemanticLayer()
    adapter = new CustomAdapter({
      semanticLayer: mockSemanticLayer,
      drizzle: mockDb,
      getSecurityContext: async () => ({
        organisationId: 'test-org',
        userId: 'test-user'
      })
    })
  })

  it('should handle load requests', async () => {
    const query = { measures: ['Employees.count'] }
    const request = createMockRequest('POST', '/load', query)
    
    mockSemanticLayer.load.mockResolvedValue(createMockResultSet())
    
    const response = await adapter.handleLoad(request)
    
    expect(response.status).toBe(200)
    expect(mockSemanticLayer.load).toHaveBeenCalledWith(
      query,
      { organisationId: 'test-org', userId: 'test-user' }
    )
  })

  it('should handle security context errors', async () => {
    adapter = new CustomAdapter({
      semanticLayer: mockSemanticLayer,
      drizzle: mockDb,
      getSecurityContext: async () => {
        throw new Error('Invalid token')
      }
    })

    const request = createMockRequest('POST', '/load', {})
    const response = await adapter.handleLoad(request)
    
    expect(response.status).toBe(400)
  })
})
```

## Best Practices

1. **Security First**: Always validate and sanitize security context
2. **Error Handling**: Provide comprehensive error handling and logging
3. **Type Safety**: Use TypeScript for all adapter components
4. **Performance**: Implement caching and rate limiting
5. **Testing**: Write comprehensive tests for all adapter functionality
6. **Documentation**: Document adapter-specific configuration options
7. **Monitoring**: Add metrics and health checks for production deployment

## Deployment Considerations

### Environment Configuration

```typescript
// Environment-based configuration
export interface AdapterConfig {
  apiUrl: string
  corsOrigin: string[]
  jwtSecret: string
  rateLimitRpm?: number
  cacheTimeout?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export function createConfigFromEnv(): AdapterConfig {
  return {
    apiUrl: process.env.CUBE_API_URL || '/cubejs-api/v1',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    rateLimitRpm: parseInt(process.env.RATE_LIMIT_RPM || '100'),
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300'),
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  }
}
```

### Health Checks

```typescript
export class ProductionAdapter<TSchema> extends BaseAdapter<TSchema> {
  
  setupHealthCheck() {
    this.router.get('/health', async (req, res) => {
      try {
        // Test database connection
        await this.drizzle.execute(sql`SELECT 1`)
        
        // Test semantic layer
        await this.semanticLayer.getMetadata({ organisationId: 'health-check' })
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version
        })
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        })
      }
    })
  }
}
```

## Next Steps

- Review the [Hono Adapter](/help/adapters/hono) implementation
- Learn about [Security](/help/semantic-layer/security) context patterns
- Explore deployment options for your chosen framework
- Check out adapter examples in the repository

## Roadmap Ideas

- Adapter generator CLI tool
- Standard adapter middleware library
- Adapter performance benchmarking tools
- GraphQL adapter for Cube.js compatibility
- WebSocket adapter for real-time queries
- Serverless adapter optimizations