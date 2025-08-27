import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    env: {
      NODE_ENV: 'test'
    },
    globalSetup: './tests/setup/globalSetup.ts',
    globalTeardown: './tests/setup/globalTeardown.ts',
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
        // More strict for core server components
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