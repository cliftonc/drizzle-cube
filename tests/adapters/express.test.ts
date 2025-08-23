import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import { createCubeRouter } from '../../src/adapters/express'
import { 
  createTestSemanticLayer,
  getTestSchema,
  getTestDatabaseType
} from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

describe('Express Adapter', () => {
  let app: Express
  let closeFn: (() => void) | null = null
  let semanticLayerFn
  let drizzleDb
  let dynamicEmployeesCube
  let currentSchema

  // Mock security context extractor
  const mockGetSecurityContext = async (req: any, res: any) => testSecurityContexts.org1
  
  // Helper function to create router options with correct schema and engine type
  const createRouterOptions = (customOptions = {}) => ({
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
    
    app = express()
    const cubeRouter = createCubeRouter(createRouterOptions())
    app.use('/', cubeRouter)
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
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      })
      .expect(200)
    
    const data = response.body
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
    expect(data.results[0].annotation).toBeDefined()
    expect(data.pivotQuery).toBeDefined()
  })

  it('should handle GET /cubejs-api/v1/meta', async () => {
    const response = await request(app)
      .get('/cubejs-api/v1/meta')
      .expect(200)
    
    const data = response.body
    expect(data.cubes).toBeDefined()
    expect(Array.isArray(data.cubes)).toBe(true)
    expect(data.cubes[0].name).toBe('Employees')
  })

  it('should handle POST /cubejs-api/v1/sql', async () => {
    const response = await request(app)
      .post('/cubejs-api/v1/sql')
      .send({
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      })
      .expect(200)
    
    const data = response.body
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle query via GET with query string', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const response = await request(app)
      .get(`/cubejs-api/v1/load?query=${encodeURIComponent(JSON.stringify(query))}`)
      .expect(200)
    
    const data = response.body
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(Array.isArray(data.results[0].data)).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['NonExistent.count']
      })
      .expect(400)
    
    const data = response.body
    expect(data.error).toContain('not found')
  })

  it('should validate queries require measures or dimensions', async () => {
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({})
      .expect(400)
    
    const data = response.body
    expect(data.error).toContain('Query must reference at least one cube')
  })

  it('should support custom base path', async () => {
    const customApp = express()
    const customRouter = createCubeRouter({
      cubes: [dynamicEmployeesCube],
      drizzle: drizzleDb,
      extractSecurityContext: mockGetSecurityContext,
      basePath: '/api/analytics'
    })
    customApp.use('/', customRouter)

    const response = await request(customApp)
      .get('/api/analytics/meta')
      .expect(200)
  })

  it('should handle SQL generation via GET', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    
    const response = await request(app)
      .get(`/cubejs-api/v1/sql?query=${encodeURIComponent(JSON.stringify(query))}`)
      .expect(200)
    
    const data = response.body
    expect(data.sql).toBeDefined()
    expect(typeof data.sql).toBe('string')
    expect(data.params).toBeDefined()
  })

  it('should handle malformed query parameters', async () => {
    const response = await request(app)
      .get('/cubejs-api/v1/load?query=invalid-json')
      .expect(400)
    
    const data = response.body
    expect(data.error).toBeDefined()
  })

  it('should return actual data from database', async () => {
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      })
      .expect(200)
    
    const data = response.body
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
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['e']
        }]
      })
      .expect(200)
    
    const data = response.body
    expect(data.results).toBeDefined()
    expect(data.results[0].data).toBeDefined()
    expect(data.results[0].data.length).toBeGreaterThan(0) // Multiple employees with 'e' in name in Org 1
    expect(data.results[0].data.every(row => row['Employees.name'].toLowerCase().includes('e'))).toBe(true)
  })

  it('should handle aggregation measures', async () => {
    const response = await request(app)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['Employees.avgSalary', 'Employees.totalSalary']
      })
      .expect(200)
    
    const data = response.body
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
    const response = await request(app)
      .post('/cubejs-api/v1/dry-run')
      .send({
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      })
      .expect(200)
    
    const data = response.body
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
    
    const response = await request(app)
      .get(`/cubejs-api/v1/dry-run?query=${encodeURIComponent(JSON.stringify(query))}`)
      .expect(200)
    
    const data = response.body
    expect(data.valid).toBe(true)
    expect(data.sql).toBeDefined()
    expect(data.sql.sql).toBeDefined()
    expect(Array.isArray(data.sql.sql)).toBe(true)
    expect(data.complexity).toBeDefined()
    expect(data.cubesUsed).toBeDefined()
    expect(data.cubesUsed).toContain('Employees')
  })

  it('should handle CORS configuration', async () => {
    const corsApp = express()
    const corsRouter = createCubeRouter({
      cubes: [dynamicEmployeesCube],
      drizzle: drizzleDb,
      extractSecurityContext: mockGetSecurityContext,
      cors: {
        origin: 'http://localhost:3000',
        credentials: true
      }
    })
    corsApp.use('/', corsRouter)

    const response = await request(corsApp)
      .options('/cubejs-api/v1/meta')
      .set('Origin', 'http://localhost:3000')
      .expect(204)
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })

  it('should handle custom JSON limit', async () => {
    const customApp = express()
    const customRouter = createCubeRouter({
      cubes: [dynamicEmployeesCube],
      drizzle: drizzleDb,
      extractSecurityContext: mockGetSecurityContext,
      jsonLimit: '1mb'
    })
    customApp.use('/', customRouter)

    // Should still work with normal queries
    const response = await request(customApp)
      .post('/cubejs-api/v1/load')
      .send({
        measures: ['Employees.count']
      })
      .expect(200)
    
    expect(response.body.results).toBeDefined()
  })
})