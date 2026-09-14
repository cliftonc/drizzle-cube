import { defineConfig } from 'vitest/config'

// DuckDB and Databend require threads pool instead of forks:
// - DuckDB uses file-level locking that doesn't allow multiple processes
// - Databend (single-node Docker) gets overwhelmed by parallel fork connections
const isDuckDB = process.env.TEST_DB_TYPE === 'duckdb'
const isDatabend = process.env.TEST_DB_TYPE === 'databend'
const isSnowflake = process.env.TEST_DB_TYPE === 'snowflake'
const useSingleThreadPool = isDuckDB || isDatabend || isSnowflake

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
    // DuckDB/Databend need threads pool to avoid overwhelming the database
    // Other databases can use the default forks pool
    pool: useSingleThreadPool ? 'threads' : 'forks',
    // Serialize test file execution for the engines that cannot take concurrent
    // workers:
    // - Databend single-node is memory-hungry and crashes under concurrent load
    // - Snowflake is rate-limited and remote
    // - DuckDB's native prepared-statement execution is not safe across worker
    //   threads: the same workload over 8 threads produces ~1% "Failed to execute
    //   prepared statement" errors, versus ~0.03% on a single thread
    //
    // This must be maxWorkers. Vitest 4 ignores the maxThreads/minThreads keys
    // this previously used, so the limit silently never applied.
    ...(useSingleThreadPool ? { maxWorkers: 1 } : {}),
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
      'tests/cli/**',
      'tests/client/**',
      'tests/e2e/**'
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
