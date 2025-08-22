import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/cubejs-api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})