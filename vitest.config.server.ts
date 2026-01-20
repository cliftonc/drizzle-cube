import { defineConfig } from 'vitest/config'

// DuckDB requires threads pool (not forks) because it uses file-level locking
// that doesn't allow multiple processes to access the same file.
// Threads share the same process, allowing concurrent read-only access.
const isDuckDB = process.env.TEST_DB_TYPE === 'duckdb'

/**
 * Server-only test configuration
 * Used when running `pnpm test:server` to skip client tests
 */
export default defineConfig({
  test: {
    name: 'server',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // DuckDB needs threads pool for file-based concurrency
    // Other databases can use the default forks pool
    pool: isDuckDB ? 'threads' : 'forks',
    // Retry failed tests for DuckDB only (handles intermittent prepared statement errors)
    retry: isDuckDB ? 2 : 0,
    env: {
      NODE_ENV: 'test'
    },
    globalSetup: './tests/setup/globalSetup.ts',
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      'tests/client/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: process.env.COVERAGE_DIR || './coverage',
      include: [
        'src/server/**/*.ts',
        'src/adapters/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/types.ts'
      ],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        },
        'src/server/': {
          lines: 90,
          functions: 90,
          branches: 80,
          statements: 90
        }
      }
    }
  },
})
