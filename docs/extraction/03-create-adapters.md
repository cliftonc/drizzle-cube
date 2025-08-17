# Phase 3: Create Framework Adapters

**Objective**: Create framework-specific adapters starting with Hono, designed for extensibility to other frameworks.

**Duration**: 2-3 hours  
**Prerequisites**: Phase 2 completed successfully

## Overview

We'll create a Hono adapter that provides Cube.js-compatible API endpoints. The adapter pattern allows the same core semantic layer to work with different web frameworks.

## Step 1: Create Hono Adapter

Create `src/adapters/hono/index.ts`:

```typescript
/**
 * Hono adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Hono applications
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { 
  SemanticLayerCompiler, 
  SemanticQuery, 
  SecurityContext, 
  DatabaseExecutor 
} from '../../server'

export interface HonoAdapterOptions {
  /**
   * The semantic layer instance to use
   */
  semanticLayer: SemanticLayerCompiler
  
  /**
   * Function to extract security context from Hono context
   * This is where you provide your app-specific context extraction logic
   */
  getSecurityContext: (c: any) => SecurityContext | Promise<SecurityContext>
  
  /**
   * Database executor for query execution
   * If not provided, make sure semantic layer has one configured
   */
  databaseExecutor?: DatabaseExecutor
  
  /**
   * CORS configuration (optional)
   */
  cors?: {
    origin?: string | string[] | ((origin: string) => boolean)
    allowMethods?: string[]
    allowHeaders?: string[]
    credentials?: boolean
  }
  
  /**
   * API base path (default: '/cubejs-api/v1')
   */
  basePath?: string
}

/**
 * Create Hono routes for Cube.js-compatible API
 */
export function createCubeRoutes(options: HonoAdapterOptions) {
  const { 
    semanticLayer, 
    getSecurityContext, 
    databaseExecutor,
    cors: corsConfig,
    basePath = '/cubejs-api/v1'
  } = options

  const app = new Hono()

  // Configure CORS if provided
  if (corsConfig) {
    app.use('/*', cors(corsConfig))
  }

  // Set database executor if provided
  if (databaseExecutor) {
    semanticLayer.setDatabaseExecutor(databaseExecutor)
  }

  /**
   * POST /cubejs-api/v1/load - Execute queries
   */
  app.post(`${basePath}/load`, async (c) => {
    try {
      const query: SemanticQuery = await c.req.json()
      
      // Extract security context using user-provided function
      const securityContext = await getSecurityContext(c)
      
      // Validate query has at least measures or dimensions
      if (!query.measures?.length && !query.dimensions?.length) {
        return c.json({
          error: 'Query must specify at least one measure or dimension'
        }, 400)
      }

      // Determine which cube to use (assume first measure/dimension determines cube)
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      // Execute query
      const result = await cube.queryFn(query, securityContext)
      
      // Return in Cube.js format
      return c.json({
        data: result.data,
        annotation: result.annotation,
        query,
        slowQuery: false
      })
      
    } catch (error) {
      console.error('Query execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Query execution failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/load - Execute queries via query string
   */
  app.get(`${basePath}/load`, async (c) => {
    try {
      const queryParam = c.req.query('query')
      if (!queryParam) {
        return c.json({
          error: 'Query parameter is required'
        }, 400)
      }

      const query: SemanticQuery = JSON.parse(queryParam)
      
      // Extract security context
      const securityContext = await getSecurityContext(c)
      
      // Execute same logic as POST endpoint
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      const result = await cube.queryFn(query, securityContext)
      
      return c.json({
        data: result.data,
        annotation: result.annotation,
        query,
        slowQuery: false
      })
      
    } catch (error) {
      console.error('Query execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Query execution failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/meta - Get cube metadata
   */
  app.get(`${basePath}/meta`, async (c) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      const securityContext = await getSecurityContext(c)
      
      const metadata = semanticLayer.getMetadata()
      
      return c.json({
        cubes: metadata
      })
      
    } catch (error) {
      console.error('Metadata error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Failed to fetch metadata'
      }, 500)
    }
  })

  /**
   * POST /cubejs-api/v1/sql - Generate SQL without execution (dry run)
   */
  app.post(`${basePath}/sql`, async (c) => {
    try {
      const query: SemanticQuery = await c.req.json()
      
      const securityContext = await getSecurityContext(c)
      
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      // Generate SQL without executing
      const executor = new (await import('../../server')).SemanticQueryExecutor({
        execute: async () => [] // Dummy executor for SQL generation
      })
      
      const sqlResult = executor.generateSQL(cube, query, securityContext)
      
      return c.json({
        sql: sqlResult.sql,
        params: sqlResult.params || [],
        query
      })
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'SQL generation failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/sql - Generate SQL via query string
   */
  app.get(`${basePath}/sql`, async (c) => {
    try {
      const queryParam = c.req.query('query')
      if (!queryParam) {
        return c.json({
          error: 'Query parameter is required'
        }, 400)
      }

      const query: SemanticQuery = JSON.parse(queryParam)
      const securityContext = await getSecurityContext(c)
      
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      const executor = new (await import('../../server')).SemanticQueryExecutor({
        execute: async () => []
      })
      
      const sqlResult = executor.generateSQL(cube, query, securityContext)
      
      return c.json({
        sql: sqlResult.sql,
        params: sqlResult.params || [],
        query
      })
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'SQL generation failed'
      }, 500)
    }
  })

  return app
}

/**
 * Convenience function to create routes and mount them on an existing Hono app
 */
export function mountCubeRoutes(app: Hono, options: HonoAdapterOptions) {
  const cubeRoutes = createCubeRoutes(options)
  app.route('/', cubeRoutes)
  return app
}

/**
 * Create a complete Hono app with Cube.js routes
 */
export function createCubeApp(options: HonoAdapterOptions) {
  const app = new Hono()
  return mountCubeRoutes(app, options)
}

// Re-export types for convenience
export type { HonoAdapterOptions, SecurityContext, DatabaseExecutor, SemanticQuery }
```

## Step 2: Create Adapter Type Definitions

Create `src/adapters/types.ts`:

```typescript
/**
 * Common adapter interfaces for different frameworks
 * This allows consistent adapter patterns across frameworks
 */

import type { SemanticLayerCompiler, SecurityContext, DatabaseExecutor } from '../server'

/**
 * Base adapter configuration
 */
export interface BaseAdapterOptions {
  semanticLayer: SemanticLayerCompiler
  databaseExecutor?: DatabaseExecutor
  basePath?: string
}

/**
 * Framework-specific context extractor
 * Each framework adapter will provide their own context type
 */
export interface ContextExtractor<TContext = any> {
  (context: TContext): SecurityContext | Promise<SecurityContext>
}

/**
 * Standard CORS configuration
 */
export interface CorsConfig {
  origin?: string | string[] | ((origin: string) => boolean)
  allowMethods?: string[]
  allowHeaders?: string[]
  credentials?: boolean
}

/**
 * Standard adapter response format
 */
export interface AdapterResponse {
  data?: any
  error?: string
  status?: number
}

/**
 * Future adapter interface (for Express, Fastify, etc.)
 */
export interface AdapterFactory<TOptions extends BaseAdapterOptions, TApp = any> {
  createRoutes(options: TOptions): TApp
  mountRoutes?(app: TApp, options: TOptions): TApp
  createApp?(options: TOptions): TApp
}
```

## Step 3: Add Hono to Package Dependencies

Update your `package.json` to include Hono as a peer dependency for the adapter:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "drizzle-orm": "^0.33.0",
    "hono": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "hono": {
      "optional": true
    }
  }
}
```

And add it to devDependencies for development:

```json
{
  "devDependencies": {
    "hono": "^4.0.0"
  }
}
```

## Step 4: Test the Adapter

Create `tests/adapters/hono.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createCubeRoutes } from '../../src/adapters/hono'
import { SemanticLayerCompiler, employeesCube } from '../../src/server'

// Mock database executor
const mockDbExecutor = {
  async execute(sql: string, params?: any[]) {
    return [
      { 
        id: '1', 
        name: 'John Doe', 
        department_name: 'Engineering', 
        active: true, 
        fte_basis: 1.0,
        'Employees.count': 2,
        'Employees.departmentName': 'Engineering'
      }
    ]
  }
}

// Mock security context extractor
const mockGetSecurityContext = async (c: any) => ({
  organisation: 'test-org-123'
})

describe('Hono Adapter', () => {
  let semanticLayer: SemanticLayerCompiler
  let app: Hono

  beforeEach(() => {
    semanticLayer = new SemanticLayerCompiler(mockDbExecutor)
    semanticLayer.registerCube(employeesCube)
    
    app = createCubeRoutes({
      semanticLayer,
      getSecurityContext: mockGetSecurityContext,
      databaseExecutor: mockDbExecutor
    })
  })

  it('should create cube routes', () => {
    expect(app).toBeDefined()
  })

  it('should handle POST /cubejs-api/v1/load', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentName']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should handle GET /cubejs-api/v1/meta', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/meta')
    const res = await app.request(req)
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.cubes).toBeDefined()
    expect(Array.isArray(data.cubes)).toBe(true)
    expect(data.cubes[0].name).toBe('Employees')
  })

  it('should handle POST /cubejs-api/v1/sql', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentName']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
  })

  it('should handle query via GET with query string', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.departmentName']
    }
    
    const req = new Request(`http://localhost/cubejs-api/v1/load?query=${encodeURIComponent(JSON.stringify(query))}`)
    const res = await app.request(req)
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.data).toBeDefined()
  })

  it('should handle errors gracefully', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['NonExistent.count']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(404)
    
    const data = await res.json()
    expect(data.error).toContain('not found')
  })
})
```

Run the test:

```bash
npm test tests/adapters/hono.test.ts
```

## Step 5: Create Usage Example

Create `src/adapters/hono/example.ts` to show how to use the adapter:

```typescript
/**
 * Example usage of the Hono adapter
 * This shows how to integrate Drizzle Cube with a Hono application
 */

import { Hono } from 'hono'
import { createCubeApp, mountCubeRoutes } from './index'
import { SemanticLayerCompiler, employeesCube, departmentsCube } from '../../server'

// Example 1: Create a standalone Cube.js API app
export function createStandaloneCubeApp() {
  // Mock database executor (replace with your real database)
  const dbExecutor = {
    async execute(sql: string, params?: any[]) {
      console.log('Executing SQL:', sql)
      console.log('Parameters:', params)
      
      // In a real app, execute against your database here
      // For example with Drizzle:
      // return await db.execute(sql(sql, params))
      
      return [] // Mock empty result
    }
  }

  // Create semantic layer and register cubes
  const semanticLayer = new SemanticLayerCompiler(dbExecutor)
  semanticLayer.registerCube(employeesCube)
  semanticLayer.registerCube(departmentsCube)

  // Create Cube.js API app
  const app = createCubeApp({
    semanticLayer,
    databaseExecutor: dbExecutor,
    getSecurityContext: async (c) => ({
      // Extract from your authentication system
      organisation: c.get('session')?.organisation?.id || 'default-org',
      userId: c.get('session')?.user?.id,
      // Add any other context your cubes need
    }),
    cors: {
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
      credentials: true
    }
  })

  return app
}

// Example 2: Mount Cube.js routes on existing Hono app
export function mountOnExistingApp() {
  const app = new Hono()

  // Your existing routes
  app.get('/health', (c) => c.text('OK'))
  app.get('/api/users', (c) => c.json({ users: [] }))

  // Setup semantic layer
  const dbExecutor = {
    async execute(sql: string, params?: any[]) {
      // Your database execution logic
      return []
    }
  }

  const semanticLayer = new SemanticLayerCompiler(dbExecutor)
  semanticLayer.registerCube(employeesCube)

  // Mount Cube.js routes
  mountCubeRoutes(app, {
    semanticLayer,
    getSecurityContext: async (c) => ({
      organisation: c.get('organisation'),
      // Your context extraction logic
    })
  })

  return app
}

// Example 3: Custom security context extraction
export function createAppWithCustomAuth() {
  const dbExecutor = {
    async execute(sql: string, params?: any[]) {
      return []
    }
  }

  const semanticLayer = new SemanticLayerCompiler(dbExecutor)
  semanticLayer.registerCube(employeesCube)

  const app = createCubeApp({
    semanticLayer,
    getSecurityContext: async (c) => {
      // Example: Extract from JWT token
      const authHeader = c.req.header('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }

      const token = authHeader.replace('Bearer ', '')
      // Verify and decode JWT (use your JWT library)
      // const payload = jwt.verify(token, secret)
      
      // Return security context based on token
      return {
        organisation: 'org-from-token',
        userId: 'user-from-token',
        permissions: ['read', 'write']
      }
    },
    basePath: '/api/analytics/v1' // Custom API path
  })

  return app
}

// Example 4: Integration with session-based auth
export function createAppWithSessionAuth() {
  const dbExecutor = {
    async execute(sql: string, params?: any[]) {
      return []
    }
  }

  const semanticLayer = new SemanticLayerCompiler(dbExecutor)
  semanticLayer.registerCube(employeesCube)

  const app = new Hono()

  // Add session middleware (example)
  app.use('*', async (c, next) => {
    // Your session logic here
    const sessionId = c.req.header('X-Session-ID')
    if (sessionId) {
      // Load session from your store
      const session = { organisation: { id: 'org-123' }, user: { id: 'user-456' } }
      c.set('session', session)
    }
    await next()
  })

  mountCubeRoutes(app, {
    semanticLayer,
    getSecurityContext: async (c) => {
      const session = c.get('session')
      if (!session) {
        throw new Error('No session found')
      }

      return {
        organisation: session.organisation.id,
        userId: session.user.id
      }
    }
  })

  return app
}
```

## Step 6: Build and Test

Build the adapters:

```bash
npm run build:adapters
```

Verify the build output in `dist/adapters/hono/`.

## Step 7: Update Main Package Exports

Update the main `package.json` exports to include the adapter:

```json
{
  "exports": {
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    },
    "./client": {
      "types": "./dist/client/index.d.ts", 
      "import": "./dist/client/index.js"
    },
    "./adapters/hono": {
      "types": "./dist/adapters/hono/index.d.ts",
      "import": "./dist/adapters/hono/index.js"
    }
  }
}
```

## Step 8: Documentation

Create `src/adapters/README.md`:

```markdown
# Framework Adapters

This directory contains framework-specific adapters for Drizzle Cube. Each adapter provides a standardized way to integrate the semantic layer with different web frameworks.

## Available Adapters

### Hono Adapter

**Import**: `drizzle-cube/adapters/hono`  
**Framework**: [Hono](https://hono.dev)  
**Features**: Full Cube.js API compatibility, CORS support, flexible authentication  

```typescript
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  getSecurityContext: (c) => ({ organisation: c.get('org') })
})
```

## Creating New Adapters

To create an adapter for a new framework:

1. Create a new directory: `src/adapters/your-framework/`
2. Implement the adapter following the Hono example
3. Add exports to the main package.json
4. Create tests in `tests/adapters/your-framework.test.ts`
5. Add documentation

### Adapter Requirements

All adapters should:
- Provide the three Cube.js endpoints: `/load`, `/meta`, `/sql`
- Accept a `getSecurityContext` function
- Support both GET and POST for `/load` and `/sql`
- Handle errors gracefully
- Return responses in Cube.js format
- Allow custom base paths
- Support CORS configuration
```

## ✅ Checkpoint

You should now have:
- [ ] Working Hono adapter with full Cube.js API compatibility
- [ ] Tests passing for all endpoints
- [ ] Clear documentation and examples
- [ ] Build system producing adapter output
- [ ] Framework-agnostic design that can extend to other frameworks
- [ ] Security context completely configurable by consuming application

**Common issues**:
- **Hono import errors**: Make sure Hono is installed as a dev dependency
- **Type errors**: Verify all imports from server module are correct
- **Test failures**: Check that mock data matches expected format
- **Build errors**: Ensure vite adapter config is correct

---

**Next Step**: Proceed to [04-extract-client-components.md](./04-extract-client-components.md)