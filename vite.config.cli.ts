import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cli/index.ts'),
      formats: ['cjs'],
      fileName: 'index'
    },
    outDir: 'dist/cli',
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:util', 'fs', 'path'],
    },
    target: 'node18',
    minify: false,
  }
})
