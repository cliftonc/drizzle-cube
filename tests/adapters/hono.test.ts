import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { createCubeRoutes } from '../../src/adapters/hono'
import { 
  createTestSemanticLayer,
  testEmployeesCube,
  testSecurityContext,
  testSchema
} from '../helpers/test-database'

describe('Hono Adapter', () => {
  let app: Hono
  let closeFn: (() => void) | null = null
  let semanticLayerFn
  let drizzleDb

  // Mock security context extractor
  const mockGetSecurityContext = async (_c: any) => testSecurityContext

  beforeAll(async () => {
    const { semanticLayer, db, close } = await createTestSemanticLayer()
    closeFn = close
    semanticLayerFn = semanticLayer
    drizzleDb = db
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    app = createCubeRoutes({
      semanticLayer: semanticLayerFn,
      drizzle: drizzleDb,
      schema: testSchema,
      getSecurityContext: mockGetSecurityContext
    })
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
        dimensions: ['Employees.departmentName']
      })
    })

    const res = await app.request(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.annotation).toBeDefined()
    expect(data.query).toBeDefined()
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
    expect(data.params).toBeDefined()
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
    expect(Array.isArray(data.data)).toBe(true)
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
    expect(res.status).toBe(500)
    
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
    expect(data.error).toContain('must specify at least one measure or dimension')
  })

  it('should support custom base path', async () => {
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const customApp = createCubeRoutes({
      semanticLayer: semanticLayerFn,
      drizzle: drizzleDb,
      getSecurityContext: mockGetSecurityContext,
      basePath: '/api/analytics'
    })

    const req = new Request('http://localhost/api/analytics/meta')
    const res = await customApp.request(req)
    
    expect(res.status).toBe(200)    
  })

  it('should handle SQL generation via GET', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.departmentName']
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
    
    expect(res.status).toBe(500)
    
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
    expect(data.data).toBeDefined()
    expect(data.data.length).toBeGreaterThan(0)
    
    // Check that we get actual employee names
    const firstRow = data.data[0]
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
    expect(data.data).toBeDefined()
    expect(data.data.length).toBe(1)
    expect(data.data[0]['Employees.name']).toContain('John')
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
    expect(data.data).toBeDefined()
    expect(data.data.length).toBe(1)
    
    const row = data.data[0]
    expect(typeof row['Employees.avgSalary']).toBe('number')
    expect(typeof row['Employees.totalSalary']).toBe('number')
    expect(row['Employees.avgSalary']).toBeGreaterThan(0)
    expect(row['Employees.totalSalary']).toBeGreaterThan(0)
  })
})