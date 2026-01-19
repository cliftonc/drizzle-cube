import { defineConfig } from 'vitest/config'

// DuckDB requires threads pool (not forks) because it uses file-level locking
// that doesn't allow multiple processes to access the same file.
// Threads share the same process, allowing concurrent read-only access.
const isDuckDB = process.env.TEST_DB_TYPE === 'duckdb'

export default defineConfig({
  test: {
    // Run both server and client test projects
    projects: [
      {
        // Server tests - Node environment
        extends: true,
        test: {
          name: 'server',
          globals: true,
          testTimeout: 30000,
          hookTimeout: 30000,
          // DuckDB needs threads pool for file-based concurrency
          // Also run single-threaded to avoid DuckDB prepared statement errors
          pool: isDuckDB ? 'threads' : 'forks',
          // Vitest 4: singleThread is now a top-level option
          ...(isDuckDB ? { singleThread: true } : {}),
          env: {
            NODE_ENV: 'test'
          },
          globalSetup: './tests/setup/globalSetup.ts',
          globalTeardown: './tests/setup/globalTeardown.ts',
          include: ['tests/**/*.{test,spec}.ts'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'tests/client/**'
          ],
        }
      },
      './vitest.config.client.ts'
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
