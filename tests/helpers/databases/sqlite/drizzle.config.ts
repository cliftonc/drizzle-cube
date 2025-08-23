import type { Config } from 'drizzle-kit'

export default {
  schema: './tests/helpers/databases/sqlite/schema.ts',
  out: './tests/helpers/databases/sqlite/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './test.db'
  }
} satisfies Config