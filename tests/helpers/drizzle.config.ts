/**
 * Drizzle configuration for test database
 * This config is isolated to the test environment
 */

import type { Config } from 'drizzle-kit'

export default {
  schema: './schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test'
  }
} satisfies Config