/**
 * Drizzle configuration for MySQL test database
 */

import type { Config } from 'drizzle-kit'

export default {
  schema: './schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3307,
    user: 'test',
    password: 'test',
    database: 'drizzle_cube_test'
  }
} satisfies Config