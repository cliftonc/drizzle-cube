import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'drizzle-cube/client': path.resolve(__dirname, '../../../src/client'),
      'drizzle-cube/server': path.resolve(__dirname, '../../../src/server'), 
      'drizzle-cube': path.resolve(__dirname, '../../../src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to the Hono server
      '/cubejs-api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist'
  }
})