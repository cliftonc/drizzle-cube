import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'client',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/client-setup/setup.ts'],
    include: [
      'tests/client/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    environmentMatchGlobs: [
      ['tests/client/**', 'jsdom']
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: process.env.COVERAGE_DIR || './coverage',
      include: [
        'src/client/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'examples/',
        'dev/',
        'coverage/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        'src/client/index.ts',
        'src/client/charts.ts',
        'src/client/components.ts',
        'src/client/hooks.ts',
        'src/client/providers.ts',
        'src/client/utils.ts'
      ],
      thresholds: {
        global: {
          lines: 75,
          functions: 75,
          branches: 65,
          statements: 75
        },
        // More strict for core client utilities
        'src/client/client/': {
          lines: 90,
          functions: 90,
          branches: 80,
          statements: 90
        },
        'src/client/hooks/': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})