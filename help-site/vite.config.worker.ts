import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/worker.ts'),
      name: 'worker',
      fileName: 'worker',
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    }
  },
  define: {
    global: 'globalThis',
  }
});