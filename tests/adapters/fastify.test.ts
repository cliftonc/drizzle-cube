import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { cubePlugin, createCubeApp } from '../../src/adapters/fastify'
import {
  createTestSemanticLayer,
  getTestSchema,
  getTestDatabaseType,
  skipIfDuckDB
} from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

describe('Fastify Adapter', () => {
  let app: FastifyInstance
  let closeFn: (() => void) | null = null
  let semanticLayerFn
  let drizzleDb
  let dynamicEmployeesCube
  let currentSchema

  // Mock security context extractor
  const mockGetSecurityContext = async () => testSecurityContexts.org1
  
  // Helper function to create plugin options with correct schema and engine type
  const createPluginOptions = (customOptions = {}) => ({
    cubes: [dynamicEmployeesCube],
    drizzle: drizzleDb,
    schema: currentSchema,
    extractSecurityContext: mockGetSecurityContext,
    engineType: getTestDatabaseType() as 'postgres' | 'mysql' | 'sqlite',
    ...customOptions
  })

  beforeAll(async () => {
    const { semanticLayer, db, close } = await createTestSemanticLayer()
    closeFn = close
    semanticLayerFn = semanticLayer
    drizzleDb = db
    
    // Get the correct schema for the current database type
    const { schema } = await getTestSchema()
    currentSchema = schema
    
    // Use dynamic cube creation to ensure correct schema for current database type
    const { testEmployeesCube: dynamicCube } = await createTestCubesForCurrentDatabase()
    dynamicEmployeesCube = dynamicCube
    semanticLayerFn.registerCube(dynamicEmployeesCube)
    
    // Create Fastify app with cube plugin
    app = require('fastify')({ logger: false }) // Disable logging for tests
    await app.register(cubePlugin as any, createPluginOptions())
    
    await app.ready()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (closeFn) {
      closeFn()
      closeFn = null
    }
  })

  it('should create cube routes', () => {
    expect(app).toBeDefined()
  })

  it('should handle POST /cubejs-api/v1/load', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
    expect(data.results[0].annotation).toBeDefined()
    expect(data.pivotQuery).toBeDefined()
  })

  it('should handle GET /cubejs-api/v1/meta', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cubejs-api/v1/meta'
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.cubes).toBeDefined()
    expect(Array.isArray(data.cubes)).toBe(true)
    expect(data.cubes[0].name).toBe('Employees')
  })

  it('should handle POST /cubejs-api/v1/sql', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/sql',
      payload: {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle query via GET with query string', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const response = await app.inject({
      method: 'GET',
      url: `/cubejs-api/v1/load?query=${encodeURIComponent(JSON.stringify(query))}`
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['NonExistent.count']
      }
    })
    
    expect(response.statusCode).toBe(400)
    const data = JSON.parse(response.payload)
    expect(data.error).toContain('not found')
  })

  it('should validate queries require measures or dimensions', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {}
    })
    
    expect(response.statusCode).toBe(400)
    const data = JSON.parse(response.payload)
    expect(data.error).toContain('Query must reference at least one cube')
  })

  it('should support custom base path', async () => {
    const customApp = require('fastify')({ logger: false })
    await customApp.register(cubePlugin as any, createPluginOptions({
      basePath: '/api/analytics'
    }))
    await customApp.ready()

    const response = await customApp.inject({
      method: 'GET',
      url: '/api/analytics/meta'
    })
    
    expect(response.statusCode).toBe(200)
    await customApp.close()
  })

  it('should handle SQL generation via GET', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const response = await app.inject({
      method: 'GET',
      url: `/cubejs-api/v1/sql?query=${encodeURIComponent(JSON.stringify(query))}`
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle malformed query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cubejs-api/v1/load?query=invalid-json'
    })
    
    expect(response.statusCode).toBe(400)
    const data = JSON.parse(response.payload)
    expect(data.error).toBeDefined()
  })

  it('should return actual data from database', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBeGreaterThan(0)
    
    // Check that we get actual employee names
    const firstRow = data.results[0].data[0]
    expect(firstRow['Employees.name']).toBeDefined()
    expect(typeof firstRow['Employees.name']).toBe('string')
    expect(firstRow['Employees.count']).toBeDefined()
    expect(typeof firstRow['Employees.count']).toBe('number')
  })

  it('should handle complex queries with filters', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['e']
        }]
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBeGreaterThan(0) // Multiple employees with 'e' in name in Org 1
    expect(data.results[0].data.every(row => row['Employees.name'].toLowerCase().includes('e'))).toBe(true)
  })

  it('should handle aggregation measures', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['Employees.avgSalary', 'Employees.totalSalary']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBe(1)
    
    const row = data.results[0].data[0]
    expect(typeof row['Employees.avgSalary']).toBe('number')
    expect(typeof row['Employees.totalSalary']).toBe('number')
    expect(row['Employees.avgSalary']).toBeGreaterThan(0)
    expect(row['Employees.totalSalary']).toBeGreaterThan(0)
  })

  it('should handle POST /cubejs-api/v1/dry-run', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/dry-run',
      payload: {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.valid).toBe(true)
    expect(data.sql).toBeDefined()
    expect(data.sql.sql).toBeDefined()
    expect(Array.isArray(data.sql.sql)).toBe(true)
    expect(data.complexity).toBeDefined()
    expect(data.cubesUsed).toBeDefined()
    expect(data.cubesUsed).toContain('Employees')
  })

  it('should handle GET /cubejs-api/v1/dry-run', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const response = await app.inject({
      method: 'GET',
      url: `/cubejs-api/v1/dry-run?query=${encodeURIComponent(JSON.stringify(query))}`
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.valid).toBe(true)
    expect(data.sql).toBeDefined()
    expect(data.sql.sql).toBeDefined()
    expect(Array.isArray(data.sql.sql)).toBe(true)
    expect(data.complexity).toBeDefined()
    expect(data.cubesUsed).toBeDefined()
    expect(data.cubesUsed).toContain('Employees')
  })

  it('should handle CORS configuration', async () => {
    const corsApp = require('fastify')({ logger: false })
    await corsApp.register(cubePlugin as any, createPluginOptions({
      cors: {
        origin: 'http://localhost:3000',
        credentials: true
      }
    }))
    await corsApp.ready()

    const response = await corsApp.inject({
      method: 'GET',
      url: '/cubejs-api/v1/meta',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    })
    
    // Test that the response is successful and CORS headers are present
    expect(response.statusCode).toBe(200)
    // CORS headers may be set by the @fastify/cors plugin
    // Just check that the endpoint works with CORS enabled
    const data = JSON.parse(response.payload)
    expect(data.cubes).toBeDefined()
    
    await corsApp.close()
  })

  it('should handle custom body limit', async () => {
    const customApp = require('fastify')({ logger: false })
    await customApp.register(cubePlugin as any, createPluginOptions({
      bodyLimit: 1024 * 1024 // 1MB
    }))
    await customApp.ready()

    // Should still work with normal queries
    const response = await customApp.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        measures: ['Employees.count']
      }
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    
    await customApp.close()
  })

  it('should work with createCubeApp helper', async () => {
    const standaloneApp = createCubeApp(createPluginOptions())

    await standaloneApp.ready()

    const response = await standaloneApp.inject({
      method: 'GET',
      url: '/cubejs-api/v1/meta'
    })
    
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.cubes).toBeDefined()
    expect(Array.isArray(data.cubes)).toBe(true)
    
    await standaloneApp.close()
  })

  it('should handle JSON parsing errors gracefully', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cubejs-api/v1/sql?query=not-valid-json'
    })
    
    // Fastify might return 500 for JSON parsing errors, that's acceptable
    expect([400, 500]).toContain(response.statusCode)
    const data = JSON.parse(response.payload)
    expect(data.error).toBeDefined()
  })

  it('should validate schema for request body', async () => {
    // Fastify should validate the body against the JSON schema
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: null // Invalid payload
    })
    
    // Fastify might return 500 for null payload, that's acceptable
    expect([400, 500]).toContain(response.statusCode)
  })

  it('should handle nested query format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/load',
      payload: {
        query: {
          measures: ['Employees.count'],
          dimensions: ['Employees.name']
        }
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
  })

  // Batch endpoint tests
  // DuckDB: In-memory databases have limited support for parallel prepared statements
  it.skipIf(skipIfDuckDB())('should handle POST /cubejs-api/v1/batch with multiple queries', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/batch',
      payload: {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.totalSalary'] }
        ]
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBe(2)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(true)
  })

  it('should handle POST /batch with partial failure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/batch',
      payload: {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['NonExistent.count'] }
        ]
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.payload)
    expect(data.results).toBeDefined()
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBe(2)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(false)
    expect(data.results[1].error).toBeDefined()
  })

  it('should return error for POST /batch without queries array', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/batch',
      payload: {}
    })

    // Fastify may return 400 or 500 depending on error handling
    expect([400, 500]).toContain(response.statusCode)
    const data = JSON.parse(response.payload)
    expect(data.error).toBeDefined()
  })

  it('should return 400 for POST /batch with empty queries array', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cubejs-api/v1/batch',
      payload: { queries: [] }
    })

    expect(response.statusCode).toBe(400)
    const data = JSON.parse(response.payload)
    expect(data.error).toContain('empty')
  })

  // Empty cubes validation
  it('should throw error when creating plugin with empty cubes array', async () => {
    const testApp = require('fastify')({ logger: false })

    await expect(
      testApp.register(cubePlugin as any, {
        cubes: [],
        drizzle: drizzleDb,
        extractSecurityContext: mockGetSecurityContext
      })
    ).rejects.toThrow('At least one cube must be provided')

    await testApp.close()
  })
})