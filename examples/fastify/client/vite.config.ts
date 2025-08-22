import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4010,
    proxy: {
      '/cubejs-api': {
        target: 'http://localhost:4011',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})