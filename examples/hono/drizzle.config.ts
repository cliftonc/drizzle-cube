/**
 * Drizzle configuration for the Hono example
 */

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb'
  },
  verbose: true,
  strict: true
})