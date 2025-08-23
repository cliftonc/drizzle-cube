/**
 * Complete Hono app example with drizzle-cube integration
 * This demonstrates how to create a production-ready analytics API using Hono and drizzle-cube
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import type { SecurityContext, DrizzleDatabase } from 'drizzle-cube/server'
import { schema } from './schema'
import { allCubes } from './cubes'
import type { Schema } from './schema'
import analyticsApp from './src/analytics-routes'
import aiApp from './src/ai-routes'

interface Variables {
  db: DrizzleDatabase<Schema>
}

// Environment detection - handle both Node.js and Cloudflare Workers
function getEnvironment() {
  // Check if we're in Cloudflare Workers
  if (typeof globalThis !== 'undefined' && 'caches' in globalThis) {
    return 'worker'
  }
  // Check if we're in Node.js
  if (typeof process !== 'undefined' && process.env) {
    return 'node'
  }
  return 'unknown'
}

// Get environment variable with fallback for different runtimes
function getEnvVar(key: string, fallback: string = ''): string {
  const env = getEnvironment()
  
  if (env === 'node' && typeof process !== 'undefined') {
    return process.env[key] || fallback
  }
  
  // For Cloudflare Workers, we'll set this up in the handler
  return fallback
}

// Auto-detect Neon vs local PostgreSQL based on connection string
function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

// Create database connection factory
function createDatabase(databaseUrl: string) {
  if (isNeonUrl(databaseUrl)) {
    console.log('🚀 Connecting to Neon serverless database')
    const sql = neon(databaseUrl)
    return drizzleNeon(sql, { schema })
  } else {
    console.log('🐘 Connecting to local PostgreSQL database')
    const client = postgres(databaseUrl)
    return drizzle(client, { schema })
  }
}

// Default database connection for Node.js environment
const defaultConnectionString = 'postgresql://drizzle_user:drizzle_pass123@localhost:54921/drizzle_cube_db'
const db = createDatabase(getEnvVar('DATABASE_URL', defaultConnectionString))

// Security context extractor - customize based on your auth system
// This function is called for EVERY API request to extract user permissions
async function extractSecurityContext(c: any): Promise<SecurityContext> {
  // Example: Extract from JWT token or session
  const authHeader = c.req.header('Authorization')
  
  // For development/demo purposes, allow requests without auth
  if (!authHeader) {
    console.log('⚠️  No authorization header - using default demo user (organisation: 1)')
    return {
      organisationId: 1, // Default demo organisation
      userId: 1,         // Default demo user
      // Add other security context fields as needed
    }
  }
  
  // In production, decode JWT and extract user info
  // For this example, we'll use a simple approach
  try {
    // Mock JWT decode - replace with your actual JWT library
    authHeader.replace('Bearer ', '')
    
    // For demo purposes, assume organisationId is in the token
    // In real implementation, decode JWT and extract user context
    return {
      organisationId: 1, // Extract from token
      userId: 1,         // Extract from token
      // Add other security context fields as needed
    }
  } catch (error) {
    console.log('⚠️  Invalid authorization token - using default demo user (organisation: 1)')
    return {
      organisationId: 1, // Fallback to demo organisation
      userId: 1,         // Fallback to demo user
    }
  }
}

// Create the main Hono app
const app = new Hono<{ Variables: Variables }>()

// Add middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'], // Add your frontend URLs
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Root endpoint with available routes
app.get('/', (c) => {
  return c.json({
    name: 'Drizzle Cube Analytics API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'GET /': 'This endpoint - API information',
      'GET /health': 'Health check',
      'GET /api/docs': 'API documentation with examples',
      'GET /cubejs-api/v1/meta': 'Available cubes and schema',
      'POST /cubejs-api/v1/load': 'Execute analytics queries',
      'GET /cubejs-api/v1/load?query=...': 'Execute queries via URL',
      'POST /cubejs-api/v1/sql': 'Generate SQL without execution',
      'GET /api/analytics-pages': 'List all dashboards',
      'POST /api/analytics-pages': 'Create new dashboard',
      'POST /api/analytics-pages/create-example': 'Create example dashboard',
      'POST /api/ai/generate': 'Generate content with Gemini AI (proxy)',
      'GET /api/ai/health': 'AI service health check'
    },
    frontend: {
      'React Dashboard': 'http://localhost:3000',
      'pgAdmin': 'http://localhost:5050'
    },
    database: {
      'PostgreSQL': 'localhost:54921'
    }
  })
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API documentation endpoint
app.get('/api/docs', (c) => {
  // Get metadata from the cube app (we could also create a temporary semantic layer for this)
  // For now, we'll provide static documentation. In a real app, you might extract this from the cubes
  const metadata = allCubes.map(cube => ({
    name: cube.name,
    title: cube.title || cube.name,
    description: cube.description,
    dimensions: Object.keys(cube.dimensions || {}),
    measures: Object.keys(cube.measures || {})
  }))
  
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
        dimensions: ['Departments.name'],
        cubes: ['Employees', 'Departments']
      },
      'Salary analytics': {
        measures: ['Employees.avgSalary', 'Employees.totalSalary'],
        dimensions: ['Departments.name'],
        cubes: ['Employees', 'Departments']
      },
      'Active employees only': {
        measures: ['Employees.activeCount'],
        dimensions: ['Departments.name'],
        cubes: ['Employees', 'Departments'],
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
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext,
  engineType: 'postgres',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
})

// Mount cube routes under the main app
app.route('/', cubeApp)

// Mount analytics pages API with database access
app.use('/api/analytics-pages/*', async (c, next) => {
  c.set('db', db)
  await next()
})
app.route('/api/analytics-pages', analyticsApp)

// Mount AI proxy routes with database access
app.use('/api/ai/*', async (c, next) => {
  c.set('db', db)
  await next()
})
app.route('/api/ai', aiApp)

// Example protected endpoint showing how to use the same security context
app.get('/api/user-info', async (c) => {
  try {
    const securityContext = await extractSecurityContext(c)
    
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
export { db }