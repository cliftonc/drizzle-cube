import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  resolve: {
    alias: {
      '@drizzle-cube/server': resolve(__dirname, '../../src/server'),
      '@drizzle-cube/client': resolve(__dirname, '../../src/client'),
      '@drizzle-cube/adapters': resolve(__dirname, '../../src/adapters')
    }
  },
  server: {
    port: 5173,
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
  }
})