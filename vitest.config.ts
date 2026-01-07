import { defineConfig } from 'vitest/config'

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
