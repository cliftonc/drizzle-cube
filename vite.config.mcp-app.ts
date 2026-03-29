import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: resolve(__dirname, 'src/mcp-app'),
  build: {
    outDir: resolve(__dirname, 'dist/mcp-app'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/mcp-app/mcp-app.html'),
    },
  },
})
