import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { cjsTypesMarker } from './vite.cjs-marker'

export default defineConfig({
  plugins: [
    dts({
      // Per-file declarations rooted at src/adapters so they land flat at
      // dist/adapters/* (e.g. dist/adapters/fastify/index.d.ts) matching
      // package.json#exports rather than nesting at dist/adapters/adapters. #877.
      // outDirs mirrors the same declarations into dist/cjs/adapters for the
      // require.types condition (CJS via the dist/cjs/package.json marker). #881.
      insertTypesEntry: false,
      include: ['src/adapters/**/*.ts'],
      exclude: ['src/adapters/index.ts'],
      entryRoot: 'src/adapters',
      outDirs: ['dist/adapters', 'dist/cjs/adapters']
    }),
    cjsTypesMarker()
  ],
  build: {
    lib: {
      entry: {
        'hono/index': resolve(__dirname, 'src/adapters/hono/index.ts'),
        'express/index': resolve(__dirname, 'src/adapters/express/index.ts'),
        'fastify/index': resolve(__dirname, 'src/adapters/fastify/index.ts'),
        'nextjs/index': resolve(__dirname, 'src/adapters/nextjs/index.ts'),
        'utils': resolve(__dirname, 'src/adapters/utils.ts'),
        'types': resolve(__dirname, 'src/adapters/types.ts'),
        'mcp-tools': resolve(__dirname, 'src/adapters/mcp-tools.ts')
      },
      formats: ['es', 'cjs']
    },
    outDir: 'dist/adapters',
    rollupOptions: {
      external: ['hono', 'express', 'fastify', '@fastify/cors', 'cors', 'next', 'next/server', '@anthropic-ai/sdk']
    }
  }
})
