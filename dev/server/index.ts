/**
 * Server entry point for dev server
 */

import { serve } from '@hono/node-server'
import app from './app.js'

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Starting Drizzle Cube dev server on http://localhost:${port}`)
console.log(`📊 Analytics API available at http://localhost:${port}/cubejs-api/v1/meta`)
console.log(`📖 API documentation at http://localhost:${port}/api/docs`)

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ Dev server running on port ${port}`)