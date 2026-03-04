/**
 * Server entry point for dev server
 */

import dotenv from 'dotenv'
import { serve } from '@hono/node-server'

// Load environment variables from dev/.env BEFORE importing app
// (static imports are hoisted, so we must use dynamic import)
dotenv.config({ path: 'dev/.env' })

const { default: app } = await import('./app.js')

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Starting Drizzle Cube dev server on http://localhost:${port}`)
console.log(`📊 Analytics API available at http://localhost:${port}/cubejs-api/v1/meta`)
console.log(`📖 API documentation at http://localhost:${port}/api/docs`)
console.log(`🤖 AI API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured (set GEMINI_API_KEY in dev/.env)'}`)

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ Dev server running on port ${port}`)