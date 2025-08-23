/**
 * Cloudflare Worker entry point for Hono drizzle-cube example
 * This is the entry point for Cloudflare Workers runtime
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon, neonConfig } from '@neondatabase/serverless'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import type { SecurityContext, DrizzleDatabase } from 'drizzle-cube/server'
import { schema } from '../schema.js'
import { allCubes } from '../cubes.js'
import type { Schema } from '../schema.js'
import analyticsApp from './analytics-routes'
import aiApp from './ai-routes'
import { executeSeed } from './seed-utils.js'

// Configure Neon for Cloudflare Workers
neonConfig.poolQueryViaFetch = true

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

// Define environment interface for Cloudflare Workers
interface CloudflareEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
  DATABASE_URL: string
  NODE_ENV?: string
  GEMINI_API_KEY?: string
}

interface Variables {
  db: DrizzleDatabase<Schema>
}

// Security context extractor - same as main app
async function getSecurityContext(c: any): Promise<SecurityContext> {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    console.log('⚠️  No authorization header - using default demo user (organisation: 1)')
    return {
      organisationId: 1,
      userId: 1,
    }
  }
  
  try {
    authHeader.replace('Bearer ', '')
    return {
      organisationId: 1,
      userId: 1,
    }
  } catch (error) {
    console.log('⚠️  Invalid authorization token - using default demo user (organisation: 1)')
    return {
      organisationId: 1,
      userId: 1,
    }
  }
}

const app = new Hono<{ Variables: Variables; Bindings: CloudflareEnv }>()

// Add middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Initialize database and semantic layer per request
app.use('*', async (c, next) => {
  // Create database connection based on URL type
  const db = createDatabase(c.env.DATABASE_URL)
  c.set('db', db)
  
  await next()
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    runtime: 'Cloudflare Workers'
  })
})

// Create cube app using the new API
const createCubeApiApp = (db: DrizzleDatabase<Schema>) => {
  return createCubeApp({
    cubes: allCubes,
    drizzle: db,
    schema,
    extractSecurityContext: getSecurityContext,
    engineType: 'postgres',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }
  })
}

// Create a separate Hono app for cube API
const cubeApiApp = new Hono<{ Variables: Variables; Bindings: CloudflareEnv }>()

cubeApiApp.use('*', async (c) => {
  const db = c.get('db')
  
  // Create and use cube app for this request
  const cubeApp = createCubeApiApp(db)

  // Forward the request to the cube app
  const response = await cubeApp.fetch(c.req.raw)
  return response
})

// Mount the cube API routes
app.route('/cubejs-api', cubeApiApp)


// API info endpoint
app.get('/api', (c) => {
  return c.json({
    name: 'Drizzle Cube Analytics API (Cloudflare Workers)',
    version: '1.0.0',
    status: 'running',
    runtime: 'Cloudflare Workers',
    endpoints: {
      'GET /api': 'This endpoint - API information',
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
    }
  })
})

// Mount analytics pages API with database access
app.use('/api/analytics-pages/*', async (c, next) => {
  c.set('db', c.get('db'))
  await next()
})
app.route('/api/analytics-pages', analyticsApp)

// Mount AI proxy routes with database access
app.use('/api/ai/*', async (c, next) => {
  c.set('db', c.get('db'))
  await next()
})
app.route('/api/ai', aiApp)

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

// Serve static assets and handle SPA routing
app.get('*', async (c) => {
  // Use the ASSETS binding to serve static files with SPA fallback
  return await c.env.ASSETS.fetch(c.req.raw)
})

// Scheduled event handler for cron triggers
async function scheduled(_event: any, env: CloudflareEnv, _ctx: any): Promise<void> {
  console.log('🕒 Scheduled event triggered at:', new Date().toISOString())
  
  try {
    // Create database connection based on URL type
    const db = createDatabase(env.DATABASE_URL)
    
    console.log('🌱 Starting scheduled database seeding...')
    const result = await executeSeed(db)
    
    if (result.success) {
      console.log('✅ Scheduled database seeding completed successfully')
    } else {
      console.error('❌ Scheduled database seeding failed:', result.error)
      throw new Error(`Seeding failed: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Scheduled event error:', error)
    throw error
  }
}

export default {
  fetch: app.fetch,
  scheduled
}

