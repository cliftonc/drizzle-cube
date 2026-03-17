import { defineConfig } from 'vitest/config'

// DuckDB and Databend require threads pool instead of forks:
// - DuckDB uses file-level locking that doesn't allow multiple processes
// - Databend (single-node Docker) gets overwhelmed by parallel fork connections
const isDuckDB = process.env.TEST_DB_TYPE === 'duckdb'
const isDatabend = process.env.TEST_DB_TYPE === 'databend'
const useSingleThreadPool = isDuckDB || isDatabend

// When TEST_DB_TYPE is set, we're running database-specific server tests only
// No need to run client tests (they don't use any database)
const isDbSpecificRun = !!process.env.TEST_DB_TYPE

export default defineConfig({
  test: {
    // Run both server and client test projects (skip client for DB-specific runs)
    projects: [
      {
        // Server tests - Node environment
        extends: true,
        test: {
          name: 'server',
          globals: true,
          testTimeout: 30000,
          hookTimeout: 30000,
          // DuckDB/Databend need threads pool to avoid overwhelming the database
          pool: useSingleThreadPool ? 'threads' : 'forks',
          // DuckDB: single-threaded to avoid prepared statement errors
          ...(isDuckDB ? { singleThread: true } : {}),
          // Databend: limit to 1 worker to prevent server crash under load
          ...(isDatabend ? { maxThreads: 1, minThreads: 1 } : {}),
          env: {
            NODE_ENV: 'test'
          },
          globalSetup: './tests/setup/globalSetup.ts',
          globalTeardown: './tests/setup/globalTeardown.ts',
          include: ['tests/**/*.{test,spec}.ts'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'tests/client/**',
            'tests/e2e/**'
          ],
        }
      },
      // Only include client tests when not running DB-specific tests
      ...(isDbSpecificRun ? [] : ['./vitest.config.client.ts']),
    ],
    // Coverage config at root level (required for projects)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: process.env.COVERAGE_DIR || './coverage',
      include: [
        'src/server/**/*.ts',
        'src/adapters/**/*.ts',
        'src/client/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types.ts',
        'node_modules/',
        'tests/',
        'dist/',
        'examples/',
        'dev/',
        'coverage/',
      ],
    }
  },
})
