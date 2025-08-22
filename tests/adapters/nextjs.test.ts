/**
 * Next.js adapter tests
 * Tests route handler creation and functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends Request {
    nextUrl: any
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      })
      return response
    }
  }
}))

// Import after mocking
import { NextRequest } from 'next/server'
import {
  createLoadHandler,
  createMetaHandler, 
  createSqlHandler,
  createDryRunHandler,
  createCubeHandlers,
  createOptionsHandler,
  type NextAdapterOptions,
  type NextCorsOptions
} from '../../src/adapters/nextjs'
import { 
  createTestSemanticLayer,
  testSchema,
  getTestDatabaseType
} from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { testEmployeesCube, createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

// Mock Next.js environment
const mockNextUrl = {
  searchParams: new URLSearchParams()
}

function createMockNextRequest(method: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = 'http://localhost:3000/api/cubejs'
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const nextRequest = request as any as NextRequest
  nextRequest.nextUrl = {
    ...mockNextUrl,
    searchParams: new URLSearchParams(searchParams || {})
  }
  nextRequest.json = async () => body || {}

  return nextRequest
}

describe('Next.js Adapter', () => {
  let semanticLayer: any
  let drizzleDb: any
  let closeFn: (() => void) | null = null
  let adapterOptions: NextAdapterOptions<typeof testSchema>

  beforeEach(async () => {
    const testSetup = await createTestSemanticLayer()
    semanticLayer = testSetup.semanticLayer
    drizzleDb = testSetup.db
    closeFn = testSetup.close
    
    // Register test cubes
    const { testEmployeesCube: dynamicEmployeesCube } = await createTestCubesForCurrentDatabase()
    semanticLayer.registerCube(dynamicEmployeesCube)
    semanticLayer.registerCube(testEmployeesCube)
    
    adapterOptions = {
      semanticLayer,
      drizzle: drizzleDb,
      schema: testSchema,
      getSecurityContext: async () => testSecurityContexts.org1,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }
    }
  })

  afterEach(() => {
    if (closeFn) {
      closeFn()
      closeFn = null
    }
  })

  describe('Route Handler Creation', () => {
    it('should create load handler', () => {
      const handler = createLoadHandler(adapterOptions)
      expect(typeof handler).toBe('function')
    })

    it('should create meta handler', () => {
      const handler = createMetaHandler(adapterOptions)
      expect(typeof handler).toBe('function')
    })

    it('should create SQL handler', () => {
      const handler = createSqlHandler(adapterOptions)
      expect(typeof handler).toBe('function')
    })

    it('should create dry-run handler', () => {
      const handler = createDryRunHandler(adapterOptions)
      expect(typeof handler).toBe('function')
    })

    it('should create all handlers with convenience function', () => {
      const handlers = createCubeHandlers(adapterOptions)
      expect(handlers).toHaveProperty('load')
      expect(handlers).toHaveProperty('meta')
      expect(handlers).toHaveProperty('sql')
      expect(handlers).toHaveProperty('dryRun')
      expect(typeof handlers.load).toBe('function')
      expect(typeof handlers.meta).toBe('function')
      expect(typeof handlers.sql).toBe('function')
      expect(typeof handlers.dryRun).toBe('function')
    })
  })

  describe('Load Handler', () => {
    it('should handle POST requests with valid query', async () => {
      const handler = createLoadHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('queryType', 'regularQuery')
      expect(data).toHaveProperty('results')
      expect(Array.isArray(data.results)).toBe(true)
    })

    it('should handle POST requests with nested query format', async () => {
      const handler = createLoadHandler(adapterOptions)
      const body = {
        query: {
          measures: ['Employees.count'],
          dimensions: ['Employees.name']
        }
      }
      
      const request = createMockNextRequest('POST', body)
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('queryType', 'regularQuery')
    })

    it('should handle GET requests with query parameter', async () => {
      const handler = createLoadHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('GET', undefined, {
        query: JSON.stringify(query)
      })
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('queryType', 'regularQuery')
    })

    it('should return 400 for GET requests without query parameter', async () => {
      const handler = createLoadHandler(adapterOptions)
      const request = createMockNextRequest('GET')
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Query parameter is required')
    })

    it('should return 400 for invalid JSON in query parameter', async () => {
      const handler = createLoadHandler(adapterOptions)
      const request = createMockNextRequest('GET', undefined, {
        query: 'invalid-json'
      })
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Invalid JSON in query parameter')
    })

    it('should return 405 for unsupported methods', async () => {
      const handler = createLoadHandler(adapterOptions)
      const request = createMockNextRequest('DELETE')
      const response = await handler(request)
      
      expect(response.status).toBe(405)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Method not allowed')
    })

    it('should include CORS headers when configured', async () => {
      const handler = createLoadHandler(adapterOptions)
      const query = {
        measures: ['Employees.count']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })
  })

  describe('Meta Handler', () => {
    it('should return cube metadata', async () => {
      const handler = createMetaHandler(adapterOptions)
      const request = createMockNextRequest('GET')
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('cubes')
      expect(Array.isArray(data.cubes)).toBe(true)
    })

    it('should include CORS headers when configured', async () => {
      const handler = createMetaHandler(adapterOptions)
      const request = createMockNextRequest('GET')
      const response = await handler(request)
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('SQL Handler', () => {
    it('should generate SQL for POST requests', async () => {
      const handler = createSqlHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('sql')
      expect(data).toHaveProperty('query')
      expect(typeof data.sql).toBe('string')
    })

    it('should generate SQL for GET requests with query parameter', async () => {
      const handler = createSqlHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('GET', undefined, {
        query: JSON.stringify(query)
      })
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('sql')
      expect(typeof data.sql).toBe('string')
    })

    it('should return 400 for queries without measures or dimensions', async () => {
      const handler = createSqlHandler(adapterOptions)
      const query = {}
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Query validation failed')
    })

    it('should return 405 for unsupported methods', async () => {
      const handler = createSqlHandler(adapterOptions)
      const request = createMockNextRequest('DELETE')
      const response = await handler(request)
      
      expect(response.status).toBe(405)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Method not allowed')
    })
  })

  describe('Dry-Run Handler', () => {
    it('should validate queries for POST requests', async () => {
      const handler = createDryRunHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('valid', true)
      expect(data).toHaveProperty('queryType', 'regularQuery')
      expect(data).toHaveProperty('sql')
    })

    it('should validate queries for GET requests', async () => {
      const handler = createDryRunHandler(adapterOptions)
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const request = createMockNextRequest('GET', undefined, {
        query: JSON.stringify(query)
      })
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('valid', true)
    })

    it('should return validation errors for invalid queries', async () => {
      const handler = createDryRunHandler(adapterOptions)
      const query = {
        measures: ['invalid.field']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('valid', false)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for GET requests without query parameter', async () => {
      const handler = createDryRunHandler(adapterOptions)
      const request = createMockNextRequest('GET')
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Query parameter is required')
      expect(data).toHaveProperty('valid', false)
    })
  })

  describe('CORS Configuration', () => {
    it('should create OPTIONS handler', () => {
      const corsOptions: NextCorsOptions = {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
      
      const handler = createOptionsHandler(corsOptions)
      expect(typeof handler).toBe('function')
    })

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const corsOptions: NextCorsOptions = {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }
      
      const handler = createOptionsHandler(corsOptions)
      const request = createMockNextRequest('OPTIONS')
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should handle array origins correctly', async () => {
      const corsOptions: NextCorsOptions = {
        origin: ['http://localhost:3000', 'https://example.com'],
        methods: ['GET', 'POST']
      }
      
      const handler = createOptionsHandler(corsOptions)
      const request = createMockNextRequest('OPTIONS')
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    })

    it('should handle function origins correctly', async () => {
      const corsOptions: NextCorsOptions = {
        origin: (origin: string) => origin.includes('localhost'),
        methods: ['GET', 'POST']
      }
      
      const handler = createOptionsHandler(corsOptions)
      const request = createMockNextRequest('OPTIONS')
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    })
  })

  describe('Security Context', () => {
    it('should pass security context to semantic layer', async () => {
      let capturedContext: any = null
      
      const customOptions: NextAdapterOptions<typeof testSchema> = {
        ...adapterOptions,
        getSecurityContext: async (request) => {
          capturedContext = { organisationId: 'custom-org-456' }
          return capturedContext
        }
      }
      
      const handler = createLoadHandler(customOptions)
      const query = {
        measures: ['Employees.count']
      }
      
      const request = createMockNextRequest('POST', query)
      await handler(request)
      
      expect(capturedContext).not.toBeNull()
      expect(capturedContext.organisationId).toBe('custom-org-456')
    })

    it('should pass route context to getSecurityContext', async () => {
      let capturedRouteContext: any = null
      
      const customOptions: NextAdapterOptions<typeof testSchema> = {
        ...adapterOptions,
        getSecurityContext: async (request, context) => {
          capturedRouteContext = context
          return { organisationId: 'test-org-123' }
        }
      }
      
      const handler = createLoadHandler(customOptions)
      const query = {
        measures: ['Employees.count']
      }
      
      const request = createMockNextRequest('POST', query)
      const routeContext = { params: { endpoint: 'load' } }
      await handler(request, routeContext)
      
      expect(capturedRouteContext).toEqual(routeContext)
    })
  })

  describe('Error Handling', () => {
    it('should handle semantic layer errors gracefully', async () => {
      const errorOptions: NextAdapterOptions<typeof testSchema> = {
        ...adapterOptions,
        getSecurityContext: async () => {
          throw new Error('Authentication failed')
        }
      }
      
      const handler = createLoadHandler(errorOptions)
      const query = {
        measures: ['Employees.count']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Authentication failed')
    })

    it('should handle query validation errors', async () => {
      const handler = createLoadHandler(adapterOptions)
      const query = {
        measures: ['nonexistent.field']
      }
      
      const request = createMockNextRequest('POST', query)
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Query validation failed')
    })
  })

  describe('Runtime Configuration', () => {
    it('should accept runtime configuration', () => {
      const edgeOptions: NextAdapterOptions<typeof testSchema> = {
        ...adapterOptions,
        runtime: 'edge'
      }
      
      const handler = createLoadHandler(edgeOptions)
      expect(typeof handler).toBe('function')
    })

    it('should default to nodejs runtime', () => {
      const handler = createLoadHandler(adapterOptions)
      expect(typeof handler).toBe('function')
    })
  })
})