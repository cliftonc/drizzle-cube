/**
 * Drizzle configuration for the Fastify example
 */

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54923/drizzle_cube_db'
  },
  verbose: true,
  strict: true
})