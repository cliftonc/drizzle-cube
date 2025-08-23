/**
 * Server entry point for Hono drizzle-cube example
 */

import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from '../app'

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Starting Hono server on http://localhost:${port}`)
console.log(`📊 Analytics API available at http://localhost:${port}/cubejs-api/v1/meta`)
console.log(`📖 API documentation at http://localhost:${port}/api/docs`)

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ Server running on port ${port}`)