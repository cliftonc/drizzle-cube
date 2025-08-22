import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      include: ['src/adapters/**/*.ts'],
      outDir: 'dist'
    })
  ],
  build: {
    lib: {
      entry: {
        'hono/index': resolve(__dirname, 'src/adapters/hono/index.ts'),
        'express/index': resolve(__dirname, 'src/adapters/express/index.ts'),
        'fastify/index': resolve(__dirname, 'src/adapters/fastify/index.ts'),
        'nextjs/index': resolve(__dirname, 'src/adapters/nextjs/index.ts')
      },
      formats: ['es']
    },
    outDir: 'dist/adapters',
    rollupOptions: {
      external: ['hono', 'express', 'fastify', '@fastify/cors', 'cors', 'next', 'next/server']
    }
  }
})