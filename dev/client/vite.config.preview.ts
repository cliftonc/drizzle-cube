import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Preview configuration for testing built dist/ assets.
 * Use this to verify bundling works before publishing.
 *
 * Usage:
 *   pnpm preview        - Builds library + dev app, then serves static files
 *   pnpm preview:build  - Just build the dev app using dist/ (assumes library is built)
 *   pnpm preview:serve  - Just serve the already-built preview app
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point to built dist/ files instead of source
      '@drizzle-cube/server': resolve(__dirname, '../../dist/server'),
      '@drizzle-cube/client': resolve(__dirname, '../../dist/client'),
      '@drizzle-cube/adapters': resolve(__dirname, '../../dist/adapters')
    }
  },
  build: {
    outDir: 'dist-preview',
    emptyOutDir: true
  },
  preview: {
    port: 5174,
    proxy: {
      '/cubejs-api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
