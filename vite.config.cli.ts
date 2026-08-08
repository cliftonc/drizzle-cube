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
      external: [
        'node:fs', 'node:path', 'node:util', 'node:fs/promises',
        'node:readline/promises', 'node:process', 'node:os',
        'fs', 'path', 'fs/promises', 'readline/promises', 'process', 'os',
      ],
    },
    target: 'node18',
    minify: false,
  }
})
