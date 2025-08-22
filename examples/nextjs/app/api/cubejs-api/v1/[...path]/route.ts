/**
 * Next.js API route handler for drizzle-cube
 * Handles all Cube.js API endpoints via catch-all route
 */

import { NextRequest } from 'next/server'
import { createCubeHandlers } from 'drizzle-cube/adapters/nextjs'
import { db } from '@/lib/db'
import { schema } from '@/schema'
import { allCubes } from '@/cubes'

// Simple security context for demo purposes
const extractSecurityContext = async () => {
  return {
    organisationId: 1,
    userId: 1
  }
}

// Create all cube handlers
const handlers = createCubeHandlers({
  cubes: allCubes,
  drizzle: db as never, // Type assertion to handle version compatibility
  schema,
  extractSecurityContext,
  engineType: 'postgres',
  cors: {
    origin: ['http://localhost:6001', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
})

// Route the request to the appropriate handler based on the path
async function routeHandler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathArray } = await params
  const path = pathArray.join('/')
  
  // Handle different Cube.js API endpoints
  if (path === 'load') {
    return handlers.load(request)
  } else if (path === 'meta') {
    return handlers.meta(request)
  } else if (path === 'sql') {
    return handlers.sql(request)
  } else if (path === 'dry-run') {
    return handlers.dryRun(request)
  } else {
    // Return 404 for unknown paths
    return new Response('Not Found', { status: 404 })
  }
}

// Export HTTP method handlers
export const GET = routeHandler
export const POST = routeHandler
export const OPTIONS = async () => {
  // Handle CORS preflight requests
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:6001',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}