/**
 * Drizzle configuration for MySQL test database
 */

import type { Config } from 'drizzle-kit'

export default {
  schema: './tests/helpers/databases/mysql/schema.ts',
  out: './tests/helpers/databases/mysql/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3307,
    user: 'test',
    password: 'test',
    database: 'drizzle_cube_test'
  }
} satisfies Config