import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/adapters/**/*.ts']
    })
  ],
  build: {
    lib: {
      entry: {
        'hono/index': resolve(__dirname, 'src/adapters/hono/index.ts')
      },
      formats: ['es']
    },
    outDir: 'dist/adapters',
    rollupOptions: {
      external: ['hono']
    }
  }
})