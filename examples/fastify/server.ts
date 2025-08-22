/**
 * Simple Fastify server for drizzle-cube demo
 */

import fastify from 'fastify'
import { cubePlugin } from 'drizzle-cube/adapters/fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { schema } from './schema'
import { allCubes } from './cubes'

const port = parseInt(process.env.PORT || '4011')
const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54923/drizzle_cube_db'

// Auto-detect database type
function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

// Create database connection
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

const db = createDatabase(connectionString)

// Simple security context (demo user)
const extractSecurityContext = async (request: any) => {
  return {
    organisationId: 1,
    userId: 1
  }
}

// Start server
const start = async () => {
  // Create Fastify instance
  const app = fastify({
    logger: true
  })

  try {
    // Register CORS plugin
    await app.register(import('@fastify/cors'), {
      origin: ['http://localhost:4010', 'http://localhost:4011'],
      credentials: true
    })

    // Register static file plugin
    await app.register(import('@fastify/static'), {
      root: new URL('./client/dist', import.meta.url).pathname,
      prefix: '/public/'
    })

    // Register cube plugin
    await app.register(cubePlugin, {
      cubes: allCubes,
      drizzle: db,
      schema,
      extractSecurityContext,
      engineType: 'postgres'
    })

    // Info endpoint
    app.get('/api/info', async (request, reply) => {
      return {
        name: 'Drizzle Cube Fastify Example',
        version: '1.0.0',
        endpoints: {
          'GET /cubejs-api/v1/meta': 'Get cube metadata',
          'POST /cubejs-api/v1/load': 'Execute queries',
          'GET /': 'Frontend dashboard'
        },
        cubes: allCubes.map(cube => cube.name)
      }
    })

    // Health check
    app.get('/health', async (request, reply) => {
      return { status: 'ok' }
    })

    // Start listening
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Fastify server running on http://localhost:${port}`)
    console.log(`📊 Cube API available at http://localhost:${port}/cubejs-api/v1/meta`)
    console.log(`🎯 Frontend will be at http://localhost:4010`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()