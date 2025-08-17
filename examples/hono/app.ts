/**
 * Complete Hono app example with drizzle-cube integration
 * This demonstrates how to create a production-ready analytics API using Hono and drizzle-cube
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { SemanticLayerCompiler, createCubeApp } from '../../src/server'
import type { SecurityContext } from '../../src/server'
import { schema } from './schema'
import { allCubes } from './cubes'
import type { Schema } from './schema'

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

// Create semantic layer
const semanticLayer = new SemanticLayerCompiler<Schema>({
  drizzle: db,
  schema,
  engineType: 'postgres'
})

// Register all cubes
allCubes.forEach(cube => {
  semanticLayer.registerCube(cube)
})

// Security context extractor - customize based on your auth system
async function getSecurityContext(c: any): Promise<SecurityContext> {
  // Example: Extract from JWT token or session
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    throw new Error('Authorization header required')
  }
  
  // In production, decode JWT and extract user info
  // For this example, we'll use a simple approach
  try {
    // Mock JWT decode - replace with your actual JWT library
    const token = authHeader.replace('Bearer ', '')
    
    // For demo purposes, assume organisationId is in the token
    // In real implementation, decode JWT and extract user context
    return {
      organisationId: 1, // Extract from token
      userId: 1,         // Extract from token
      // Add other security context fields as needed
    }
  } catch (error) {
    throw new Error('Invalid authorization token')
  }
}

// Create the main Hono app
const app = new Hono()

// Add middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API documentation endpoint
app.get('/api/docs', (c) => {
  const metadata = semanticLayer.getMetadata()
  
  return c.json({
    title: 'Employee Analytics API',
    description: 'Drizzle-cube powered analytics API with Cube.js compatibility',
    version: '1.0.0',
    endpoints: {
      'GET /cubejs-api/v1/meta': 'Get available cubes and their schema',
      'POST /cubejs-api/v1/load': 'Execute analytics queries',
      'GET /cubejs-api/v1/load': 'Execute queries via query string',
      'POST /cubejs-api/v1/sql': 'Generate SQL without execution',
      'GET /cubejs-api/v1/sql': 'Generate SQL via query string'
    },
    cubes: metadata.map(cube => ({
      name: cube.name,
      title: cube.title,
      description: cube.description,
      dimensions: Object.keys(cube.dimensions || {}),
      measures: Object.keys(cube.measures || {})
    })),
    examples: {
      'Employee count by department': {
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentName']
      },
      'Salary analytics': {
        measures: ['Employees.avgSalary', 'Employees.totalSalary'],
        dimensions: ['Employees.departmentName']
      },
      'Active employees only': {
        measures: ['Employees.activeCount'],
        dimensions: ['Employees.departmentName'],
        filters: [{
          member: 'Employees.isActive',
          operator: 'equals',
          values: [true]
        }]
      }
    }
  })
})

// Mount the cube API routes
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext,
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
})

// Mount cube routes under the main app
app.route('/', cubeApp)

// Example protected endpoint showing how to use the same security context
app.get('/api/user-info', async (c) => {
  try {
    const securityContext = await getSecurityContext(c)
    
    return c.json({
      organisationId: securityContext.organisationId,
      userId: securityContext.userId,
      message: 'This endpoint uses the same security context as the cube API'
    })
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unauthorized' 
    }, 401)
  }
})

// Error handling
app.onError((err, c) => {
  console.error('Application error:', err)
  
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The requested endpoint was not found'
  }, 404)
})

export default app

// Export for testing
export { semanticLayer, db }