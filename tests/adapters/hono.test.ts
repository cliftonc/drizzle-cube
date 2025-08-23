import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { createCubeRoutes } from '../../src/adapters/hono'
import { 
  createTestSemanticLayer,
  getTestSchema,
  getTestDatabaseType
} from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

describe('Hono Adapter', () => {
  let app: Hono
  let closeFn: (() => void) | null = null
  let semanticLayerFn
  let drizzleDb
  let dynamicEmployeesCube
  let currentSchema

  // Mock security context extractor
  const mockGetSecurityContext = async (_c: any) => testSecurityContexts.org1
  
  // Helper function to create routes options with correct schema and engine type
  const createRoutesOptions = (customOptions = {}) => ({
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
    
    app = createCubeRoutes(createRoutesOptions())
  })

  afterAll(() => {
    if (closeFn) {
      closeFn()
      closeFn = null
    }
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
        dimensions: ['Employees.name']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
    expect(data.results[0].annotation).toBeDefined()
    expect(data.pivotQuery).toBeDefined()
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
        dimensions: ['Employees.name']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle query via GET with query string', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const req = new Request(`http://localhost/cubejs-api/v1/load?query=${encodeURIComponent(JSON.stringify(query))}`)
    const res = await app.request(req)
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
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
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toContain('not found')
  })

  it('should validate queries require measures or dimensions', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const res = await app.request(req)
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toContain('Query must reference at least one cube')
  })

  it('should support custom base path', async () => {
    // Cube already registered in beforeAll
    
    const customApp = createCubeRoutes({
      cubes: [dynamicEmployeesCube],
      drizzle: drizzleDb,
      extractSecurityContext: mockGetSecurityContext,
      basePath: '/api/analytics'
    })

    const req = new Request('http://localhost/api/analytics/meta')
    const res = await customApp.request(req)
    
    expect(res.status).toBe(200)    
  })

  it('should handle SQL generation via GET', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const req = new Request(`http://localhost/cubejs-api/v1/sql?query=${encodeURIComponent(JSON.stringify(query))}`)
    const res = await app.request(req)
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle malformed query parameters', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load?query=invalid-json')
    const res = await app.request(req)
    
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('should return actual data from database', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
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
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['John']
        }]
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBe(2) // Enhanced data may have multiple John entries due to joins
    expect(data.results[0].data.every(row => row['Employees.name'].includes('John'))).toBe(true)
  })

  it('should handle aggregation measures', async () => {
    const req = new Request('http://localhost/cubejs-api/v1/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measures: ['Employees.avgSalary', 'Employees.totalSalary']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBe(1)
    
    const row = data.results[0].data[0]
    expect(typeof row['Employees.avgSalary']).toBe('number')
    expect(typeof row['Employees.totalSalary']).toBe('number')
    expect(row['Employees.avgSalary']).toBeGreaterThan(0)
    expect(row['Employees.totalSalary']).toBeGreaterThan(0)
  })
})