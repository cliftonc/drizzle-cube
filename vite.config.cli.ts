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
      external: ['node:fs', 'node:fs/promises', 'node:os', 'node:path', 'node:process', 'node:readline/promises', 'node:util', 'fs', 'fs/promises', 'os', 'path', 'process', 'readline/promises'],
    },
    target: 'node18',
    minify: false,
  }
})
