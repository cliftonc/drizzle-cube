/**
 * Simple Express server for drizzle-cube demo
 */

import express from 'express'
import cors from 'cors'
import { createCubeRouter } from 'drizzle-cube/adapters/express'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { schema } from './schema'
import { allCubes } from './cubes'

const port = parseInt(process.env.PORT || '4001')
const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54922/drizzle_cube_db'

// Auto-detect database type
function isNeonUrl(url) {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

// Create database connection
function createDatabase(databaseUrl) {
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
const app = express()

// Basic middleware
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:4001'],
  credentials: true
}))

// Simple security context (demo user)
const extractSecurityContext = async (req, res) => {
  return {
    organisationId: 1,
    userId: 1
  }
}

// Create and mount cube routes
const cubeRouter = createCubeRouter({
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext,
  engineType: 'postgres'
})

app.use('/', cubeRouter)

// Serve static files from client dist
app.use(express.static('client/dist'))

// Root endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Drizzle Cube Express Example',
    version: '1.0.0',
    endpoints: {
      'GET /cubejs-api/v1/meta': 'Get cube metadata',
      'POST /cubejs-api/v1/load': 'Execute queries',
      'GET /': 'Frontend dashboard'
    },
    cubes: allCubes.map(cube => cube.name)
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`🚀 Express server running on http://localhost:${port}`)
  console.log(`📊 Cube API available at http://localhost:${port}/cubejs-api/v1/meta`)
  console.log(`🎯 Frontend will be at http://localhost:4000`)
})